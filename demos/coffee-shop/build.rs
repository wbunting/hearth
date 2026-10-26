fn main() {
    // The installed theme stylesheet is the Tailwind input: it carries the
    // `@import "tailwindcss"` directive and the theme's design tokens.
    hearth::tailwind::BuildConfig::new()
        .input("styles.css")
        .render()
        .unwrap();
}
