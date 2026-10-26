fn main() {
    // Scan the project for Tailwind classes and generate the stylesheet.
    hearth::tailwind::BuildConfig::new().render().unwrap();
}
