"""One full pass of the pipeline: sign -> attack channel -> verify -> classify."""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from qsig.attacks import AttackConfig, forged_key, make_channel
from qsig.detector import DEFAULT_T_REJECT, Detection, classify
from qsig.signature import (
    Signature,
    VerifyResult,
    establish_shared_key,
    sign,
    transmit,
    verify,
)

__all__ = ["RunResult", "establish_shared_key", "run_round"]


@dataclass
class RunResult:
    message: str
    signature: Signature
    verification: VerifyResult
    detection: Detection
    n_rounds: int
    cumulative_qber: list[float] = field(default_factory=list)
    error_positions: list[int] = field(default_factory=list)

    @property
    def accepted(self) -> bool:
        return self.detection.accepted

    @property
    def qber(self) -> float:
        return self.verification.qber

    @property
    def mean_fidelity(self) -> float:
        return self.verification.mean_fidelity

    @property
    def attack_type(self) -> str:
        return self.detection.attack_type

    @property
    def headline(self) -> str:
        return self.detection.headline


def _cumulative(errors: list[bool]) -> list[float]:
    running = 0
    out: list[float] = []
    for i, err in enumerate(errors, start=1):
        running += int(err)
        out.append(running / i)
    return out


def run_round(
    message: str,
    shared_key: bytes,
    *,
    attack: AttackConfig | None = None,
    n_rounds: int = 128,
    seed: int | None = None,
    seen_nonces: set[bytes] | None = None,
    t_reject: float = DEFAULT_T_REJECT,
    captured_signature: Signature | None = None,
) -> RunResult:
    """Sign ``message``, push it through the (possibly attacked) channel, verify, classify.

    ``captured_signature`` is required when ``attack.replay`` is set - it is the
    signature the attacker recorded on an earlier transmission.
    """
    attack = attack or AttackConfig()
    rng = np.random.default_rng(seed)
    seen_nonces = seen_nonces if seen_nonces is not None else set()

    if attack.replay:
        if captured_signature is None:
            raise ValueError("replay attack needs a captured_signature to resend")
        signature = captured_signature
        seen_nonces.add(signature.nonce)  # it was already seen on the original transmission
    elif attack.forgery:
        fake_key = forged_key(len(shared_key), rng)
        signature = sign(message, fake_key, n_rounds, key_id="forger")
    else:
        signature = sign(message, shared_key, n_rounds, key_id="alice")

    channel = make_channel(attack, rng)
    received = transmit(signature, channel, rng)
    result = verify(signature, received, shared_key, seen_nonces, rng, t_reject=t_reject)
    detection = classify(result, noise_floor=attack.noise)

    return RunResult(
        message=message,
        signature=signature,
        verification=result,
        detection=detection,
        n_rounds=signature.n_rounds,
        cumulative_qber=_cumulative(result.per_round_error),
        error_positions=[i for i, e in enumerate(result.per_round_error) if e],
    )
