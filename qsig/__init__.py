"""qsig — a Quantum Digital Signature (QDS) pipeline simulator.

Pure-NumPy simulation of a prepare-and-measure quantum-signature channel with an
attack-injection suite and a non-AI (pure-math) intrusion detector based on the
Quantum Bit Error Rate (QBER) and state fidelity.

Layers
------
qubits      single-qubit states, gates, Pauli measurement, fidelity, noise
bell        Bell |Phi+> pair preparation and correlated measurement
teleport    exact quantum-teleportation primitive (used as the honest channel)
signature   BB84-style shared-key setup, sign(), transmit(), verify()
attacks     intercept-resend (MITM), forgery, replay, depolarising noise
detector    QBER-vs-threshold decision + attack-type classification
protocol    one full run: sign -> attack channel -> verify -> classify
"""

from __future__ import annotations

__version__ = "1.0.0"

from qsig.attacks import AttackConfig
from qsig.detector import DEFAULT_T_REJECT, Detection, classify
from qsig.protocol import RunResult, run_round
from qsig.signature import Signature, VerifyResult, establish_shared_key, sign, verify

__all__ = [
    "DEFAULT_T_REJECT",
    "AttackConfig",
    "Detection",
    "RunResult",
    "Signature",
    "VerifyResult",
    "classify",
    "establish_shared_key",
    "run_round",
    "sign",
    "verify",
]
