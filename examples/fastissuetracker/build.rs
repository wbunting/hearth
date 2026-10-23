fn main() {
    // Scan src/ for Tailwind classes (including those inside `$()` client
    // expressions, which are literals in the Rust source) and build the CSS.
    topcoat::tailwind::BuildConfig::new().input("src/app.css").render().unwrap();
}
