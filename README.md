# Quantum Signature Shield

**Quantum-Inspired Cyber Threat Detection for Digital Signature Security** — SIH 2026, Problem
Statement 141 (Blockchain & Cybersecurity).

A pure-Python simulation of a **Quantum Digital Signature (QDS)** pipeline with an
**attack-injection suite** and a **non-AI, pure-math intrusion detector**. Sign a message, flip
attacks on the quantum channel, and watch the detector accept or reject the signature in real
time from the **Quantum Bit Error Rate (QBER)** and **state fidelity**.

```
  Alice ── prepare qubits (Z/X) ──▶ Bell-pair teleportation ──▶ Bob ── measure ──▶ QBER / fidelity
                                          ▲                                              │
                                    Attack suite                                   Threshold check
                          (eavesdrop · forgery · replay · noise)              ACCEPT ✅ / REJECT ⛔
```

No Qiskit, no quantum hardware, no machine learning — every state is a small complex NumPy
vector and every verdict is a documented threshold.

---

## Quick start

```bash
python -m venv .venv
.venv\Scripts\activate            # Windows   (source .venv/bin/activate on Linux/macOS)
pip install -r requirements.txt

streamlit run app.py             # the interactive dashboard  ->  http://localhost:8501
python scripts/demo.py           # headless walkthrough of every scenario
pytest -q                        # 42 tests
```

## The two demo scenarios

| | Scenario A — Normal | Scenario B — Attack |
|---|---|---|
| Action | Sign & send, no interference | Flip **Eavesdrop / MITM**, sign & send |
| Physics | states arrive intact | intercept-resend collapses ~half the states |
| QBER | **0 %** | **~25 %** |
| Fidelity | 1.00 | ~0.75 |
| Dashboard | 🟢 **Signature validated** | 🔴 **Attack detected — eavesdropper on the channel** |

## The three backend modules

### 1. Quantum simulator — `qsig/qubits.py`, `qsig/bell.py`, `qsig/teleport.py`
- Single-qubit states, gates, **Pauli-basis measurement** (σx, σy, σz), fidelity, depolarising noise.
- Bell pair **|Φ⁺⟩ = (|00⟩ + |11⟩)/√2** and correlated subsystem measurement.
- **Exact quantum teleportation** (CNOT · H · Bell measurement · Pauli correction) — verified to
  reconstruct any input state with fidelity 1. This is the honest transmission channel.

### 2. Attack injection suite — `qsig/attacks.py`
| Toggle | What it does | Signature |
|---|---|---|
| **Eavesdrop / MITM** | Eve measures every qubit in a random basis and resends her guess | QBER → 25 %, fidelity → 75 % |
| **Forgery** | sign with a key that is *not* the shared key | declaration mismatch → ~75 % |
| **Replay** | resend a previously captured signature verbatim | nonce already seen (QBER stays 0) |
| **Noise / interference** | a depolarising channel (bad hardware, not an attacker) | QBER ≈ p/2, flagged as *environmental* |

### 3. Non-AI threat detector — `qsig/detector.py`
Bob runs three checks on numbers he computes himself — **no ML**:

1. **Declaration** — do Alice's declared bases/bits match `HMAC(shared_key, sha256(msg), round)`? → **forgery**
2. **Nonce freshness** — has this signature been seen before? → **replay**
3. **QBER** — measure each received qubit; the mismatch rate must stay `≤ T_reject` (default **0.11**, the BB84 bound) → **eavesdropping / noise**

The classifier then names the attack from `(QBER, fidelity, declaration-mismatch, nonce, calibrated
noise floor)` — e.g. `QBER ≈ 0.25 ∧ fidelity ≈ 0.75` is the intercept-resend fingerprint, while
`QBER ≈ noise_floor/2` is blamed on the environment, not an adversary.

## How the signature works

`sign(message, shared_key, n_rounds)`:
- `digest = SHA-256(message)`
- per round *i*: `(basis_i, bit_i) = HMAC(shared_key, digest, i)` → prepare a qubit in that Z/X state
- attach a random 128-bit **nonce** and a timestamp

`verify(...)` re-derives the same `(basis_i, bit_i)` sequence, checks the declaration and nonce,
teleport-measures every qubit, and computes `QBER = mismatches / n_rounds` and the mean fidelity
`⟨sent|received⟩²`. **Accept** iff *declaration authentic* ∧ *nonce fresh* ∧ *QBER ≤ T_reject*.

## Project layout

```
qsig/
  qubits.py       states, gates, Pauli measurement, fidelity, depolarising noise
  bell.py         |Phi+> preparation + correlated measurement
  teleport.py     exact 3-qubit teleportation (the honest channel)
  signature.py    BB84 key setup, sign(), transmit(), verify()  + 3 checks
  attacks.py      intercept-resend, forgery, replay, noise; channel composition
  detector.py     QBER threshold + attack-type classifier (pure rules)
  protocol.py     run_round(): sign -> attack channel -> verify -> classify
app.py            Streamlit dashboard
scripts/demo.py   headless scenario walkthrough
tests/            42 tests (measurement stats, teleport fidelity, every attack, determinism)
```

## What is real vs simulated

- **Real:** the linear algebra — state prep, unitaries, projective measurement, the Born rule,
  teleportation, the depolarising channel, QBER and fidelity. Results are seed-reproducible.
- **Simulated / abstracted:** qubits are ideal (no decoherence beyond the noise slider), the
  shared key is set up on a clean channel, and a replayed signature is resent verbatim. The point
  of those is to isolate each attack so the detector's response is unambiguous.

## License

MIT — see [`LICENSE`](LICENSE). Prior work on this problem statement (a classical-crypto SOC
dashboard, "Egreen Quanta") lives on the [`egreen-quanta-soc`](../../tree/egreen-quanta-soc) branch.
