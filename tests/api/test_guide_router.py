from __future__ import annotations

import importlib

import pytest

try:
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
except Exception:  # pragma: no cover - optional dependency in lightweight envs
    FastAPI = None
    TestClient = None

pytestmark = pytest.mark.skipif(FastAPI is None or TestClient is None, reason="fastapi not installed")

if FastAPI is not None and TestClient is not None:
    guide_router_module = importlib.import_module("deeptutor.api.routers.guide")
    router = guide_router_module.router
else:  # pragma: no cover - optional dependency in lightweight envs
    guide_router_module = None
    router = None


def _build_app() -> FastAPI:
    if FastAPI is None or router is None:  # pragma: no cover - guarded by pytestmark
        raise RuntimeError("fastapi is not installed")
    app = FastAPI()
    app.include_router(router, prefix="/api/v1/guide")
    return app


class _FakeGuideManager:
    def __init__(self) -> None:
        self.calls: list[dict[str, object]] = []

    async def create_session(self, **kwargs):
        self.calls.append(kwargs)
        return {
            "success": True,
            "session_id": "session-123",
            "kb_name": kwargs.get("kb_name"),
            "knowledge_points": [
                {
                    "knowledge_title": "Foundations",
                    "knowledge_summary": "Start here.",
                }
            ],
            "total_points": 1,
        }


def test_create_session_forwards_kb_name_to_guide_manager(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_manager = _FakeGuideManager()
    monkeypatch.setattr(guide_router_module, "get_guide_manager", lambda: fake_manager)
    monkeypatch.setattr(guide_router_module.BaseAgent, "reset_stats", lambda *_args, **_kwargs: None)

    with TestClient(_build_app()) as client:
        response = client.post(
            "/api/v1/guide/create_session",
            json={
                "user_input": "Teach me quantum mechanics.",
                "kb_name": "quantum-kb",
            },
        )

    assert response.status_code == 200
    assert fake_manager.calls == [
        {
            "user_input": "Teach me quantum mechanics.",
            "display_title": "Teach me quantum mechanics.",
            "notebook_context": "",
            "kb_name": "quantum-kb",
        }
    ]
    assert response.json()["kb_name"] == "quantum-kb"
