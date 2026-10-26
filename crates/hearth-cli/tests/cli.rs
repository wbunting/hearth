use std::process::{Command, Stdio};

#[test]
fn help_and_version_accept_cargo_and_direct_invocations() {
    for (binary, prefix) in [
        (env!("CARGO_BIN_EXE_hearth"), &[][..]),
        (env!("CARGO_BIN_EXE_cargo-hearth"), &[][..]),
        (env!("CARGO_BIN_EXE_cargo-hearth"), &["hearth"][..]),
    ] {
        for args in [&["--help"][..], &["--version"][..], &["fmt", "--help"][..]] {
            let output = Command::new(binary)
                .args(prefix)
                .args(args)
                .output()
                .unwrap();
            assert!(
                output.status.success(),
                "{binary} {prefix:?} {args:?}: {}",
                String::from_utf8_lossy(&output.stderr),
            );
            assert_ne!(output.stdout.as_slice(), b"");
        }
    }
}

#[test]
fn cargo_invocation_runs_a_subcommand() {
    let output = Command::new(env!("CARGO_BIN_EXE_cargo-hearth"))
        .args(["hearth", "fmt", "--stdin"])
        .stdin(Stdio::null())
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr),
    );
}

#[test]
fn cargo_invocation_preserves_invalid_arguments() {
    for args in [
        &["hearth", "unknown"][..],
        &["hearth", "hearth", "--help"][..],
        &["hearth", "fmt", "--unknown"][..],
    ] {
        let output = Command::new(env!("CARGO_BIN_EXE_cargo-hearth"))
            .args(args)
            .output()
            .unwrap();
        assert!(!output.status.success(), "{args:?}");
    }
}
