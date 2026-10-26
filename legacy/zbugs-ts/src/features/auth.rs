//! Session auth plus the read scope every data endpoint goes through.

use std::time::UNIX_EPOCH;

use hearth::{
    Result,
    context::{Cx, memoize},
    router::error::{RouterErrorExt, forbidden, internal_server_error},
    session,
};

use super::model::{Session, User};
use crate::db::{db, now_ms};

pub async fn sign_in(cx: &Cx, user_id: &str) -> Result<()> {
    let mut db = db(cx);
    // Only seeded users can sign in; this is a demo login picker.
    User::get_by_id(&mut db, user_id).await.map_err(|_| forbidden())?;
    let session = session::start(cx).await?;
    let expires_at = session
        .expires_at
        .duration_since(UNIX_EPOCH)
        .map_err(internal_server_error)?
        .as_millis() as i64;
    toasty::create!(Session {
        token_hash: session.token_hash.to_vec(),
        user_id: user_id.to_owned(),
        expires_at,
    })
    .exec(&mut db)
    .await?;
    Ok(())
}

pub async fn sign_out(cx: &Cx) -> Result<()> {
    if let Some(hash) = session::stop(cx).await? {
        Session::filter_by_token_hash(hash.to_vec()).delete().exec(&mut db(cx)).await?;
    }
    Ok(())
}

#[memoize(as_ref)]
pub async fn current_user(cx: &Cx) -> Result<Option<User>> {
    let Some(hash) = session::token_hash(cx).await? else {
        return Ok(None);
    };
    let mut db = db(cx);
    let Some(s) = Session::filter_by_token_hash(hash.to_vec()).first().exec(&mut db).await? else {
        return Ok(None);
    };
    if s.expires_at < now_ms() {
        return Ok(None);
    }
    Ok(Some(User::get_by_id(&mut db, &s.user_id).await?))
}

/// What the current request may read. Every collection endpoint and every
/// SSR snapshot must go through this. Shards and routes bypass layouts.
#[derive(Debug, Clone)]
pub struct ReadScope {
    pub user_id: String,
    pub crew: bool,
}

impl ReadScope {
    pub fn can_see_issue(&self, visibility: &str) -> bool {
        self.crew || visibility == "public"
    }

    /// Changes whenever the visible row set could change; clients wipe and
    /// reload collections (and later the persisted DB) when it differs.
    pub fn fingerprint(&self) -> String {
        format!("{}:{}", self.user_id, if self.crew { "crew" } else { "user" })
    }
}

pub async fn read_scope(cx: &Cx) -> Result<ReadScope> {
    let user = current_user(cx).await.map_err(Clone::clone)?.as_ref().ok_or_redirect("/login")?;
    Ok(ReadScope { user_id: user.id.clone(), crew: user.is_crew() })
}
