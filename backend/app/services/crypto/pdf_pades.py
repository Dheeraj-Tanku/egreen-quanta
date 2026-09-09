"""PDF (PAdES / PKCS#7) signature validation via pyHanko."""

from __future__ import annotations

import contextlib
import io
from dataclasses import dataclass, field

from app.core.logging import get_logger
from app.services.crypto.errors import MaterialParseError

log = get_logger("egreen.pdf")


@dataclass(slots=True)
class PdfSignatureReport:
    field_name: str
    intact: bool
    valid: bool
    trusted: bool
    coverage: str
    signer_subject: str | None
    signing_time: str | None
    digest_algorithm: str | None
    errors: list[str] = field(default_factory=list)


@dataclass(slots=True)
class PdfReport:
    signature_count: int
    signatures: list[PdfSignatureReport]
    errors: list[str] = field(default_factory=list)


def validate_pdf(data: bytes, *, trust_roots_pem: list[bytes] | None = None) -> PdfReport:
    """Validate every embedded signature. ``trusted`` is only meaningful when trust roots
    are supplied; otherwise it reflects pyHanko's own default (untrusted)."""
    try:
        from pyhanko.pdf_utils.reader import PdfFileReader
        from pyhanko.sign.validation import validate_pdf_signature
        from pyhanko_certvalidator import ValidationContext
    except ImportError as exc:  # pragma: no cover
        raise MaterialParseError(f"PDF validation unavailable: {exc}") from exc

    from asn1crypto import pem
    from asn1crypto import x509 as asn1_x509

    roots = []
    for blob in trust_roots_pem or []:
        try:
            der = blob
            if pem.detect(blob):
                _, _, der = pem.unarmor(blob)
            roots.append(asn1_x509.Certificate.load(der))
        except ValueError:
            continue

    vc = ValidationContext(trust_roots=roots or None, allow_fetching=False, weak_hash_algos=set())

    try:
        reader = PdfFileReader(io.BytesIO(data))
    except Exception as exc:
        raise MaterialParseError(f"Unreadable PDF: {exc}") from exc

    embedded = list(reader.embedded_signatures)
    reports: list[PdfSignatureReport] = []
    for sig in embedded:
        errors: list[str] = []
        try:
            status = validate_pdf_signature(sig, vc)
            signer_subject = None
            with contextlib.suppress(Exception):
                signer_subject = status.signing_cert.subject.human_friendly
            reported_dt = getattr(status, "signer_reported_dt", None)
            reports.append(
                PdfSignatureReport(
                    field_name=getattr(sig, "field_name", "?"),
                    intact=bool(getattr(status, "intact", False)),
                    valid=bool(getattr(status, "valid", False)),
                    trusted=bool(getattr(status, "trusted", False)),
                    coverage=str(getattr(status, "coverage", "")),
                    signer_subject=signer_subject,
                    signing_time=reported_dt.isoformat() if reported_dt is not None else None,
                    digest_algorithm=getattr(status, "md_algorithm", None),
                    errors=errors,
                )
            )
        except Exception as exc:
            reports.append(
                PdfSignatureReport(
                    field_name=getattr(sig, "field_name", "?"),
                    intact=False,
                    valid=False,
                    trusted=False,
                    coverage="",
                    signer_subject=None,
                    signing_time=None,
                    digest_algorithm=None,
                    errors=[f"validation error: {exc}"],
                )
            )

    return PdfReport(signature_count=len(embedded), signatures=reports)
