"""SQLAlchemy models.

Importing this package imports every model module so that ``Base.metadata`` is fully
populated for Alembic autogenerate. Model modules are appended here as each build module lands.
"""

from __future__ import annotations

from app.db.base import Base

# Module 1 — Identity & access
from app.models.api_key import ApiKey
from app.models.certificate import Certificate
from app.models.enums import ApiKeyScope, UserRole
from app.models.login_attempt import LoginAttempt
from app.models.refresh_token import RefreshToken
from app.models.trust_anchor import CaAllowlistEntry, TrustAnchor
from app.models.user import User

__all__ = [
    "ApiKey",
    "ApiKeyScope",
    "Base",
    "CaAllowlistEntry",
    "Certificate",
    "LoginAttempt",
    "RefreshToken",
    "TrustAnchor",
    "User",
    "UserRole",
]
