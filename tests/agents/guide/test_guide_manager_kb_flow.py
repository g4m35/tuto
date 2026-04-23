from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from deeptutor.agents.guide.guide_manager import GuideManager, GuidedSession


class _FakeRAGService:
    def __init__(self, answer: str = "Grounded knowledge from the KB.") -> None:
        self.answer = answer
        self.calls: list[dict[str, object]] = []

    async def search(self, query: str, kb_name: str, **kwargs):
        self.calls.append({"query": query, "kb_name": kb_name, "kwargs": kwargs})
        return {
            "answer": self.answer,
            "content": self.answer,
            "sources": [{"kb_name": kb_name}],
        }


def _build_manager(tmp_path, monkeypatch: pytest.MonkeyPatch) -> tuple[GuideManager, _FakeRAGService]:
    manager = GuideManager(
        api_key="sk-test",
        base_url="https://example.com",
        language="en",
        output_dir=str(tmp_path),
    )
    fake_rag = _FakeRAGService()
    manager._rag_service = fake_rag
    manager.design_agent.process = AsyncMock(
        return_value={
            "success": True,
            "knowledge_points": [
                {
                    "knowledge_title": "Foundations",
                    "knowledge_summary": "Build the mental model first.",
                },
                {
                    "knowledge_title": "Applications",
                    "knowledge_summary": "Use the concept in context.",
                },
            ],
        }
    )
    monkeypatch.setattr(manager, "_schedule_generation_task", lambda *_args, **_kwargs: None)
    return manager, fake_rag


@pytest.mark.asyncio
async def test_create_session_persists_kb_name_and_grounds_design_input(
    tmp_path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    manager, fake_rag = _build_manager(tmp_path, monkeypatch)

    result = await manager.create_session(
        user_input="Teach me the topic step by step.",
        display_title="Linear algebra crash course",
        notebook_context="Use plain language.",
        kb_name="linear-algebra-kb",
    )

    assert result["success"] is True
    assert result["kb_name"] == "linear-algebra-kb"
    assert fake_rag.calls == [
        {
            "query": "Linear algebra crash course",
            "kb_name": "linear-algebra-kb",
            "kwargs": {"mode": "hybrid"},
        }
    ]

    design_input = manager.design_agent.process.await_args.kwargs["user_input"]
    assert "[Notebook Context]" in design_input
    assert "Use plain language." in design_input
    assert "[Knowledge Base Context: linear-algebra-kb]" in design_input
    assert "Grounded knowledge from the KB." in design_input
    assert "[User Question]" in design_input
    assert "Teach me the topic step by step." in design_input

    session = manager.get_session(result["session_id"])
    assert session is not None
    assert session["kb_name"] == "linear-algebra-kb"
    assert "[Knowledge Base Context: linear-algebra-kb]" in session["notebook_context"]
    assert "Grounded knowledge from the KB." in session["notebook_context"]


@pytest.mark.asyncio
async def test_start_learning_returns_persisted_kb_name_after_reload(
    tmp_path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    manager, _fake_rag = _build_manager(tmp_path, monkeypatch)

    created = await manager.create_session(
        user_input="Create a course from the KB.",
        kb_name="physics-kb",
    )
    session_id = created["session_id"]

    manager._sessions.clear()
    started = await manager.start_learning(session_id)

    assert started["success"] is True
    assert started["current_index"] == 0
    assert started["kb_name"] == "physics-kb"


def test_guided_session_from_dict_defaults_missing_kb_name_to_none() -> None:
    session = GuidedSession.from_dict(
        {
            "session_id": "session-1",
            "notebook_id": "user_input",
            "notebook_name": "Legacy session",
            "created_at": 123.0,
            "knowledge_points": [],
        }
    )

    assert session.kb_name is None
