"""Exact quantum teleportation of one qubit, used as the honest transmission channel.

Alice teleports an arbitrary payload state |psi> to Bob by consuming one fresh
Bell pair plus two classical bits.  On a clean channel Bob recovers |psi> with
fidelity 1 - this module is what the attack suite has to disturb.
"""

from __future__ import annotations

from functools import reduce

import numpy as np

from qsig.bell import bell_pair
from qsig.qubits import HADAMARD, I2, KET_0, KET_1, PAULI_X, PAULI_Z, normalize

_P0 = np.outer(KET_0, KET_0.conj())
_P1 = np.outer(KET_1, KET_1.conj())


def _kron(mats: list[np.ndarray]) -> np.ndarray:
    return reduce(np.kron, mats)


def _op(gate: np.ndarray, target: int, n: int) -> np.ndarray:
    """Embed a 1-qubit ``gate`` acting on ``target`` into an n-qubit operator."""
    return _kron([gate if q == target else I2 for q in range(n)])


def _cnot(control: int, target: int, n: int) -> np.ndarray:
    control_off = _kron([_P0 if q == control else I2 for q in range(n)])
    control_on = _kron(
        [_P1 if q == control else (PAULI_X if q == target else I2) for q in range(n)]
    )
    return control_off + control_on


def _measure_qubit(
    state: np.ndarray, target: int, n: int, rng: np.random.Generator
) -> tuple[int, np.ndarray]:
    amp0 = _op(_P0, target, n) @ state
    p0 = float(np.real(np.vdot(amp0, amp0)))
    if rng.random() < p0:
        return 0, amp0 / np.sqrt(p0)
    amp1 = _op(_P1, target, n) @ state
    return 1, amp1 / np.sqrt(float(np.real(np.vdot(amp1, amp1))))


def teleport(payload: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Teleport a single-qubit ``payload`` state and return Bob's output qubit."""
    payload = normalize(np.asarray(payload, dtype=complex))
    # q0 = payload, q1 = Alice's Bell half, q2 = Bob's Bell half
    state = np.kron(payload, bell_pair())

    state = _cnot(0, 1, 3) @ state
    state = _op(HADAMARD, 0, 3) @ state

    m0, state = _measure_qubit(state, 0, 3, rng)
    m1, state = _measure_qubit(state, 1, 3, rng)

    bob = normalize(state.reshape(2, 2, 2)[m0, m1, :])
    if m1:
        bob = PAULI_X @ bob
    if m0:
        bob = PAULI_Z @ bob
    return bob
