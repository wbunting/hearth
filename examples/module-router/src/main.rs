mod app;

#[tokio::main]
async fn main() {
    hearth::start(app::router()).await.unwrap();
}
