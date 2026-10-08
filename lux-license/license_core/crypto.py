"""Crypto primitives — Ed25519 signatures + XChaCha20-Poly1305 AEAD.

Keys are 32-byte Ed25519 keys; signatures are 64 bytes.
The AEAD layer encrypts the license payload so that reverse
engineering cannot read the metadata without the app key.

All randomness comes from the OS CSPRNG (secrets / cryptography).
"""

from __future__ import annotations

import base64
import os

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives.ciphers.aead import XChaCha20Poly1305

SECRET_KEY_LEN: int = 32
PUBLIC_KEY_LEN: int = 32
SIGNATURE_LEN: int = 64
NONCE_LEN: int = 24

# ── Ed25519 ────────────────────────────────────────────────────────────


def generate_keypair() -> tuple[bytes, bytes]:
    """Generate a fresh Ed25519 keypair. Returns (secret, public) raw bytes."""
    priv = Ed25519PrivateKey.generate()
    secret = priv.private_bytes(
        serialization.Encoding.Raw,
        serialization.PrivateFormat.Raw,
        serialization.NoEncryption(),
    )
    public = priv.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw
    )
    return secret, public


def public_key_from_secret(secret: bytes) -> bytes:
    """Derive the public key from a 32-byte raw secret key."""
    priv = Ed25519PrivateKey.from_private_bytes(secret)
    return priv.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw
    )


def sign(message: bytes, secret: bytes) -> bytes:
    """Sign `message` with the 32-byte raw secret key → 64-byte signature."""
    priv = Ed25519PrivateKey.from_private_bytes(secret)
    return priv.sign(message)


def verify_signature(message: bytes, signature: bytes, public: bytes) -> bool:
    """Verify a 64-byte Ed25519 signature. Returns True iff valid."""
    if len(signature) != SIGNATURE_LEN or len(public) != PUBLIC_KEY_LEN:
        return False
    try:
        pub = Ed25519PublicKey.from_public_bytes(public)
        pub.verify(signature, message)
        return True
    except Exception:
        return False


# ── AEAD (XChaCha20-Poly1305) ──────────────────────────────────────────


def aead_encrypt(app_key: bytes, plaintext: bytes) -> bytes:
    """Encrypt `plaintext` → (nonce ‖ ciphertext+tag)."""
    nonce = os.urandom(NONCE_LEN)
    cipher = XChaCha20Poly1305(app_key)
    sealed = cipher.encrypt(nonce, plaintext, None)
    return nonce + sealed


def aead_decrypt(app_key: bytes, sealed: bytes) -> bytes | None:
    """Decrypt (nonce ‖ ciphertext) with the app AEAD key.

    Returns None on tamper (auth tag mismatch).
    """
    if len(sealed) < NONCE_LEN + 16:
        return None
    nonce, ciphertext = sealed[:NONCE_LEN], sealed[NONCE_LEN:]
    cipher = XChaCha20Poly1305(app_key)
    try:
        return cipher.decrypt(nonce, ciphertext, None)
    except Exception:
        return None


# ── Base64URL (no padding) ─────────────────────────────────────────────

_B64URL = base64.urlsafe_b64encode
_B64URL_DECODE = base64.urlsafe_b64decode


def b64url_encode(data: bytes) -> str:
    """Base64URL encode (no padding)."""
    return _B64URL(data).rstrip(b"=").decode("ascii")


def b64url_decode(text: str) -> bytes | None:
    """Base64URL decode (no padding). Returns None on invalid input."""
    try:
        padded = text + "=" * (-len(text) % 4)
        return _B64URL_DECODE(padded.encode("ascii"))
    except Exception:
        return None