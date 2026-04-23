#!/usr/bin/env python
"""
Uvicorn Server Startup Script
Uses Python API instead of command line to avoid Windows path parsing issues.
"""

import asyncio
import os
from pathlib import Path
import sys

# Windows: uvicorn defaults to SelectorEventLoop which does not support
# asyncio.create_subprocess_exec.  Switch to ProactorEventLoop so that
# child-process APIs (used by Math Animator renderer, etc.) work correctly.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

import uvicorn

# Force unbuffered output
os.environ["PYTHONUNBUFFERED"] = "1"
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(line_buffering=True)


def _build_reload_excludes(project_root: Path) -> list[str]:
    """Return repo-relative reload excludes safe for uvicorn/watchfiles.

    Uvicorn 0.45 resolves excludes by globbing non-directory entries against the
    current working directory. Absolute file paths (for example a worktree
    `.git` file) trigger ``pathlib``'s "Non-relative patterns are unsupported"
    error, so keep every exclude relative to the project root we `chdir` into.
    """

    candidates = [
        project_root / "venv",
        project_root / ".venv",
        project_root / "data",
        project_root / "node_modules",
        project_root / "web" / "node_modules",
        project_root / "web" / ".next",
        project_root / ".git",
        project_root / "scripts",
    ]

    excludes: list[str] = []
    for path in candidates:
        if not path.exists():
            continue
        try:
            relative_path = path.relative_to(project_root)
        except ValueError:
            continue
        excludes.append(relative_path.as_posix() or ".")

    return excludes


def main() -> None:
    # Get project root directory
    project_root = Path(__file__).parent.parent.parent

    # Change to project root to ensure correct module imports
    os.chdir(str(project_root))

    # Ensure project root is in Python path
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    # Get port from configuration
    from deeptutor.services.setup import get_backend_port

    backend_port = get_backend_port(project_root)

    reload_excludes = _build_reload_excludes(project_root)

    # Start uvicorn server with reload enabled
    uvicorn.run(
        "deeptutor.api.main:app",
        host="0.0.0.0",
        port=backend_port,
        reload=True,
        reload_excludes=reload_excludes,
        log_level="info",
        access_log=False,
    )


if __name__ == "__main__":
    main()
