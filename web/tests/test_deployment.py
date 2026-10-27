"""Protect Fly's config-relative Dockerfile and Cargo workspace context."""
from pathlib import Path
import tomllib
import unittest

ROOT = Path(__file__).resolve().parents[2]


class DeploymentPaths(unittest.TestCase):
    def test_fly_dockerfile_and_workspace_context_are_resolvable(self):
        configs = [p for p in [ROOT / 'fly.toml', ROOT / 'site/fly.toml'] if p.exists()]
        self.assertEqual(len(configs), 1, 'Keep one authoritative Fly configuration')
        config = configs[0]
        parsed = tomllib.loads(config.read_text())
        context = config.parent
        dockerfile = context / parsed['build']['dockerfile']
        self.assertTrue(dockerfile.is_file(), f'Fly resolves Dockerfile relative to config: {dockerfile}')
        manifest = context / 'Cargo.toml'
        self.assertTrue(manifest.is_file(), 'Build context must contain the root Cargo workspace')
        self.assertIn('workspace', tomllib.loads(manifest.read_text()))
        self.assertTrue((context / '.dockerignore').is_file(), 'Root secret exclusions must apply')
        workflow = (ROOT / '.github/workflows/site-deploy.yml').read_text()
        self.assertIn('flyctl deploy --config fly.toml --remote-only --ha=false', workflow)
        self.assertEqual(workflow.count('"fly.toml"'), 2, 'Root Fly config changes must trigger push and PR checks')


if __name__ == '__main__':
    unittest.main()
