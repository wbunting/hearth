//! hearth-tracker: a Linear/Jira-style tracker (after Zero's zbugs) written
//! in Rust only on hearth. No app JavaScript or TypeScript.
//!
//! cargo run -p hearth-tracker -- seed [--synthetic 50000]
//! PORT=3100 topcoat dev -p hearth-tracker

mod app;
mod auth;
mod db;
mod model;
mod seed;
mod tables;

#[tokio::main]
async fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.first().map(String::as_str) == Some("seed") {
        let synthetic = args
            .iter()
            .position(|a| a == "--synthetic")
            .and_then(|i| args.get(i + 1))
            .map(|n| n.parse().expect("--synthetic takes a number"))
            .unwrap_or(0);
        db::remove_local_file();
        let mut db = db::connect().await.unwrap();
        seed::seed(&mut db, synthetic).await.unwrap();
        return;
    }
    let db = db::connect().await.unwrap();
    topcoat::start(app::router().app_context(db).build()).await.unwrap();
}
