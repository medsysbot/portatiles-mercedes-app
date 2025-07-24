"""
----------------------------------------------------------
Archivo: routes/email_publico.py
Descripción: Endpoint público para envío de emails desde formularios
Acceso: Público
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from __future__ import annotations

import os
import time

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr

from utils.email_sender import enviar_email

router = APIRouter()

# === Configuración de rate limit simple ===
_RATE_LIMIT: dict[str, list[float]] = {}
_WINDOW = 60  # segundos
_MAX_REQ = 5

def _limite_superado(ip: str) -> bool:
    ahora = time.time()
    registros = [t for t in _RATE_LIMIT.get(ip, []) if ahora - t < _WINDOW]
    if len(registros) >= _MAX_REQ:
        _RATE_LIMIT[ip] = registros
        return True
    registros.append(ahora)
    _RATE_LIMIT[ip] = registros
    return False


class FormEmail(BaseModel):
    nombre: str
    email: EmailStr
    asunto: str
    mensaje: str


@router.post("/api/public/email")
async def enviar_email_publico(datos: FormEmail, request: Request):
    """Recibe datos de un formulario público y los reenvía por email."""
    ip = request.client.host if request.client else "anon"
    if _limite_superado(ip):
        raise HTTPException(status_code=429, detail="Demasiadas solicitudes")

    destino = os.getenv("EMAIL_ORIGEN")
    if not destino:
        raise HTTPException(status_code=500, detail="Email de destino no configurado")

    cuerpo = (
        f"Nombre: {datos.nombre}\n"
        f"Email: {datos.email}\n"
        f"Asunto: {datos.asunto}\n"
        f"Mensaje:\n{datos.mensaje}"
    )
    try:
        await enviar_email(destino, "Formulario público", cuerpo)
    except Exception as exc:  # pragma: no cover - dependencias externas
        raise HTTPException(status_code=500, detail=f"Error enviando email: {exc}")

    return {"ok": True}
