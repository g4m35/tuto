from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
import unittest
from unittest.mock import patch

from deeptutor.api.security import validate_ws_token


def _token(secret: str, payload: dict) -> str:
    encoded_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signature = hmac.new(secret.encode(), encoded_payload.encode(), hashlib.sha256).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{encoded_payload}.{encoded_signature}"


class WebSocketTokenTests(unittest.TestCase):
    def test_validate_ws_token_accepts_matching_path(self) -> None:
        with patch.dict(os.environ, {"DEEPTUTOR_API_KEY": "shared-secret"}):
            token = _token(
                "shared-secret",
                {"path": "/api/v1/ws", "sub": "user_123", "exp": time.time() + 60},
            )

            self.assertTrue(validate_ws_token(token, "/api/v1/ws"))

    def test_validate_ws_token_rejects_mismatched_path(self) -> None:
        with patch.dict(os.environ, {"DEEPTUTOR_API_KEY": "shared-secret"}):
            token = _token(
                "shared-secret",
                {"path": "/api/v1/ws", "sub": "user_123", "exp": time.time() + 60},
            )

            self.assertFalse(validate_ws_token(token, "/api/v1/chat"))

    def test_validate_ws_token_rejects_expired_token(self) -> None:
        with patch.dict(os.environ, {"DEEPTUTOR_API_KEY": "shared-secret"}):
            token = _token(
                "shared-secret",
                {"path": "/api/v1/ws", "sub": "user_123", "exp": time.time() - 1},
            )

            self.assertFalse(validate_ws_token(token, "/api/v1/ws"))


if __name__ == "__main__":
    unittest.main()
