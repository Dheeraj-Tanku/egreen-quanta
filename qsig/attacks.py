"""Attack-injection suite: what a hacker can do to the quantum-signature channel.

* Eavesdrop / MITM  - intercept every qubit, measure it in a guessed basis,
  resend a fresh qubit.  Guessing wrong half the time collapses the state and
  drives the QBER to ~25 %.
* Forgery           - sign with a key that is not the shared key.
* Replay            - resend a previously captured signature verbatim.
* Noise             - a depolarising channel standing in for bad hardware /
  interference (no attacker, but the detector must still react).
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

import numpy as np

from qsig.qubits import BASES, depolarize, measure
from qsig.teleport import teleport

Channel = Callable[[np.ndarray, np.random.Generator], np.ndarray]

_BASIS_NAMES = ("Z", "X")


@dataclass
class AttackConfig:
    """Which attacks are switched on for a run (mirrors the dashboard toggles)."""

    eavesdrop: bool = False
    forgery: bool = False
    replay: bool = False
    noise: float = 0.0
    eavesdrop_fraction: float = 1.0

    @property
    def active(self) -> bool:
        return self.eavesdrop or self.forgery or self.replay or self.noise > 0.0

    @property
    def labels(self) -> list[str]:
        out: list[str] = []
        if self.eavesdrop:
            out.append("eavesdrop/MITM")
        if self.forgery:
            out.append("forgery")
        if self.replay:
            out.append("replay")
        if self.noise > 0:
            out.append(f"noise={self.noise:.2f}")
        return out


def intercept_resend(qubit: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Eve measures ``qubit`` in a random Z/X basis and resends her collapsed state."""
    basis = _BASIS_NAMES[int(rng.integers(0, 2))]
    outcome, collapsed = measure(qubit, basis, rng)
    del outcome
    return collapsed


def forged_key(reference_len: int, rng: np.random.Generator) -> bytes:
    """A key of the right size that Eve guessed - almost certainly not the shared key."""
    return rng.bytes(reference_len)


def make_channel(cfg: AttackConfig, rng: np.random.Generator) -> Channel:
    """Compose the per-qubit transmission channel for ``cfg``.

    Order per qubit: optional depolarising noise -> optional intercept-resend ->
    honest teleportation hop to Bob.
    """

    def channel(qubit: np.ndarray, r: np.random.Generator) -> np.ndarray:
        state = qubit
        if cfg.noise > 0:
            state = depolarize(state, cfg.noise, r)
        if cfg.eavesdrop and r.random() < cfg.eavesdrop_fraction:
            state = intercept_resend(state, r)
        return teleport(state, r)

    del rng  # channel draws from the rng passed to each call
    return channel


# Convenience: the ideal Z/X eigenstates, handy for tests and the UI.
EIGENSTATES = {(b, k): BASES[b][k] for b in ("Z", "X") for k in (0, 1)}
