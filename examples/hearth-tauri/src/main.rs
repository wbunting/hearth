//! Runs the planner in an ordinary browser over loopback, without Tauri.
//!
//! ```sh
//! cargo build --release -p hearth-tauri
//! hearth asset bundle --release -p hearth-tauri
//! ./target/release/hearth-tauri-server [path/to/planner.db]
//! ```
//!
//! Prints a one-time URL carrying the launch token.

use hearth::asset::AssetBundle;
use hearth_tauri::{LaunchToken, Timeline, open_db, router, serve_loopback};

#[tokio::main]
async fn main() {
    let timeline = Timeline::start();
    let path = std::env::args().nth(1).map_or_else(
        || std::env::temp_dir().join("hearth-tauri/planner.db"),
        Into::into,
    );
    let db = open_db(&path).await.expect("open database");
    timeline.mark("database open");
    let token = LaunchToken::generate();
    let enter = token.enter_path();
    let app = router(db, AssetBundle::load().expect("asset bundle"), Some(token));
    timeline.mark("router built");
    let addr = serve_loopback(app).await.expect("bind loopback");
    timeline.mark("listening");
    println!("database: {}", path.display());
    println!("open: http://{addr}{enter}");
    std::future::pending::<()>().await;
}
