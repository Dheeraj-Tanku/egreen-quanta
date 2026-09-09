# Egreen Quanta

**Quantum-Inspired Cyber Threat Detection for Digital Signature Security**
SIH 2026 · Problem Statement 141 · Blockchain & Cybersecurity

A Security Operations Center (SOC) platform for **digital-signature and PKI trust**. It verifies
RSA / ECC / EdDSA signatures and X.509 chains (PAdES, CMS/PKCS#7, JWS), detects signature-security
threats with a rule engine plus optional local ML, and uses a **quantum-inspired optimisation
subsystem** for quantum-risk scoring, detection tuning, and threat correlation — all presented in
a modern dark SOC dashboard with a tamper-evident audit log.

> Full design: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## Stack

| | |
|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind · TanStack Query · Recharts |
| Backend | Python 3.12 · FastAPI · SQLAlchemy 2 (async) · Alembic · Pydantic v2 |
| Crypto | `cryptography` · pyHanko · `asn1crypto` |
| Quantum-inspired | NumPy (simulated annealing / simulated quantum annealing over QUBO) |
| ML (optional) | scikit-learn — IsolationForest / One-Class SVM, off by default |
| Data | PostgreSQL 16 (prod) · SQLite (dev) |
| Infra | Docker + Compose · Nginx · Redis + Celery (prod) · GitHub Actions |

## Modules

| # | Module | Status |
|---|---|---|
| 0 | Foundation & scaffolding | ✅ done — backend + frontend build, lint, typecheck, test green |
| 1 | Identity & access (Argon2id, JWT, RBAC, TOTP) | ✅ done — 25 backend tests, 4 frontend tests, live auth flow verified |
| 2 | Cryptographic core (RSA/ECC, X.509, CRL/OCSP, PAdES/CMS/JWS) | ✅ done — 65 backend tests, verify + trust-store + certificate UI, demo PKI generated |
| 3 | Threat detection engine (19 rules + correlation + scoring) | ✅ done — 83 backend tests, event/alert/incident model, risk scoring, greedy correlation, alert feed + incident kanban + rules config UI, live SOC dashboard |
| 4 | Quantum-inspired optimisation (risk scoring · tuning · correlation) | ✅ done — 104 backend tests; NumPy SA + SQA over QUBO (brute-force-verified), Quantum Exposure Score + PQC migration planner, detection-weight tuning, correlation QUBO, Quantum Lab UI, [docs/QUANTUM.md](docs/QUANTUM.md) |
| 5 | ML anomaly detection (local, optional) | 🔜 in progress |
| 6 | Audit logging (hash-chained, verifiable) | ⬜ |
| 7 | SOC dashboard consolidation | ⬜ |
| 8 | Real-time & integrations (SSE, jobs, ingest API) | ⬜ |
| 9 | Hardening, tests, deployment | ⬜ |

## Quick start

### Dev (Python + Node only — no Docker needed)

```bash
make dev
```

Runs the FastAPI backend on SQLite (`backend/var/dev.db`) at `http://localhost:8000` and the Vite
dev server at `http://localhost:5173`. API docs at `http://localhost:8000/docs`.

Seed demo data (users, trust anchors, sample events):

```bash
make seed
```

Demo accounts (dev/test only — all share one fixed password):

| email | password | role |
|---|---|---|
| `admin@egreen.local` | `EgreenQuanta!2026` | admin |
| `analyst@egreen.local` | `EgreenQuanta!2026` | analyst |
| `auditor@egreen.local` | `EgreenQuanta!2026` | auditor |
| `viewer@egreen.local` | `EgreenQuanta!2026` | viewer |

In production (`APP_ENV=prod`) the seeder generates a strong random password per account and
prints it once. Change `SECRET_KEY` and all passwords before any real use.

### Full stack (Docker)

```bash
cp .env.example .env      # then edit secrets
docker compose up --build
```

Frontend on `http://localhost:8080` (Nginx), API proxied at `/api`. Production-hardened stack
(Redis, Celery, TLS) via `docker compose -f docker-compose.prod.yml up -d`.

## Repository layout

```
backend/app/{core,db,models,schemas,api,services,workers,seeds}   # service-layered
frontend/src/{lib,components,features,hooks,types,styles}          # feature-foldered
datasets/    # demo CA, signed docs, labelled events
scripts/     # gen_test_pki.py, gen_sample_signatures.py, load_test.py
docs/        # ARCHITECTURE.md, API.md, QUANTUM.md, THREAT_MODEL.md, adr/
```

## Testing

```bash
make test        # backend pytest + frontend vitest
make test-e2e    # Playwright smoke flow
make lint        # ruff + mypy + eslint + tsc
```

## Security

See [`docs/ARCHITECTURE.md` §6](docs/ARCHITECTURE.md#6-security-architecture). Highlights: Argon2id,
rotating refresh tokens with reuse detection, RBAC, strict security headers, `slowapi` rate limits,
SSRF-guarded revocation fetches, tamper-evident audit log, non-root containers, secrets via env /
Docker secrets. **Change every secret in `.env.example` before deploying.**

## License

MIT — see [`LICENSE`](LICENSE).
