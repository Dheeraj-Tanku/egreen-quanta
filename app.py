"""Quantum Signature Shield - interactive dashboard for the QDS pipeline simulator.

    streamlit run app.py

Sign a message, flip attacks on the channel, and watch the non-AI detector accept
or reject the signature in real time from the QBER and state fidelity.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import streamlit as st

from qsig.attacks import AttackConfig
from qsig.protocol import establish_shared_key, run_round
from qsig.signature import expected_rounds

st.set_page_config(page_title="Quantum Signature Shield", page_icon="\N{SHIELD}", layout="wide")

DEFAULT_MESSAGE = "Transfer 1,000,000 to account 4471-8890-2231"
KEY_BITS = 256
KET = {("Z", 0): "|0>", ("Z", 1): "|1>", ("X", 0): "|+>", ("X", 1): "|->"}


# --------------------------------------------------------------------------- state
def _init() -> None:
    ss = st.session_state
    ss.setdefault("shared_key", establish_shared_key(KEY_BITS, np.random.default_rng(20260911)))
    ss.setdefault("seen_nonces", set())
    ss.setdefault("captured", None)
    ss.setdefault("captured_label", None)
    ss.setdefault("history", [])
    ss.setdefault("last", None)


def _reset() -> None:
    for k in ("seen_nonces", "captured", "captured_label", "history", "last"):
        st.session_state.pop(k, None)
    _init()


_init()

# ------------------------------------------------------------------------- sidebar
with st.sidebar:
    st.header("Channel controls")
    message = st.text_area("Message to sign", DEFAULT_MESSAGE, height=90)
    n_rounds = st.slider("Signature rounds (qubits)", 32, 512, 160, step=16)
    t_reject = st.slider("Reject threshold  T_reject (QBER)", 0.02, 0.40, 0.11, step=0.01)
    seed = int(st.number_input("Random seed", value=42, step=1))

    st.divider()
    st.subheader("Hacker attack panel")
    atk_eaves = st.toggle("Eavesdrop / MITM  (intercept & copy)")
    atk_forge = st.toggle("Forgery  (sign with a fake quantum key)")
    can_replay = st.session_state.captured is not None
    atk_replay = st.toggle(
        "Replay  (resend a captured signature)",
        disabled=not can_replay,
        help="Capture a signature first (button below).",
    )
    atk_noise = st.slider("Noise / interference", 0.0, 0.5, 0.0, step=0.01)

    st.divider()
    run_clicked = st.button("Sign & send", type="primary", use_container_width=True)
    capture_clicked = st.button(
        "Capture last signature (for replay)",
        use_container_width=True,
        disabled=st.session_state.last is None,
    )
    if st.button("Reset session", use_container_width=True):
        _reset()
        st.rerun()

    if st.session_state.captured is not None:
        st.caption(f"Captured: _{st.session_state.captured_label}_")


# --------------------------------------------------------------------------- actions
if capture_clicked and st.session_state.last is not None:
    sig = st.session_state.last["result"].signature
    st.session_state.captured = sig
    st.session_state.captured_label = f'"{sig.message[:40]}..." nonce {sig.nonce.hex()[:8]}'
    st.rerun()

if run_clicked:
    attack = AttackConfig(
        eavesdrop=atk_eaves,
        forgery=atk_forge,
        replay=atk_replay and can_replay,
        noise=atk_noise,
    )
    result = run_round(
        message,
        st.session_state.shared_key,
        attack=attack,
        n_rounds=n_rounds,
        seed=seed,
        seen_nonces=st.session_state.seen_nonces,
        t_reject=t_reject,
        captured_signature=st.session_state.captured if attack.replay else None,
    )
    st.session_state.last = {"result": result, "attack": attack}
    st.session_state.history.append(
        {
            "run": len(st.session_state.history) + 1,
            "attacks": ", ".join(attack.labels) or "none",
            "QBER": round(result.qber, 4),
            "fidelity": round(result.mean_fidelity, 4),
            "verdict": result.detection.status,
            "detected": result.attack_type,
        }
    )


# ----------------------------------------------------------------------------- head
st.title("Quantum Signature Shield")
st.caption(
    "Bell-state / teleportation signature channel with a pure-math intrusion detector. "
    "Attacks disturb the quantum states; the QBER and fidelity give them away."
)

if st.session_state.last is None:
    st.info("Set a message and press **Sign & send** in the sidebar to run the pipeline.")
    st.stop()

res = st.session_state.last["result"]
det = res.detection

# --------------------------------------------------------------------------- status
left, right = st.columns([3, 2], gap="large")

with left:
    if res.accepted:
        st.success(f"**{det.headline.upper()}**", icon="\N{WHITE HEAVY CHECK MARK}")
    else:
        st.error(f"**{det.headline.upper()}**", icon="\N{POLICE CARS REVOLVING LIGHT}")
    st.markdown(
        f"**Verdict:** `{det.status}`  |  **Detector call:** `{det.attack_type}`  "
        f"|  **Severity:** `{det.severity}`"
    )
    st.markdown(f"> {det.reason}")

with right:
    c1, c2 = st.columns(2)
    c1.metric(
        "QBER",
        f"{res.qber:.3f}",
        delta=f"{res.qber - res.detection.threshold:+.3f} vs T_reject",
        delta_color="inverse",
    )
    c2.metric("Mean state fidelity", f"{res.mean_fidelity:.3f}")
    c3, c4 = st.columns(2)
    c3.metric("Declaration match", f"{(1 - res.verification.declaration_mismatch) * 100:.0f}%")
    c4.metric("Nonce", "fresh" if res.verification.nonce_fresh else "REPLAYED")

st.divider()

# ------------------------------------------------------------------ live error graph
st.subheader("Live error rate")
curve = pd.DataFrame(
    {
        "Cumulative QBER": res.cumulative_qber,
        "Reject threshold": [res.detection.threshold] * res.n_rounds,
    },
    index=pd.RangeIndex(1, res.n_rounds + 1, name="round"),
)
st.line_chart(curve, height=280, color=["#e5484d", "#8b8d98"])

strip = np.zeros(res.n_rounds, dtype=int)
strip[res.error_positions] = 1
st.bar_chart(
    pd.DataFrame({"error": strip}, index=pd.RangeIndex(1, res.n_rounds + 1, name="round")),
    height=120,
    color="#e5484d",
)
st.caption(
    f"{len(res.error_positions)} of {res.n_rounds} rounds mismatched  "
    f"->  QBER {res.qber:.3f}   (threshold {res.detection.threshold:.3f})"
)

# --------------------------------------------------------------------------- details
d1, d2, d3 = st.columns(3)

with d1.expander("Detector checks", expanded=True):
    checks = res.verification.checks
    st.table(
        pd.DataFrame(
            [
                {"check": "Declaration authentic", "pass": checks["declaration_authentic"]},
                {"check": "Nonce fresh", "pass": checks["nonce_fresh"]},
                {"check": "QBER within threshold", "pass": checks["qber_within_threshold"]},
            ]
        ).set_index("check")
    )

with d2.expander("Quantum rounds (first 10)"):
    exp = expected_rounds(st.session_state.shared_key, res.signature.digest, res.n_rounds)
    err = set(res.error_positions)
    st.table(
        pd.DataFrame(
            [
                {
                    "round": i,
                    "Alice basis": exp[i][0],
                    "bit": exp[i][1],
                    "prepared": KET[exp[i]],
                    "error": "x" if i in err else "",
                }
                for i in range(min(10, res.n_rounds))
            ]
        ).set_index("round")
    )

with d3.expander("Run history"):
    if st.session_state.history:
        st.dataframe(
            pd.DataFrame(st.session_state.history).set_index("run"), use_container_width=True
        )
    else:
        st.write("No runs yet.")

with st.expander("How the protocol works"):
    st.markdown(
        """
* **Setup.** Alice and Bob share a 256-bit key from a simulated BB84 exchange.
* **Sign.** For each round Alice derives `(basis, bit)` from
  `HMAC(shared_key, sha256(message), round)` and sends a qubit prepared in that
  Z/X state - teleported to Bob over a fresh Bell pair `|Phi+>`.
* **Verify.** Bob re-derives the same sequence and runs three checks:
  1. **Declaration** - do Alice's declared bases/bits match the key? (catches **forgery**)
  2. **Nonce** - has this signature been seen before? (catches **replay**)
  3. **QBER** - measure each qubit; the mismatch rate must stay below `T_reject`
     (catches **eavesdropping** and **noise**)
* **Physics.** An intercept-resend eavesdropper guesses the basis and is wrong
  half the time, collapsing the state and forcing **QBER -> 25%**, fidelity -> 75%.
"""
    )
