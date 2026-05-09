from __future__ import annotations

from pathlib import Path

import pytest

from deeptutor.knowledge.manager import KnowledgeBaseManager
from deeptutor.knowledge.progress_tracker import ProgressStage, ProgressTracker, resolve_kb_dir


def test_resolve_kb_dir_rejects_path_traversal(tmp_path: Path) -> None:
    with pytest.raises(ValueError):
        resolve_kb_dir(tmp_path, "../outside")

    with pytest.raises(ValueError):
        ProgressTracker("nested/name", tmp_path)


def test_resolve_kb_dir_accepts_safe_names(tmp_path: Path) -> None:
    assert resolve_kb_dir(tmp_path, "course-101_v2") == tmp_path.resolve() / "course-101_v2"


def test_progress_tracker_writes_and_reads_progress_file(tmp_path: Path) -> None:
    tracker = ProgressTracker("course-101", tmp_path)

    tracker.update(
        ProgressStage.PROCESSING_DOCUMENTS,
        "Processing notes",
        current=1,
        total=2,
        file_name="notes.pdf",
    )

    progress = tracker.get_progress()

    assert tracker.progress_file.exists()
    assert progress is not None
    assert progress["stage"] == "processing_documents"
    assert progress["message"] == "Processing notes"
    assert progress["current"] == 1
    assert progress["total"] == 2
    assert progress["file_name"] == "notes.pdf"


def test_progress_tracker_reads_config_progress_without_file(tmp_path: Path) -> None:
    manager = KnowledgeBaseManager(base_dir=str(tmp_path))
    manager.update_kb_status(
        "legacy-kb",
        "ready",
        progress={
            "stage": "completed",
            "message": "Knowledge base is ready.",
            "percent": 100,
        },
    )

    tracker = ProgressTracker("legacy-kb", tmp_path)

    assert not tracker.progress_file.exists()
    assert tracker.get_progress() == {
        "status": "ready",
        "stage": "completed",
        "message": "Knowledge base is ready.",
        "percent": 100,
    }
