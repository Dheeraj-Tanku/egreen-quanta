"""The Quantum Digital Signature protocol: shared-key setup, sign, transmit, verify.

A prepare-and-measure scheme.  Alice and Bob first share a secret key established
by a (simulated) BB84 exchange.  To sign a message Alice derives, per round, a
``(basis, bit)`` pair from ``PRF(shared_key, sha256(message), round)`` and sends a
qubit prepared accordingly.  Bob re-derives the same ``(basis, bit)`` sequence and

  * checks Alice's *declared* bases/bits against his own      -> forgery check
  * checks the signature nonce has not been seen before       -> replay check
  * measures each received qubit and counts mismatches (QBER) -> channel-tamper check

Only a holder of ``shared_key`` can produce a declaration that is authentic *and*
yields QBER ~ 0 on a clean channel.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
import time
from dataclasses import dataclass, field

import numpy as np

from qsig.qubits import fidelity, measure, prepare
from qsig.teleport import teleport

_BASIS_FROM_BIT = {0: "Z", 1: "X"}


def establish_shared_key(n_bits: int, rng: np.random.Generator) -> bytes:
    """Simulate a BB84 key exchange on a clean channel and return ``ceil(n_bits/8)`` bytes.

    Alice sends random bits in random Z/X bases; Bob measures in random bases;
    the sifted key keeps only the rounds where their bases agreed.
    """
    if n_bits <= 0:
        raise ValueError("n_bits must be positive")
    sifted: list[int] = []
    while len(sifted) < n_bits:
        a_bits = rng.integers(0, 2, size=4 * n_bits)
        a_bases = rng.integers(0, 2, size=4 * n_bits)
        b_bases = rng.integers(0, 2, size=4 * n_bits)
        for bit, ab, bb in zip(a_bits, a_bases, b_bases, strict=True):
            if ab != bb:
                continue
            basis = _BASIS_FROM_BIT[int(ab)]
            _, _ = measure(prepare(basis, int(bit)), basis, rng)  # clean channel -> outcome == bit
            sifted.append(int(bit))
            if len(sifted) >= n_bits:
                break
    bits = np.array(sifted[:n_bits], dtype=np.uint8)
    packed = np.packbits(np.pad(bits, (0, (-len(bits)) % 8)))
    return packed.tobytes()


def _round_choice(shared_key: bytes, digest: bytes, index: int) -> tuple[str, int]:
    tag = hmac.new(shared_key, digest + index.to_bytes(4, "big"), hashlib.sha256).digest()
    basis = _BASIS_FROM_BIT[tag[0] & 1]
    bit = (tag[0] >> 1) & 1
    return basis, bit


def expected_rounds(shared_key: bytes, digest: bytes, n_rounds: int) -> list[tuple[str, int]]:
    """The ``(basis, bit)`` sequence a key holder derives for this message digest."""
    return [_round_choice(shared_key, digest, i) for i in range(n_rounds)]


@dataclass
class Signature:
    """A quantum signature: Alice's classical declaration plus the qubits in flight."""

    message: str
    digest: bytes
    key_id: str
    nonce: bytes
    timestamp: float
    declared: list[tuple[str, int]]
    qubits: list[np.ndarray]

    @property
    def n_rounds(self) -> int:
        return len(self.declared)


def sign(message: str, shared_key: bytes, n_rounds: int, *, key_id: str = "alice") -> Signature:
    """Produce a :class:`Signature` for ``message`` under ``shared_key``."""
    digest = hashlib.sha256(message.encode()).digest()
    rounds = expected_rounds(shared_key, digest, n_rounds)
    qubits = [prepare(basis, bit) for basis, bit in rounds]
    return Signature(
        message=message,
        digest=digest,
        key_id=key_id,
        # A per-transmission nonce: independent of the run seed so that replaying
        # the *quantum* simulation never looks like a replayed *signature*.
        nonce=secrets.token_bytes(16),
        timestamp=time.time(),
        declared=rounds,
        qubits=qubits,
    )


def transmit(signature: Signature, channel, rng: np.random.Generator) -> list[np.ndarray]:
    """Pass every signature qubit through ``channel`` (a ``(qubit, rng) -> qubit`` callable)."""
    return [channel(q, rng) for q in signature.qubits]


def ideal_channel(qubit: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """The honest channel: teleport the qubit to Bob (fidelity 1, no eavesdropper)."""
    return teleport(qubit, rng)


@dataclass
class VerifyResult:
    accepted: bool
    qber: float
    mean_fidelity: float
    declaration_mismatch: float
    nonce_fresh: bool
    n_rounds: int
    threshold: float
    per_round_error: list[bool] = field(default_factory=list)
    checks: dict[str, bool] = field(default_factory=dict)


def verify(
    signature: Signature,
    received_qubits: list[np.ndarray],
    shared_key: bytes,
    seen_nonces: set[bytes],
    rng: np.random.Generator,
    *,
    t_reject: float,
) -> VerifyResult:
    """Run Bob's three checks and return a :class:`VerifyResult`."""
    digest = hashlib.sha256(signature.message.encode()).digest()
    expected = expected_rounds(shared_key, digest, signature.n_rounds)

    mismatched_declarations = sum(
        int(dec != exp) for dec, exp in zip(signature.declared, expected, strict=True)
    )
    declaration_mismatch = mismatched_declarations / signature.n_rounds

    nonce_fresh = signature.nonce not in seen_nonces
    if nonce_fresh:
        seen_nonces.add(signature.nonce)

    per_round_error: list[bool] = []
    fidelities: list[float] = []
    for recv, (basis, bit), sent in zip(received_qubits, expected, signature.qubits, strict=True):
        outcome, _ = measure(recv, basis, rng)
        per_round_error.append(outcome != bit)
        fidelities.append(fidelity(recv, sent))

    qber = sum(per_round_error) / signature.n_rounds
    mean_fidelity = float(np.mean(fidelities))

    checks = {
        "declaration_authentic": declaration_mismatch == 0.0,
        "nonce_fresh": nonce_fresh,
        "qber_within_threshold": qber <= t_reject,
    }
    return VerifyResult(
        accepted=all(checks.values()),
        qber=qber,
        mean_fidelity=mean_fidelity,
        declaration_mismatch=declaration_mismatch,
        nonce_fresh=nonce_fresh,
        n_rounds=signature.n_rounds,
        threshold=t_reject,
        per_round_error=per_round_error,
        checks=checks,
    )
