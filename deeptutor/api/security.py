"""Shared API authentication helpers for hosted DeepTutor deployments."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi import Request, WebSocket


def get_deeptutor_api_key() -> str:
    return os.environ.get("DEEPTUTOR_API_KEY", "").strip()


def is_backend_auth_enabled() -> bool:
    return bool(get_deeptutor_api_key())


def _constant_time_equals(left: str, right: str) -> bool:
    return hmac.compare_digest(left.encode("utf-8"), right.encode("utf-8"))


def _extract_bearer(value: str | None) -> str:
    if not value:
        return ""
    prefix = "bearer "
    return value[len(prefix) :].strip() if value.lower().startswith(prefix) else ""


def request_has_valid_api_key(request: "Request") -> bool:
    secret = get_deeptutor_api_key()
    if not secret:
        return True

    candidates = [
        request.headers.get("x-api-key") or "",
        _extract_bearer(request.headers.get("authorization")),
    ]
    return any(candidate and _constant_time_equals(candidate, secret) for candidate in candidates)


def _decode_base64_url(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("ascii"))


def validate_ws_token(token: str, path: str) -> bool:
    secret = get_deeptutor_api_key()
    if not secret:
        return True

    try:
        encoded_payload, encoded_signature = token.split(".", 1)
        expected_signature = hmac.new(
            secret.encode("utf-8"),
            encoded_payload.encode("ascii"),
            hashlib.sha256,
        ).digest()
        supplied_signature = _decode_base64_url(encoded_signature)
        if not hmac.compare_digest(supplied_signature, expected_signature):
            return False

        payload = json.loads(_decode_base64_url(encoded_payload).decode("utf-8"))
    except Exception:
        return False

    if not isinstance(payload, dict):
        return False

    token_path = payload.get("path")
    expires_at = payload.get("exp")
    return (
        isinstance(token_path, str)
        and token_path == path
        and isinstance(expires_at, (int, float))
        and expires_at >= time.time()
    )


async def require_websocket_auth(websocket: "WebSocket") -> bool:
    if not is_backend_auth_enabled():
        return True

    token = websocket.query_params.get("dt_ws_token") or ""
    if validate_ws_token(token, websocket.url.path):
        return True

    await websocket.close(code=1008)
    return False
