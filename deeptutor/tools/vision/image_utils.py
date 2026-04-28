"""Image processing utilities - URL download and format conversion."""

import base64
import ipaddress
import socket
from urllib.parse import urljoin, urlparse

import httpx

from deeptutor.logging import get_logger

logger = get_logger(__name__)

# Supported image MIME types
SUPPORTED_IMAGE_TYPES = {
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
}

# Maximum image size (10MB)
MAX_IMAGE_SIZE = 10 * 1024 * 1024

# Request timeout (seconds)
REQUEST_TIMEOUT = 30
MAX_REDIRECTS = 5


def _is_public_ip(address: str) -> bool:
    try:
        ip = ipaddress.ip_address(address)
    except ValueError:
        return False
    return not (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


def _is_public_image_host(parsed_url) -> bool:
    hostname = parsed_url.hostname
    if not hostname:
        return False

    lowered = hostname.rstrip(".").lower()
    if lowered in {"localhost", "localhost.localdomain"} or lowered.endswith(".localhost"):
        return False

    try:
        ipaddress.ip_address(lowered)
    except ValueError:
        pass
    else:
        return _is_public_ip(lowered)

    try:
        resolved = socket.getaddrinfo(lowered, parsed_url.port, type=socket.SOCK_STREAM)
    except socket.gaierror:
        return False

    return bool(resolved) and all(_is_public_ip(item[4][0]) for item in resolved)


class ImageError(Exception):
    """Image processing error."""

    pass


def is_valid_image_url(url: str) -> bool:
    """Check if a URL is valid for images.

    Args:
        url: URL to check

    Returns:
        True if valid URL format
    """
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc) and _is_public_image_host(parsed)
    except Exception:
        return False


def is_base64_image(data: str) -> bool:
    """Check if data is base64 encoded image.

    Args:
        data: Data to check

    Returns:
        True if data:image/...;base64,... format
    """
    return data.startswith("data:image/") and ";base64," in data


async def fetch_image_from_url(url: str) -> tuple[bytes, str]:
    """Download image from URL.

    Args:
        url: Image URL

    Returns:
        (image bytes, MIME type)

    Raises:
        ImageError: If download fails or format unsupported
    """
    if not is_valid_image_url(url):
        raise ImageError("Invalid image URL")

    logger.info("Fetching image from external URL")

    try:
        current_url = url
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, follow_redirects=False) as client:
            for _ in range(MAX_REDIRECTS + 1):
                if not is_valid_image_url(current_url):
                    raise ImageError("Image URL points to a private or invalid host")

                async with client.stream("GET", current_url) as response:
                    if response.is_redirect:
                        location = response.headers.get("location")
                        if not location:
                            raise ImageError("Image redirect missing Location header")
                        current_url = urljoin(current_url, location)
                        continue

                    response.raise_for_status()

                    content_type = response.headers.get("content-type", "").split(";")[0].strip().lower()
                    if content_type == "image/jpg":
                        content_type = "image/jpeg"

                    if not content_type or content_type == "application/octet-stream":
                        content_type = guess_image_type_from_url(current_url)

                    if content_type not in SUPPORTED_IMAGE_TYPES:
                        raise ImageError(f"Unsupported image format: {content_type}")

                    content_length = response.headers.get("content-length")
                    if content_length:
                        try:
                            size = int(content_length)
                        except ValueError:
                            size = 0
                        if size > MAX_IMAGE_SIZE:
                            raise ImageError(
                                f"Image too large: {size / 1024 / 1024:.1f}MB "
                                f"(max {MAX_IMAGE_SIZE / 1024 / 1024:.0f}MB)"
                            )

                    chunks = bytearray()
                    async for chunk in response.aiter_bytes():
                        chunks.extend(chunk)
                        if len(chunks) > MAX_IMAGE_SIZE:
                            break

                    content = bytes(chunks)
                    if len(content) > MAX_IMAGE_SIZE:
                        raise ImageError(
                            f"Image too large: {len(content) / 1024 / 1024:.1f}MB "
                            f"(max {MAX_IMAGE_SIZE / 1024 / 1024:.0f}MB)"
                        )

                    detected_type = guess_image_type_from_bytes(content)
                    if detected_type != content_type:
                        raise ImageError("Image content does not match declared format")

                    logger.info(f"Image fetched successfully: {len(content)} bytes, type: {content_type}")
                    return content, content_type

            raise ImageError("Too many image redirects")

    except httpx.HTTPStatusError as e:
        raise ImageError(f"Failed to download image: HTTP {e.response.status_code}")
    except httpx.TimeoutException:
        raise ImageError(f"Image download timeout ({REQUEST_TIMEOUT}s)")
    except httpx.RequestError as e:
        raise ImageError(f"Failed to download image: {e!s}")


def guess_image_type_from_url(url: str) -> str:
    """Infer image type from URL.

    Args:
        url: Image URL

    Returns:
        Inferred MIME type
    """
    url_lower = url.lower()

    if ".png" in url_lower:
        return "image/png"
    elif ".jpg" in url_lower or ".jpeg" in url_lower:
        return "image/jpeg"
    elif ".gif" in url_lower:
        return "image/gif"
    elif ".webp" in url_lower:
        return "image/webp"
    else:
        # Default to JPEG
        return "image/jpeg"


def guess_image_type_from_bytes(content: bytes) -> str | None:
    """Infer image type from file signature bytes."""
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if content.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp"
    return None


def image_bytes_to_base64(content: bytes, mime_type: str) -> str:
    """Convert image bytes to base64 data URL.

    Args:
        content: Image binary data
        mime_type: MIME type

    Returns:
        data:image/...;base64,... format string
    """
    b64_data = base64.b64encode(content).decode("utf-8")
    result = f"data:{mime_type};base64,{b64_data}"

    logger.debug(f"image_bytes_to_base64: input={len(content)} bytes, output={len(b64_data)} chars")

    return result


async def url_to_base64(url: str) -> str:
    """Convert image URL to base64 data URL.

    Args:
        url: Image URL

    Returns:
        data:image/...;base64,... format string

    Raises:
        ImageError: If download or conversion fails
    """
    content, mime_type = await fetch_image_from_url(url)
    return image_bytes_to_base64(content, mime_type)


async def resolve_image_input(
    image_base64: str | None = None,
    image_url: str | None = None,
) -> str | None:
    """Resolve image input to base64 format.

    Prioritizes image_base64, falls back to downloading from image_url.

    Args:
        image_base64: Base64 format image data
        image_url: Image URL

    Returns:
        Base64 format image data, or None if no image

    Raises:
        ImageError: If URL download or conversion fails
    """
    logger.debug(
        f"resolve_image_input: base64={'yes' if image_base64 else 'no'}, url={image_url or 'none'}"
    )

    # Prefer base64
    if image_base64:
        if is_base64_image(image_base64):
            logger.debug("Using provided base64 image")
            return image_base64
        else:
            logger.error("Invalid base64 image format")
            raise ImageError("Invalid base64 image format, should be data:image/...;base64,...")

    # Try to download from URL
    if image_url:
        logger.debug("Downloading image from URL")
        result = await url_to_base64(image_url)
        logger.debug(f"Download complete, base64 length: {len(result)}")
        return result

    logger.debug("No image provided")
    return None
