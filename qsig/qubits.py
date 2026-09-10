"""Single-qubit state vectors, gates, Pauli-basis measurement, fidelity, noise.

States are length-2 complex NumPy arrays in the computational ({|0>, |1>}) basis.
Everything here is exact linear algebra - no external quantum SDK.
"""

from __future__ import annotations

import numpy as np

# --------------------------------------------------------------------------- kets
KET_0 = np.array([1.0 + 0j, 0.0 + 0j])
KET_1 = np.array([0.0 + 0j, 1.0 + 0j])
KET_PLUS = np.array([1.0, 1.0], dtype=complex) / np.sqrt(2)
KET_MINUS = np.array([1.0, -1.0], dtype=complex) / np.sqrt(2)
KET_PLUS_I = np.array([1.0, 1.0j], dtype=complex) / np.sqrt(2)
KET_MINUS_I = np.array([1.0, -1.0j], dtype=complex) / np.sqrt(2)

# ------------------------------------------------------------------------- gates
I2 = np.eye(2, dtype=complex)
PAULI_X = np.array([[0, 1], [1, 0]], dtype=complex)
PAULI_Y = np.array([[0, -1j], [1j, 0]], dtype=complex)
PAULI_Z = np.array([[1, 0], [0, -1]], dtype=complex)
HADAMARD = np.array([[1, 1], [1, -1]], dtype=complex) / np.sqrt(2)

#: Eigenvectors for each measurement basis: (outcome-0 ket, outcome-1 ket).
#: Outcome 0 is the +1 eigenstate, outcome 1 the -1 eigenstate.
BASES: dict[str, tuple[np.ndarray, np.ndarray]] = {
    "Z": (KET_0, KET_1),
    "X": (KET_PLUS, KET_MINUS),
    "Y": (KET_PLUS_I, KET_MINUS_I),
}


def normalize(state: np.ndarray) -> np.ndarray:
    """Return ``state`` scaled to unit norm."""
    norm = np.linalg.norm(state)
    if norm == 0:
        raise ValueError("cannot normalize the zero vector")
    return state / norm


def apply_gate(gate: np.ndarray, state: np.ndarray) -> np.ndarray:
    """Apply a 2x2 unitary to a single-qubit state."""
    return gate @ state


def prepare(basis: str, bit: int) -> np.ndarray:
    """Prepare the qubit encoding ``bit`` in ``basis`` (one of ``"Z"``, ``"X"``, ``"Y"``)."""
    if basis not in BASES:
        raise ValueError(f"unknown basis {basis!r}")
    return BASES[basis][int(bit) & 1].copy()


def born_probabilities(state: np.ndarray, basis: str) -> tuple[float, float]:
    """(p0, p1) for measuring ``state`` in ``basis`` via the Born rule."""
    e0, e1 = BASES[basis]
    p0 = float(np.abs(np.vdot(e0, state)) ** 2)
    p1 = float(np.abs(np.vdot(e1, state)) ** 2)
    total = p0 + p1
    return p0 / total, p1 / total


def measure(state: np.ndarray, basis: str, rng: np.random.Generator) -> tuple[int, np.ndarray]:
    """Projectively measure ``state`` in ``basis``.

    Returns ``(outcome_bit, collapsed_state)``.
    """
    e0, e1 = BASES[basis]
    p0, _ = born_probabilities(state, basis)
    if rng.random() < p0:
        return 0, e0.copy()
    return 1, e1.copy()


def fidelity(a: np.ndarray, b: np.ndarray) -> float:
    """State fidelity |<a|b>|^2 for two pure single-qubit states."""
    return float(np.abs(np.vdot(a, b)) ** 2)


def depolarize(state: np.ndarray, p: float, rng: np.random.Generator) -> np.ndarray:
    """Send ``state`` through a depolarising channel of strength ``p`` in [0, 1].

    Implemented as a Pauli twirl: identity with probability ``1 - 3p/4`` and each
    of X, Y, Z with probability ``p/4``.  This reproduces
    ``rho -> (1 - p) rho + p I / 2`` in expectation.
    """
    if p <= 0:
        return state
    p = min(p, 1.0)
    which = rng.choice(4, p=[1 - 3 * p / 4, p / 4, p / 4, p / 4])
    if which == 0:
        return state
    return (PAULI_X, PAULI_Y, PAULI_Z)[which - 1] @ state


def bit_error_rate(sent_bits: list[int], received_bits: list[int]) -> float:
    """Fraction of positions where the two bit strings disagree (the QBER)."""
    if not sent_bits:
        return 0.0
    if len(sent_bits) != len(received_bits):
        raise ValueError("bit strings differ in length")
    mismatches = sum(int(a != b) for a, b in zip(sent_bits, received_bits, strict=True))
    return mismatches / len(sent_bits)
