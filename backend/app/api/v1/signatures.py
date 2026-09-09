"""Signature verification routes (Module 2)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.deps import CurrentUser, SessionDep
from app.core.config import settings
from app.core.exceptions import ValidationAppError
from app.core.rate_limit import VERIFY_LIMIT, rate_limit
from app.schemas.crypto import RawVerifyRequest, VerificationOut
from app.services.crypto import engine

router = APIRouter(prefix="/signatures", tags=["signatures"])

_VerifyRate = Depends(rate_limit("verify", VERIFY_LIMIT))


@router.post("/verify", response_model=VerificationOut, dependencies=[_VerifyRate])
async def verify_signature(
    payload: RawVerifyRequest,
    session: SessionDep,
    _: CurrentUser,
) -> VerificationOut:
    if not payload.certificate_pem and not payload.public_key_pem:
        raise ValidationAppError("Provide certificate_pem or public_key_pem")
    result = await engine.verify_raw_signature(
        session,
        data_b64=payload.data_b64,
        signature_b64=payload.signature_b64,
        hash_alg=payload.hash_alg,
        padding=payload.padding,
        certificate_pem=payload.certificate_pem,
        public_key_pem=payload.public_key_pem,
        is_prehashed=payload.is_prehashed,
        verify_time=payload.verify_time,
    )
    return VerificationOut.model_validate(result.as_dict())


@router.post("/verify-document", response_model=VerificationOut, dependencies=[_VerifyRate])
async def verify_document(
    session: SessionDep,
    _: CurrentUser,
    file: Annotated[UploadFile, File(description="Signed PDF, CMS/PKCS#7, or compact JWS")],
    detached_content: Annotated[
        UploadFile | None, File(description="Original content for a detached CMS signature")
    ] = None,
    filename: Annotated[str | None, Form()] = None,
) -> VerificationOut:
    max_bytes = settings.max_upload_mb * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise ValidationAppError(f"File exceeds the {settings.max_upload_mb} MB limit")

    external = None
    if detached_content is not None:
        external = await detached_content.read()
        if len(external) > max_bytes:
            raise ValidationAppError("Detached content exceeds the size limit")

    result = await engine.verify_document(
        session,
        filename=filename or file.filename or "upload.bin",
        content=content,
        external_content=external,
    )
    return VerificationOut.model_validate(result.as_dict())
