//! Bounded process-local protection for the public illustrative demo.

use std::{
    collections::HashMap,
    net::{IpAddr, Ipv4Addr},
    sync::Mutex,
    time::{Duration, Instant},
};

use hearth::{
    context::Cx,
    router::{Body, Layer, LayerFuture, Next, Path, error::too_many_requests, request},
};

const WINDOW: Duration = Duration::from_secs(60);
const MAX_CLIENTS: usize = 4096;
const REQUESTS_PER_WINDOW: u32 = 120;
const NEW_VISITORS_PER_WINDOW: u32 = 12;
const GLOBAL_NEW_VISITORS: u32 = 120;

#[derive(Default)]
struct Counts {
    requests: u32,
    new_visitors: u32,
}

struct State {
    since: Instant,
    clients: HashMap<IpAddr, Counts>,
    new_visitors: u32,
}

pub struct RateLimit(Mutex<State>);

impl Default for RateLimit {
    fn default() -> Self {
        Self(Mutex::new(State {
            since: Instant::now(),
            clients: HashMap::new(),
            new_visitors: 0,
        }))
    }
}

impl RateLimit {
    fn admit(&self, client: IpAddr, new_visitor: bool, now: Instant) -> bool {
        let mut state = self
            .0
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        if now.duration_since(state.since) >= WINDOW {
            state.since = now;
            state.clients.clear();
            state.new_visitors = 0;
        }
        if !state.clients.contains_key(&client) && state.clients.len() >= MAX_CLIENTS {
            return false;
        }
        if new_visitor && state.new_visitors >= GLOBAL_NEW_VISITORS {
            return false;
        }
        let counts = state.clients.entry(client).or_default();
        if counts.requests >= REQUESTS_PER_WINDOW
            || (new_visitor && counts.new_visitors >= NEW_VISITORS_PER_WINDOW)
        {
            return false;
        }
        counts.requests += 1;
        if new_visitor {
            counts.new_visitors += 1;
            state.new_visitors += 1;
        }
        true
    }
}

impl Layer for RateLimit {
    fn path(&self) -> Option<&Path> {
        None
    }

    fn handle<'a>(&'a self, cx: &'a Cx, body: Body, next: Next<'a>) -> LayerFuture<'a> {
        Box::pin(async move {
            let path = request::uri(cx).path();
            // Immutable assets are CDN-cacheable; health checks must stay cheap.
            if path == "/healthz"
                || path.starts_with("/_hearth/assets/")
                || path.starts_with("/_hearth/fonts/")
            {
                return next.run(cx, body).await;
            }
            // Count every landing request against the stricter budget. A caller
            // can forge an unknown but valid cookie, so cookie presence cannot
            // safely exempt requests that may allocate a fresh demo dataset.
            let new_visitor = path == "/";
            let client = request::client_ip(cx).unwrap_or(IpAddr::V4(Ipv4Addr::UNSPECIFIED));
            if !self.admit(client, new_visitor, Instant::now()) {
                return Err(too_many_requests(60).into());
            }
            let mut response = next.run(cx, body).await?;
            response.headers_mut().insert(
                "x-content-type-options",
                hearth::router::HeaderValue::from_static("nosniff"),
            );
            response.headers_mut().insert(
                "referrer-policy",
                hearth::router::HeaderValue::from_static("strict-origin-when-cross-origin"),
            );
            Ok(response)
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn pathless_limit_does_not_require_cookie_middleware_context() {
        use hearth::router::{Router, route};
        #[route(GET "/__rate_limit_probe")]
        async fn probe() -> hearth::Result<&'static str> {
            Ok("ready")
        }
        let router = Router::builder()
            .route(probe)
            .layer(RateLimit::default())
            .build();
        for _ in 0..REQUESTS_PER_WINDOW {
            let response = router
                .handle(
                    http::Request::builder()
                        .uri("/__rate_limit_probe")
                        .body(Body::empty())
                        .unwrap(),
                )
                .await;
            assert_eq!(response.status(), 200);
        }
        let response = router
            .handle(
                http::Request::builder()
                    .uri("/__rate_limit_probe")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await;
        assert_eq!(response.status(), 429);
        assert_eq!(response.headers()["retry-after"], "60");
    }

    #[test]
    fn new_visitors_are_limited_by_ip_and_reset_after_the_window() {
        let limit = RateLimit::default();
        let now = Instant::now();
        let ip = "198.51.100.1".parse().unwrap();
        for _ in 0..NEW_VISITORS_PER_WINDOW {
            assert!(limit.admit(ip, true, now));
        }
        assert!(!limit.admit(ip, true, now));
        assert!(limit.admit("198.51.100.2".parse().unwrap(), true, now));
        assert!(limit.admit(ip, true, now + WINDOW));
    }

    #[test]
    fn total_requests_and_client_storage_are_bounded() {
        let limit = RateLimit::default();
        let now = Instant::now();
        let ip = "198.51.100.1".parse().unwrap();
        for _ in 0..REQUESTS_PER_WINDOW {
            assert!(limit.admit(ip, false, now));
        }
        assert!(!limit.admit(ip, false, now));
        for n in 0..MAX_CLIENTS {
            let ip = IpAddr::V4(Ipv4Addr::from(u32::try_from(n).unwrap()));
            limit.admit(ip, false, now);
        }
        assert!(limit.0.lock().unwrap().clients.len() <= MAX_CLIENTS);
        assert!(!limit.admit("203.0.113.255".parse().unwrap(), false, now));
    }
}
