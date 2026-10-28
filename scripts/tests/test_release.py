"""Protect selective publication and independent crate versions."""
import contextlib
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "release.py"
SPEC = importlib.util.spec_from_file_location("release", SCRIPT)
release = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(release)


class ReleaseSelection(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        root = Path(self.directory.name)
        for name in ["hearth", "hearth-runtime"]:
            directory = root / name
            directory.mkdir()
            (directory / "LICENSE").touch()
            (directory / "NOTICE").touch()
        self.crates = {
            "hearth-runtime": {
                "version": "0.1.0", "license": "MIT", "dependencies": [],
                "manifest_path": str(root / "hearth-runtime/Cargo.toml"),
            },
            "hearth": {
                "version": "0.1.1", "license": "MIT",
                "manifest_path": str(root / "hearth/Cargo.toml"),
                "dependencies": [{"name": "hearth-runtime", "kind": None,
                                  "path": str(root / "hearth-runtime"), "req": "^0.1.0"}],
            },
        }

    def invoke(self, arguments):
        with patch.object(release, "packages", return_value=self.crates), \
             patch("sys.argv", [str(SCRIPT), *arguments]), \
             contextlib.redirect_stdout(io.StringIO()), \
             contextlib.redirect_stderr(io.StringIO()):
            release.main()

    def test_selected_publish_does_not_republish_support_crates(self):
        with patch.object(release.subprocess, "check_output", return_value=b""), \
             patch.object(release.subprocess, "run") as run:
            self.invoke(["publish", "-p", "hearth"])
        self.assertEqual(run.call_count, 1)
        self.assertEqual(run.call_args.args[0],
                         ["cargo", "publish", "--locked", "-p", "hearth"])

    def test_unknown_selection_never_publishes(self):
        with patch.object(release.subprocess, "run") as run, \
             self.assertRaises(SystemExit) as error:
            self.invoke(["publish", "-p", "typo"])
        self.assertEqual(error.exception.code, 2)
        run.assert_not_called()

    def test_dirty_selected_release_never_publishes(self):
        with patch.object(release.subprocess, "check_output", return_value=b" M Cargo.toml"), \
             patch.object(release.subprocess, "run") as run, \
             self.assertRaises(SystemExit):
            self.invoke(["publish", "-p", "hearth"])
        run.assert_not_called()

    def test_internal_requirement_tracks_target_not_facade_version(self):
        with contextlib.redirect_stdout(io.StringIO()):
            release.check(self.crates)
        self.crates["hearth"]["dependencies"][0]["req"] = "^0.1.1"
        with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(AssertionError):
            release.check(self.crates)

    def test_full_publish_keeps_dependency_order(self):
        with patch.object(release.subprocess, "check_output", return_value=b""), \
             patch.object(release.subprocess, "run") as run:
            self.invoke(["publish"])
        self.assertEqual([call.args[0][-1] for call in run.call_args_list],
                         ["hearth-runtime", "hearth"])


if __name__ == "__main__":
    unittest.main()
