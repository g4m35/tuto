from __future__ import annotations

from pathlib import Path

import pytest

from deeptutor.knowledge.progress_tracker import ProgressTracker, resolve_kb_dir


def test_resolve_kb_dir_rejects_path_traversal(tmp_path: Path) -> None:
    with pytest.raises(ValueError):
        resolve_kb_dir(tmp_path, "../outside")

    with pytest.raises(ValueError):
        ProgressTracker("nested/name", tmp_path)


def test_resolve_kb_dir_accepts_safe_names(tmp_path: Path) -> None:
    assert resolve_kb_dir(tmp_path, "course-101_v2") == tmp_path.resolve() / "course-101_v2"
