"""Bell |Phi+> pair preparation and correlated single-subsystem measurement.

Two-qubit states are length-4 complex arrays, big-endian (qubit 0 = most
significant), consistent with :func:`numpy.kron`.
"""

from __future__ import annotations

import numpy as np

from qsig.qubits import BASES

#: The Bell state |Phi+> = (|00> + |11>) / sqrt(2).
PHI_PLUS = np.array([1.0, 0.0, 0.0, 1.0], dtype=complex) / np.sqrt(2)
#: |Psi-> = (|01> - |10>) / sqrt(2), the singlet (anti-correlated in every basis).
PSI_MINUS = np.array([0.0, 1.0, -1.0, 0.0], dtype=complex) / np.sqrt(2)


def bell_pair() -> np.ndarray:
    """Return a fresh |Phi+> entangled pair (qubit A = first, qubit B = second)."""
    return PHI_PLUS.copy()


def _subsystem_projectors(qubit: int, basis: str) -> tuple[np.ndarray, np.ndarray]:
    e0, e1 = BASES[basis]
    p0 = np.outer(e0, e0.conj())
    p1 = np.outer(e1, e1.conj())
    other = np.eye(2, dtype=complex)
    if qubit == 0:
        return np.kron(p0, other), np.kron(p1, other)
    return np.kron(other, p0), np.kron(other, p1)


def measure_subsystem(
    state: np.ndarray, qubit: int, basis: str, rng: np.random.Generator
) -> tuple[int, np.ndarray]:
    """Measure one qubit (0 or 1) of a two-qubit ``state`` in ``basis``.

    Returns ``(outcome_bit, collapsed_two_qubit_state)``.
    """
    proj0, proj1 = _subsystem_projectors(qubit, basis)
    amp0 = proj0 @ state
    p0 = float(np.real(np.vdot(amp0, amp0)))
    if rng.random() < p0:
        return 0, amp0 / np.sqrt(p0)
    amp1 = proj1 @ state
    p1 = float(np.real(np.vdot(amp1, amp1)))
    return 1, amp1 / np.sqrt(p1)


def correlated_bits(state: np.ndarray, basis: str, rng: np.random.Generator) -> tuple[int, int]:
    """Measure both qubits of ``state`` in the same ``basis``; return ``(a, b)``.

    For |Phi+> in the Z or X basis the two outcomes are always equal.
    """
    a, collapsed = measure_subsystem(state, 0, basis, rng)
    b, _ = measure_subsystem(collapsed, 1, basis, rng)
    return a, b
