"""Aggregate router for API v1. Each build module registers its sub-router here."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
    api_keys,
    auth,
    certificates,
    signatures,
    system,
    trust_store,
    users,
)

api_router = APIRouter()
api_router.include_router(system.router, tags=["system"])

# M1 — Identity & access
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(api_keys.router)

# M2 — Cryptographic core
api_router.include_router(signatures.router)
api_router.include_router(certificates.router)
api_router.include_router(trust_store.router)

# Registered as modules land:
#   detections, threats             (M3)
#   quantum                         (M4)
#   ml                              (M5)
#   audit                           (M6)
#   ingest, stream                  (M8)
