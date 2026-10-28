//! Single-user local auth.
//!
//! There is no login. Requests still prove they come from this app's own
//! webview, so another local process or a web page cannot read or write the
//! database through a loopback port:
//!
//! - In-process transport (Tauri custom URI scheme): the host passes [`Trusted`] as a request
//!   context value. It cannot be sent over HTTP.
//! - Loopback TCP: the app generates a random token at launch and opens `/_local/enter?token=...`.
//!   That route sets an `HttpOnly`, `SameSite=Strict` cookie and redirects to `/`. Every other
//!   request must carry the cookie.
//!
//! Either path installs [`Owner`] and a [`Principal`](hearth::sync::Principal)
//! so table scopes and delta cursors work as they do with sessions.

use hearth::{
    Result,
    context::{Cx, try_app_context, try_request_context},
    cookie::{Cookies, cookie, cookies},
    router::{
        Body, Layer, LayerFuture, Next, Path,
        error::{forbidden, see_other, unauthorized},
        request,
        response::Response,
    },
};

const COOKIE: &str = "hearth-local";
const ENTER: &str = "/_local/enter";

/// Marks a request delivered in process by the app host, not over a socket.
#[derive(Debug, Clone, Copy)]
pub struct Trusted;

/// The per-launch secret for loopback TCP requests.
#[derive(Clone)]
pub struct LaunchToken(String);

impl LaunchToken {
    /// A fresh random token.
    #[must_use]
    pub fn generate() -> Self {
        Self(format!(
            "{}{}",
            uuid::Uuid::new_v4().simple(),
            uuid::Uuid::new_v4().simple()
        ))
    }

    /// The URL path that exchanges the token for a cookie.
    #[must_use]
    pub fn enter_path(&self) -> String {
        format!("{ENTER}?token={}", self.0)
    }

    fn matches(&self, candidate: &str) -> bool {
        let (a, b) = (self.0.as_bytes(), candidate.as_bytes());
        a.len() == b.len() && a.iter().zip(b).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
    }
}

/// The local user. Present in request context once a request is authorized.
#[derive(Debug, Clone, Copy)]
pub struct Owner;

/// The single local owner, or 401 when the request is not from the app.
///
/// # Errors
///
/// Returns 401 when the request was not authorized by [`LocalAuth`].
pub fn owner(cx: &Cx) -> Result<Owner> {
    try_request_context::<Owner>(cx)
        .copied()
        .ok_or_else(|| unauthorized().into())
}

/// Cache namespace for the browser store. One user, so one constant scope.
pub const VIEWER_SCOPE: &str = "local-owner";

/// Authorizes every request. See the module docs.
pub struct LocalAuth;

impl Layer for LocalAuth {
    // A pathless layer runs outside every layer with a path, including the
    // cookie layer at "/". Sit at "/" so the cookie jar exists.
    fn path(&self) -> Option<&Path> {
        Some(Path::new("/"))
    }

    fn handle<'a>(&'a self, cx: &'a Cx, body: Body, next: Next<'a>) -> LayerFuture<'a> {
        Box::pin(async move {
            if try_request_context::<Trusted>(cx).is_some() {
                return next.run(&authorized(cx), body).await;
            }
            let Some(token) = try_app_context::<LaunchToken>(cx) else {
                return Err(forbidden().into());
            };
            let uri = request::uri(cx);
            if uri.path() == ENTER {
                return enter(cx, token, uri.query().unwrap_or(""));
            }
            let ok = cookies(cx)
                .get(COOKIE)
                .is_some_and(|c| token.matches(c.value()));
            if ok {
                next.run(&authorized(cx), body).await
            } else {
                Err(unauthorized().into())
            }
        })
    }
}

fn authorized(cx: &Cx) -> Cx {
    // One identity for cursors. A constant is fine: there is one viewer.
    cx.with(Owner).with(hearth::sync::Principal(
        *b"hearth-tauri-local-owner-0000001",
    ))
}

/// Exists so the router matches the path; [`LocalAuth`] answers first.
#[hearth::router::route(GET "/_local/enter")]
async fn enter_route() -> Result<&'static str> {
    Err(unauthorized().into())
}

fn enter(cx: &Cx, token: &LaunchToken, query: &str) -> Result<Response> {
    let given = query
        .split('&')
        .find_map(|kv| kv.strip_prefix("token="))
        .unwrap_or("");
    if !token.matches(given) {
        return Err(unauthorized().into());
    }
    cookies(cx).add(cookie!(COOKIE = token.0.clone(); Path = "/"; HttpOnly; SameSite = Strict));
    Err(see_other("/").into())
}
