"""Attack signatures and the non-AI classifier."""

from __future__ import annotations

import numpy as np
import pytest

from qsig.attacks import AttackConfig, intercept_resend
from qsig.detector import FORGERY, MITM, NOISE, NONE, REPLAY, classify
from qsig.protocol import establish_shared_key, run_round
from qsig.qubits import prepare

MSG = "settlement batch 2026-09-11 / ref 88213"


def _key(seed: int = 0) -> bytes:
    return establish_shared_key(256, np.random.default_rng(seed))


def test_intercept_resend_forces_quarter_qber() -> None:
    rng = np.random.default_rng(0)
    errors = 0
    trials = 4000
    for _ in range(trials):
        basis, bit = ("Z", 0)
        sent = prepare(basis, bit)
        got = intercept_resend(sent, rng)
        # Bob measures in Alice's basis
        from qsig.qubits import measure

        outcome, _ = measure(got, basis, rng)
        errors += int(outcome != bit)
    assert 0.20 < errors / trials < 0.30  # canonical ~25 %


@pytest.mark.parametrize("seed", [1, 2, 3])
def test_scenario_a_clean_accepts(seed: int) -> None:
    res = run_round(MSG, _key(), attack=AttackConfig(), n_rounds=160, seed=seed)
    assert res.accepted
    assert res.attack_type == NONE
    assert res.qber == 0.0


@pytest.mark.parametrize("seed", [1, 2, 3])
def test_scenario_b_eavesdrop_detected(seed: int) -> None:
    res = run_round(MSG, _key(), attack=AttackConfig(eavesdrop=True), n_rounds=160, seed=seed)
    assert not res.accepted
    assert res.attack_type == MITM
    assert res.qber > res.detection.threshold
    assert 0.17 <= res.qber <= 0.34
    assert 0.63 <= res.mean_fidelity <= 0.86


def test_forgery_detected() -> None:
    res = run_round(MSG, _key(), attack=AttackConfig(forgery=True), n_rounds=160, seed=4)
    assert not res.accepted
    assert res.attack_type == FORGERY
    assert res.verification.declaration_mismatch > 0.4


def test_replay_detected_even_on_clean_channel() -> None:
    key = _key()
    first = run_round(MSG, key, attack=AttackConfig(), n_rounds=96, seed=7)
    seen = {first.signature.nonce}
    replayed = run_round(
        MSG,
        key,
        attack=AttackConfig(replay=True),
        n_rounds=96,
        seed=8,
        seen_nonces=seen,
        captured_signature=first.signature,
    )
    assert not replayed.accepted
    assert replayed.attack_type == REPLAY
    assert replayed.qber == 0.0  # channel is clean; the nonce is what betrays it


def test_heavy_noise_flagged_as_environmental() -> None:
    res = run_round(MSG, _key(), attack=AttackConfig(noise=0.4), n_rounds=200, seed=5)
    assert not res.accepted
    assert res.attack_type == NOISE  # rejected, but not blamed on an attacker


def test_low_noise_below_threshold_still_accepts() -> None:
    res = run_round(MSG, _key(), attack=AttackConfig(noise=0.05), n_rounds=400, seed=6)
    # p/2 ~ 0.025 QBER, under the 0.11 threshold
    assert res.accepted
    assert res.attack_type == NONE


def test_determinism() -> None:
    a = run_round(MSG, _key(), attack=AttackConfig(eavesdrop=True), n_rounds=128, seed=99)
    b = run_round(MSG, _key(), attack=AttackConfig(eavesdrop=True), n_rounds=128, seed=99)
    assert a.qber == b.qber
    assert a.cumulative_qber == b.cumulative_qber
    assert a.error_positions == b.error_positions


def test_classifier_is_pure_function_of_verify_result() -> None:
    res = run_round(MSG, _key(), attack=AttackConfig(eavesdrop=True), n_rounds=128, seed=3)
    again = classify(res.verification, noise_floor=0.0)
    assert again.attack_type == res.detection.attack_type
    assert again.reason == res.detection.reason
