from __future__ import annotations

import socket

from deeptutor.tools.vision.image_utils import (
    guess_image_type_from_bytes,
    is_valid_image_url,
)


def test_image_url_rejects_localhost_and_private_ips(monkeypatch) -> None:
    def fake_getaddrinfo(host: str, port: int | None, type: int):
        return [(socket.AF_INET, socket.SOCK_STREAM, 0, "", ("127.0.0.1", port or 80))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

    assert is_valid_image_url("http://localhost/image.png") is False
    assert is_valid_image_url("http://127.0.0.1/image.png") is False
    assert is_valid_image_url("http://10.0.0.5/image.png") is False
    assert is_valid_image_url("http://example.com/image.png") is False


def test_image_url_allows_public_dns_resolution(monkeypatch) -> None:
    def fake_getaddrinfo(host: str, port: int | None, type: int):
        return [(socket.AF_INET, socket.SOCK_STREAM, 0, "", ("93.184.216.34", port or 80))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

    assert is_valid_image_url("https://example.com/image.png") is True


def test_image_magic_byte_detection() -> None:
    assert guess_image_type_from_bytes(b"\xff\xd8\xff\xe0data") == "image/jpeg"
    assert guess_image_type_from_bytes(b"\x89PNG\r\n\x1a\nrest") == "image/png"
    assert guess_image_type_from_bytes(b"GIF89arest") == "image/gif"
    assert guess_image_type_from_bytes(b"RIFFxxxxWEBPrest") == "image/webp"
    assert guess_image_type_from_bytes(b"<svg></svg>") is None
