from __future__ import annotations

import asyncio
from pathlib import Path

from deeptutor.services.path_service import PathService
from deeptutor.tools.code_executor import _resolve_task_workspace, run_code


def test_resolve_task_workspace_uses_feature_and_turn_id(tmp_path: Path) -> None:
    service = PathService.get_instance()
    original_root = service._project_root
    original_user_dir = service._user_data_dir

    try:
        service._project_root = tmp_path
        service._user_data_dir = tmp_path / "data" / "user"

        workspace = _resolve_task_workspace(
            feature="deep_research",
            task_id="",
            session_id="session_1",
            turn_id="turn_1",
        )

        assert workspace == (
            tmp_path
            / "data"
            / "user"
            / "workspace"
            / "chat"
            / "deep_research"
            / "turn_1"
            / "code_runs"
        )
    finally:
        service._project_root = original_root
        service._user_data_dir = original_user_dir


def test_resolve_task_workspace_requires_feature() -> None:
    assert (
        _resolve_task_workspace(
            feature="",
            task_id="task_1",
            session_id="session_1",
            turn_id="turn_1",
        )
        is None
    )


def test_run_code_is_disabled_by_default_in_hosted_mode(
    monkeypatch,
    tmp_path: Path,
) -> None:
    monkeypatch.setenv("DEEPTUTOR_MODE", "server")
    monkeypatch.delenv("DEEPTUTOR_ENABLE_CODE_EXECUTION", raising=False)
    monkeypatch.delenv("RUN_CODE_ENABLED", raising=False)

    result = asyncio.run(
        run_code(
            "python",
            "print('should not run')",
            workspace_dir=tmp_path,
        )
    )

    assert result["exit_code"] == -1
    assert "disabled" in result["stderr"].lower()


def test_run_code_blocks_file_capable_science_imports_by_default(
    monkeypatch,
    tmp_path: Path,
) -> None:
    monkeypatch.delenv("DEEPTUTOR_MODE", raising=False)
    monkeypatch.delenv("DEEPTUTOR_ENABLE_CODE_EXECUTION", raising=False)
    monkeypatch.delenv("RUN_CODE_ENABLED", raising=False)

    safe_result = asyncio.run(
        run_code(
            "python",
            "import math\nprint(math.sqrt(9))",
            workspace_dir=tmp_path,
        )
    )
    assert safe_result["exit_code"] == 0
    assert safe_result["stdout"].strip() == "3.0"

    blocked_result = asyncio.run(
        run_code(
            "python",
            "import numpy as np\nprint(np.array([1]).tolist())",
            workspace_dir=tmp_path,
        )
    )
    assert blocked_result["exit_code"] == -1
    assert "not in the allowed list: numpy" in blocked_result["stderr"]
