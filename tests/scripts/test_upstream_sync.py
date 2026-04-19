from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
from unittest import TestCase, mock


def _load_upstream_sync_module():
    module_path = Path(__file__).resolve().parents[2] / "scripts" / "upstream_sync.py"
    spec = importlib.util.spec_from_file_location("upstream_sync_under_test", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    original_module = sys.modules.get(spec.name)
    sys.modules[spec.name] = module
    try:
        spec.loader.exec_module(module)
        return module
    finally:
        if original_module is None:
            sys.modules.pop(spec.name, None)
        else:
            sys.modules[spec.name] = original_module


class TestAttemptMerge(TestCase):
    def test_commits_after_safe_conflicts_are_auto_resolved(self) -> None:
        upstream_sync = _load_upstream_sync_module()
        commands: list[tuple[str, ...]] = []

        def fake_run(cmd, capture_output=True, text=True, **kwargs):  # type: ignore[no-untyped-def]
            commands.append(tuple(cmd))
            if cmd[:4] == ["git", "merge", "--no-ff", "-m"]:
                return subprocess.CompletedProcess(cmd, 1, "", "conflict")
            return subprocess.CompletedProcess(cmd, 0, "", "")

        run_calls: list[tuple[str, ...]] = []

        def fake_wrapper(*args: str, check: bool = True) -> str:
            run_calls.append(args)
            return ""

        with (
            mock.patch.object(upstream_sync.subprocess, "run", side_effect=fake_run),
            mock.patch.object(upstream_sync, "list_unmerged_paths", side_effect=[["web/.env.local"], []]),
            mock.patch.object(upstream_sync, "resolve_safe_conflicts", return_value=["web/.env.local"]),
            mock.patch.object(upstream_sync, "run", side_effect=fake_wrapper),
        ):
            result = upstream_sync.attempt_merge("v1.1.2")

        self.assertTrue(result.merged)
        self.assertEqual(result.auto_resolved, ["web/.env.local"])
        self.assertEqual(result.remaining_conflicts, [])
        self.assertIn(("git", "commit", "--no-edit"), run_calls)
        self.assertNotIn(("git", "merge", "--abort"), commands)

    def test_aborts_when_manual_conflicts_remain(self) -> None:
        upstream_sync = _load_upstream_sync_module()
        commands: list[tuple[str, ...]] = []

        def fake_run(cmd, capture_output=True, text=True, **kwargs):  # type: ignore[no-untyped-def]
            commands.append(tuple(cmd))
            if cmd[:4] == ["git", "merge", "--no-ff", "-m"]:
                return subprocess.CompletedProcess(cmd, 1, "", "conflict")
            return subprocess.CompletedProcess(cmd, 0, "", "")

        with (
            mock.patch.object(upstream_sync.subprocess, "run", side_effect=fake_run),
            mock.patch.object(
                upstream_sync,
                "list_unmerged_paths",
                side_effect=[
                    ["web/.env.local", "web/package.json"],
                    ["web/package.json"],
                ],
            ),
            mock.patch.object(upstream_sync, "resolve_safe_conflicts", return_value=["web/.env.local"]),
        ):
            result = upstream_sync.attempt_merge("v1.1.2")

        self.assertFalse(result.merged)
        self.assertEqual(result.auto_resolved, ["web/.env.local"])
        self.assertEqual(result.remaining_conflicts, ["web/package.json"])
        self.assertIn(("git", "merge", "--abort"), commands)
