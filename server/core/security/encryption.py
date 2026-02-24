"""
Maia Platform — Field-Level Encryption (AES-256-GCM)
Provides encryption/decryption for sensitive data at rest.
"""
import base64
import os
from typing import Optional

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


# 32-byte key (256-bit) derived from env or generated
_KEY: Optional[bytes] = None


def _get_key() -> bytes:
    global _KEY
    if _KEY is not None:
        return _KEY

    key_hex = os.getenv("ENCRYPTION_KEY", "")
    if key_hex and len(key_hex) >= 64:
        _KEY = bytes.fromhex(key_hex[:64])
    else:
        # Fallback: derive from a default (development only)
        import hashlib
        seed = os.getenv("JWT_SECRET", "maia-dev-key-unsafe")
        _KEY = hashlib.sha256(seed.encode()).digest()

    return _KEY


def encrypt_field(value: str) -> str:
    """
    Encrypt a string value using AES-256-GCM.
    Returns base64-encoded string: nonce(12b) + ciphertext + tag(16b).
    """
    if not value:
        return value

    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce
    ct = aesgcm.encrypt(nonce, value.encode("utf-8"), None)
    # Pack: nonce + ciphertext+tag
    packed = nonce + ct
    return "ENC:" + base64.b64encode(packed).decode("ascii")


def decrypt_field(cipher: str) -> str:
    """
    Decrypt a string value encrypted with encrypt_field().
    Handles both encrypted (ENC: prefix) and plain text gracefully.
    """
    if not cipher or not cipher.startswith("ENC:"):
        return cipher  # Not encrypted, return as-is

    key = _get_key()
    aesgcm = AESGCM(key)
    packed = base64.b64decode(cipher[4:])
    nonce = packed[:12]
    ct = packed[12:]
    plaintext = aesgcm.decrypt(nonce, ct, None)
    return plaintext.decode("utf-8")


def is_encrypted(value: str) -> bool:
    """Check if a value is encrypted."""
    return bool(value) and value.startswith("ENC:")
