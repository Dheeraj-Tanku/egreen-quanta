"""Headless walkthrough of every scenario - for judging without the dashboard.

python scripts/demo.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import numpy as np

from qsig.attacks import AttackConfig
from qsig.protocol import establish_shared_key, run_round

MESSAGE = "Transfer 1,000,000 to account 4471-8890-2231"
ROUNDS = 200


def _line(name: str, res) -> str:
    verdict = "ACCEPT " if res.accepted else "REJECT "
    return (
        f"{name:<22} {verdict}  QBER={res.qber:6.3f}  fidelity={res.mean_fidelity:5.3f}  "
        f"decl_mismatch={res.verification.declaration_mismatch:5.2f}  "
        f"nonce={'fresh' if res.verification.nonce_fresh else 'STALE'}  "
        f"-> {res.attack_type}"
    )


def main() -> None:
    key = establish_shared_key(256, np.random.default_rng(20260911))
    print(f"shared key: {len(key) * 8} bits established via simulated BB84\n")
    print(f"message   : {MESSAGE!r}")
    print(f"rounds    : {ROUNDS}   T_reject: 0.11\n")
    print("-" * 92)

    scenarios = [
        ("A  no attack", AttackConfig(), None),
        ("B  eavesdrop/MITM", AttackConfig(eavesdrop=True), None),
        ("   forgery", AttackConfig(forgery=True), None),
        ("   noise 0.10", AttackConfig(noise=0.10), None),
        ("   noise 0.40", AttackConfig(noise=0.40), None),
    ]
    for name, atk, _ in scenarios:
        res = run_round(MESSAGE, key, attack=atk, n_rounds=ROUNDS, seed=42)
        print(_line(name, res))

    # replay needs a captured signature from a real transmission
    first = run_round(MESSAGE, key, attack=AttackConfig(), n_rounds=ROUNDS, seed=1)
    seen = {first.signature.nonce}
    replay = run_round(
        MESSAGE,
        key,
        attack=AttackConfig(replay=True),
        n_rounds=ROUNDS,
        seed=2,
        seen_nonces=seen,
        captured_signature=first.signature,
    )
    print(_line("   replay", replay))
    print("-" * 92)
    print("\nScenario A -> green 'Signature validated'.  Scenario B -> red 'Attack detected'.")


if __name__ == "__main__":
    main()
