"""Module 3 - the non-AI threat detector.

Pure decision rules over the numbers Bob already computed: the QBER, the state
fidelity, the declaration-mismatch rate and the nonce-freshness flag.  No machine
learning - just physics-backed thresholds.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from qsig.signature import VerifyResult

#: BB84-style security threshold.  An intercept-resend attacker forces QBER ~ 0.25,
#: comfortably above this; a clean channel sits at 0.
DEFAULT_T_REJECT = 0.11

NONE = "NONE"
MITM = "MITM"
FORGERY = "FORGERY"
REPLAY = "REPLAY"
NOISE = "NOISE"
TAMPERING = "TAMPERING"

_SEVERITY = {
    NONE: "ok",
    NOISE: "medium",
    TAMPERING: "high",
    MITM: "critical",
    FORGERY: "critical",
    REPLAY: "critical",
}

_HEADLINE = {
    NONE: "Signature validated",
    MITM: "Attack detected: eavesdropper on the channel",
    FORGERY: "Attack detected: forged signature",
    REPLAY: "Attack detected: replayed signature",
    NOISE: "Signature rejected: channel too noisy",
    TAMPERING: "Attack detected: channel tampering",
}


@dataclass
class Detection:
    accepted: bool
    attack_type: str
    severity: str
    headline: str
    reason: str
    qber: float
    mean_fidelity: float
    threshold: float
    checks: dict[str, bool] = field(default_factory=dict)

    @property
    def status(self) -> str:
        return "ACCEPTED" if self.accepted else "REJECTED"


def classify(result: VerifyResult, *, noise_floor: float = 0.0) -> Detection:
    """Map a :class:`VerifyResult` to a :class:`Detection`.

    ``noise_floor`` is the operator's calibrated depolarising level (0-1); the
    detector expects roughly ``noise_floor / 2`` QBER from the environment and
    treats anything well above that as adversarial.
    """
    q = result.qber
    fid = result.mean_fidelity
    thr = result.threshold

    def make(attack: str, reason: str, *, accepted: bool = False) -> Detection:
        return Detection(
            accepted=accepted,
            attack_type=attack,
            severity=_SEVERITY[attack],
            headline=_HEADLINE[attack],
            reason=reason,
            qber=q,
            mean_fidelity=fid,
            threshold=thr,
            checks=dict(result.checks),
        )

    if not result.nonce_fresh:
        return make(REPLAY, "Signature nonce has been seen before - this transmission is a replay.")

    if result.declaration_mismatch > 0.15:
        pct = result.declaration_mismatch * 100
        return make(
            FORGERY,
            f"Declared bases/bits disagree with the shared key in {pct:.0f}% of rounds - "
            "the signer does not hold the key.",
        )

    if q <= thr:
        return make(
            NONE,
            f"QBER {q:.3f} <= threshold {thr:.3f}, fidelity {fid:.3f}, declaration authentic, "
            "nonce fresh.",
            accepted=True,
        )

    expected_noise_qber = noise_floor / 2.0
    if q - expected_noise_qber <= thr:
        return make(
            NOISE,
            f"QBER {q:.3f} is consistent with the calibrated channel noise "
            f"(~{expected_noise_qber:.3f}) but still exceeds the accept threshold {thr:.3f}. "
            "Environmental, not adversarial.",
        )

    if 0.18 <= q <= 0.33 and 0.66 <= fid <= 0.84:
        return make(
            MITM,
            f"QBER {q:.3f} ~ 25% with fidelity {fid:.3f} ~ 75%: the signature of an "
            "intercept-resend eavesdropper guessing the measurement basis.",
        )

    return make(
        TAMPERING,
        f"QBER {q:.3f} exceeds the threshold {thr:.3f} and is not explained by the "
        f"calibrated noise floor (~{expected_noise_qber:.3f}).",
    )
