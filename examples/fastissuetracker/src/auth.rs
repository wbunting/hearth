//! Session auth and the per-request viewer every table scope uses.

use std::time::UNIX_EPOCH;

use topcoat::{
    Result,
    context::{Cx, memoize},
    router::error::{RouterErrorExt, forbidden, internal_server_error},
    session,
};

use crate::{
    db::now_ms,
    model::{Session, User},
};

pub async fn sign_in(cx: &Cx, user_id: &str) -> Result<()> {
    let mut db = fastcoat::db(cx);
    User::get_by_id(&mut db, user_id).await.map_err(|_| forbidden())?;
    let session = session::start(cx).await?;
    let expires_at = session.expires_at.duration_since(UNIX_EPOCH).map_err(internal_server_error)?.as_millis() as i64;
    toasty::create!(Session { token_hash: session.token_hash.to_vec(), user_id: user_id.to_owned(), expires_at })
        .exec(&mut db)
        .await?;
    Ok(())
}

pub async fn sign_out(cx: &Cx) -> Result<()> {
    if let Some(hash) = session::stop(cx).await? {
        Session::filter_by_token_hash(hash.to_vec()).delete().exec(&mut fastcoat::db(cx)).await?;
    }
    Ok(())
}

#[memoize(as_ref)]
pub async fn current_user(cx: &Cx) -> Result<Option<User>> {
    let Some(hash) = session::token_hash(cx).await? else { return Ok(None) };
    let mut db = fastcoat::db(cx);
    let Some(s) = Session::filter_by_token_hash(hash.to_vec()).first().exec(&mut db).await? else { return Ok(None) };
    if s.expires_at < now_ms() {
        return Ok(None);
    }
    Ok(Some(User::get_by_id(&mut db, &s.user_id).await?))
}

/// The signed-in viewer. Redirects to `/login` when there is none.
#[derive(Debug, Clone)]
pub struct Viewer {
    pub id: String,
    pub login: String,
    pub crew: bool,
}

impl Viewer {
    pub fn can_see(&self, visibility: &str) -> bool {
        self.crew || visibility == "public"
    }
    pub fn can_edit(&self, creator_id: &str) -> bool {
        self.crew || creator_id == self.id
    }
    /// Changes whenever the visible row set could; the client keys its
    /// local collections by it, so a different user/role never sees cached rows.
    pub fn fingerprint(&self) -> String {
        format!("{}:{}", self.id, if self.crew { "crew" } else { "user" })
    }
}

pub async fn viewer(cx: &Cx) -> Result<Viewer> {
    let user = current_user(cx).await.map_err(Clone::clone)?.as_ref().ok_or_redirect("/login")?;
    Ok(Viewer { id: user.id.clone(), login: user.login.clone(), crew: user.role == "crew" })
}
