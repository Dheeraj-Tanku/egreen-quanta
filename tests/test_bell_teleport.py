"""Bell-pair correlations and exact quantum teleportation."""

from __future__ import annotations

import numpy as np
import pytest

from qsig.bell import bell_pair, correlated_bits, measure_subsystem
from qsig.qubits import fidelity, normalize
from qsig.teleport import teleport


def test_bell_pair_normalised() -> None:
    assert np.linalg.norm(bell_pair()) == pytest.approx(1.0)


def test_phi_plus_perfectly_correlated() -> None:
    rng = np.random.default_rng(0)
    for basis in ("Z", "X"):
        for _ in range(200):
            a, b = correlated_bits(bell_pair(), basis, rng)
            assert a == b


def test_bell_marginal_is_uniform() -> None:
    rng = np.random.default_rng(3)
    ones = sum(measure_subsystem(bell_pair(), 0, "Z", rng)[0] for _ in range(2000))
    assert 900 < ones < 1100


@pytest.mark.parametrize("seed", range(12))
def test_teleport_preserves_arbitrary_state(seed: int) -> None:
    rng = np.random.default_rng(seed)
    psi = normalize(rng.normal(size=2) + 1j * rng.normal(size=2))
    out = teleport(psi, rng)
    assert fidelity(psi, out) == pytest.approx(1.0, abs=1e-9)


def test_teleport_is_the_identity_channel_on_basis_states() -> None:
    rng = np.random.default_rng(1)
    for ket in (np.array([1, 0], dtype=complex), np.array([0, 1], dtype=complex)):
        assert fidelity(ket, teleport(ket, rng)) == pytest.approx(1.0, abs=1e-9)
