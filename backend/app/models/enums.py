"""Enumerations shared across models and schemas."""

from __future__ import annotations

from enum import StrEnum


class UserRole(StrEnum):
    ADMIN = "admin"
    ANALYST = "analyst"
    AUDITOR = "auditor"
    VIEWER = "viewer"

    @property
    def rank(self) -> int:
        return _ROLE_RANK[self]


# Higher rank ⇒ strictly more capability. Used for "at least this role" checks.
_ROLE_RANK: dict[UserRole, int] = {
    UserRole.VIEWER: 0,
    UserRole.AUDITOR: 1,
    UserRole.ANALYST: 2,
    UserRole.ADMIN: 3,
}


class ApiKeyScope(StrEnum):
    INGEST_EVENTS = "ingest:events"
    INGEST_SIGNATURES = "ingest:signatures"
