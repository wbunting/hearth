use toasty::Db;
use topcoat::context::{Cx, app_context};

/// Override with `DATABASE_URL` (e.g. a Turso URL when deployed).
const DEFAULT_DATABASE_URL: &str = concat!("sqlite:", env!("CARGO_MANIFEST_DIR"), "/data.db");

pub async fn connect() -> toasty::Result<Db> {
    let url = std::env::var("DATABASE_URL").unwrap_or_else(|_| DEFAULT_DATABASE_URL.to_owned());
    Db::builder()
        .models(toasty::models!(crate::*))
        .connect(&url)
        .await
}

/// Deletes the default local database file (and its WAL/SHM side files).
pub fn remove_local_file() {
    if std::env::var("DATABASE_URL").is_ok() {
        panic!("refusing to delete a database configured with DATABASE_URL");
    }
    let path = DEFAULT_DATABASE_URL.trim_start_matches("sqlite:");
    for suffix in ["", "-wal", "-shm", "-journal"] {
        let _ = std::fs::remove_file(format!("{path}{suffix}"));
    }
}

pub fn db(cx: &Cx) -> Db {
    app_context::<Db>(cx).clone()
}

pub fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64
}
