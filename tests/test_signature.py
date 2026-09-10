"""Signing, shared-key derivation and Bob's three verification checks."""

from __future__ import annotations

import numpy as np
import pytest

from qsig.signature import (
    establish_shared_key,
    expected_rounds,
    ideal_channel,
    sign,
    transmit,
    verify,
)

MSG = "Transfer 1,000,000 to account 4471-8890"


def _key(seed: int = 0, bits: int = 256) -> bytes:
    return establish_shared_key(bits, np.random.default_rng(seed))


def test_shared_key_length_and_determinism() -> None:
    assert _key(0) == _key(0)
    assert len(_key(0, 256)) == 32
    assert _key(0) != _key(1)


def test_expected_rounds_depend_on_message_and_key() -> None:
    k = _key(0)
    d1 = b"\x01" * 32
    d2 = b"\x02" * 32
    assert expected_rounds(k, d1, 40) != expected_rounds(k, d2, 40)
    assert expected_rounds(k, d1, 40) != expected_rounds(_key(1), d1, 40)


def test_clean_channel_verifies_with_zero_qber() -> None:
    key = _key()
    rng = np.random.default_rng(5)
    sig = sign(MSG, key, 128)
    received = transmit(sig, ideal_channel, rng)
    res = verify(sig, received, key, set(), rng, t_reject=0.11)
    assert res.accepted
    assert res.qber == 0.0
    assert res.declaration_mismatch == 0.0
    assert res.mean_fidelity == pytest.approx(1.0, abs=1e-9)
    assert res.nonce_fresh


def test_wrong_key_fails_declaration_check() -> None:
    signer_key = _key(0)
    verifier_key = _key(1)
    rng = np.random.default_rng(5)
    sig = sign(MSG, signer_key, 128)
    received = transmit(sig, ideal_channel, rng)
    res = verify(sig, received, verifier_key, set(), rng, t_reject=0.11)
    assert not res.accepted
    assert res.declaration_mismatch > 0.4
    assert res.checks["declaration_authentic"] is False


def test_repeated_nonce_is_not_fresh() -> None:
    key = _key()
    rng = np.random.default_rng(9)
    sig = sign(MSG, key, 32)
    received = transmit(sig, ideal_channel, rng)
    seen: set[bytes] = set()
    first = verify(sig, received, key, seen, rng, t_reject=0.11)
    second = verify(sig, received, key, seen, rng, t_reject=0.11)
    assert first.nonce_fresh
    assert not second.nonce_fresh
