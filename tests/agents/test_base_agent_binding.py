"""Tests for BaseAgent runtime binding behavior."""

from __future__ import annotations

from deeptutor.agents.base_agent import BaseAgent
from deeptutor.services.llm.config import LLMConfig


class _DummyAgent(BaseAgent):
    async def process(self, **_kwargs):  # noqa: ANN003
        return {}


def test_base_agent_defaults_to_resolved_binding(monkeypatch) -> None:
    """When binding is not explicitly provided, use resolved runtime binding."""
    resolved = LLMConfig(
        model="google/gemini-3-flash-preview",
        api_key="sk-test",
        base_url="https://openrouter.ai/api/v1",
        binding="openrouter",
        provider_name="openrouter",
        provider_mode="gateway",
    )
    monkeypatch.setattr("deeptutor.agents.base_agent.get_llm_config", lambda: resolved)

    agent = _DummyAgent(
        module_name="question",
        agent_name="idea_agent",
        language="en",
    )

    assert agent.binding == "openrouter"


def test_base_agent_env_fallback_accepts_google_api_key(monkeypatch) -> None:
    """Fallback env loading should honor Gemini alias keys."""
    monkeypatch.setattr(
        "deeptutor.agents.base_agent.get_llm_config",
        lambda: (_ for _ in ()).throw(ValueError("missing runtime config")),
    )
    monkeypatch.setenv("LLM_BINDING", "gemini")
    monkeypatch.setenv("LLM_MODEL", "gemini-2.5-pro")
    monkeypatch.setenv("LLM_HOST", "https://generativelanguage.googleapis.com/v1beta/openai/")
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("GOOGLE_API_KEY", "test-google-key")

    agent = _DummyAgent(
        module_name="question",
        agent_name="idea_agent",
        language="en",
    )

    assert agent.binding == "gemini"
    assert agent.api_key == "test-google-key"
