#[tokio::main]
async fn main() {
    let mut args = std::env::args_os().peekable();
    let program = args.next();
    // Cargo passes the subcommand name as the first argument.
    if args.peek().is_some_and(|arg| arg == "hearth") {
        args.next();
    }
    hearth_cli::run_from(program.into_iter().chain(args)).await;
}
