"""Single-qubit primitives: measurement statistics, fidelity, Pauli algebra, noise."""

from __future__ import annotations

import numpy as np
import pytest

from qsig import qubits as q


def test_eigenstate_measurement_is_deterministic() -> None:
    rng = np.random.default_rng(0)
    for _ in range(50):
        assert q.measure(q.KET_0, "Z", rng)[0] == 0
        assert q.measure(q.KET_1, "Z", rng)[0] == 1
        assert q.measure(q.KET_PLUS, "X", rng)[0] == 0
        assert q.measure(q.KET_MINUS, "X", rng)[0] == 1


def test_conjugate_basis_measurement_is_uniform() -> None:
    rng = np.random.default_rng(42)
    ones = sum(q.measure(q.KET_0, "X", rng)[0] for _ in range(4000))
    assert 1850 < ones < 2150  # ~50 %


def test_fidelity_values() -> None:
    assert q.fidelity(q.KET_0, q.KET_0) == pytest.approx(1.0)
    assert q.fidelity(q.KET_0, q.KET_1) == pytest.approx(0.0, abs=1e-12)
    assert q.fidelity(q.KET_0, q.KET_PLUS) == pytest.approx(0.5)


def test_pauli_algebra() -> None:
    assert np.allclose(q.PAULI_X @ q.PAULI_X, q.I2)
    assert np.allclose(q.PAULI_Z @ q.PAULI_Z, q.I2)
    assert np.allclose(q.PAULI_X @ q.PAULI_Z, -1j * q.PAULI_Y)
    assert np.allclose(q.HADAMARD @ q.HADAMARD, q.I2)


def test_prepare_roundtrip() -> None:
    for basis in ("Z", "X", "Y"):
        for bit in (0, 1):
            state = q.prepare(basis, bit)
            assert np.linalg.norm(state) == pytest.approx(1.0)
            rng = np.random.default_rng(1)
            outcomes = {q.measure(state, basis, rng)[0] for _ in range(20)}
            assert outcomes == {bit}


def test_depolarize_zero_is_identity() -> None:
    rng = np.random.default_rng(0)
    assert np.allclose(q.depolarize(q.KET_0, 0.0, rng), q.KET_0)


def test_depolarize_raises_qber() -> None:
    rng = np.random.default_rng(7)
    errors = 0
    trials = 4000
    for _ in range(trials):
        noisy = q.depolarize(q.KET_0.copy(), 0.4, rng)
        errors += q.measure(noisy, "Z", rng)[0]
    # depolarising p -> QBER ~ p/2
    assert 0.15 < errors / trials < 0.25


def test_bit_error_rate() -> None:
    assert q.bit_error_rate([0, 1, 0, 1], [0, 1, 0, 1]) == 0.0
    assert q.bit_error_rate([0, 0, 0, 0], [1, 1, 0, 0]) == 0.5
