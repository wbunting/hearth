fn main() {
    hearth::tailwind::BuildConfig::new()
        .input("styles.css")
        .optimize(true)
        .render()
        .unwrap();
    let out = std::path::PathBuf::from(std::env::var_os("OUT_DIR").unwrap());
    hearth::tailwind::BuildConfig::new()
        .input("src/app.css")
        .output(out.join("benchmark.css"))
        .render()
        .unwrap();
}
