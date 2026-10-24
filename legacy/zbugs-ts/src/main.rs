mod app;
mod client_schema;
mod db;
mod features;
mod seed;
mod tables;

#[tokio::main]
async fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match args.first().map(String::as_str) {
        // cargo run -- seed [--synthetic N]: recreates the local SQLite file.
        Some("seed") => {
            db::remove_local_file();
            let mut db = db::connect().await.unwrap();
            let synthetic = args
                .iter()
                .position(|a| a == "--synthetic")
                .and_then(|i| args.get(i + 1))
                .map(|n| n.parse().expect("--synthetic takes a number"))
                .unwrap_or(0);
            seed::seed(&mut db, synthetic).await.unwrap();
        }
        _ => {
            let db = db::connect().await.unwrap();
            // Built once from the Toasty schema; embedded in every app page.
            let schema = client_schema::build(&db);
            topcoat::start(app::router().app_context(db).app_context(schema).build()).await.unwrap();
        }
    }
}
