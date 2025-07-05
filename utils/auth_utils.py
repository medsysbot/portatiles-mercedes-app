"""
----------------------------------------------------------
Archivo: utils/auth_utils.py
Descripción: Funciones utilitarias de autenticación
Última modificación: 2025-06-15
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os
import logging
import traceback

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
AUTH_LOG_FILE = os.path.join(LOG_DIR, "autenticacion.log")

auth_logger = logging.getLogger("autenticacion")
auth_logger.setLevel(logging.ERROR)
if not auth_logger.handlers:
    handler = logging.FileHandler(AUTH_LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    auth_logger.addHandler(handler)
    auth_logger.propagate = False

security = HTTPBearer(auto_error=False)


def auth_required(
    request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Valida el token JWT presente en la cabecera Authorization o la cookie."""
    JWT_SECRET = os.getenv("JWT_SECRET")
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT_SECRET no configurado")

    token = None
    if credentials is not None and credentials.scheme.lower() == "bearer":
        token = credentials.credentials

    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Token faltante")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception as exc:
        auth_logger.error("Error en auth_required: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=401, detail="Token inválido o expirado")


def verificar_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Obtiene el token desde la cookie ``access_token`` o la cabecera Authorization."""

    JWT_SECRET = os.getenv("JWT_SECRET")
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT_SECRET no configurado")

    token = request.cookies.get("access_token")

    if credentials is not None and credentials.scheme.lower() == "bearer":
        token = credentials.credentials

    if not token:
        raise HTTPException(status_code=401, detail="Token faltante")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if not isinstance(payload, dict):
            raise JWTError("Payload malformado")
        return {"nombre": payload.get("nombre"), "rol": payload.get("rol")}
    except JWTError as exc:
        auth_logger.error("Token inválido: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    except Exception as exc:
        auth_logger.error(
            "Error inesperado en verificar_token: %s\n%s", exc, traceback.format_exc()
        )
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

# ...última línea de verificar_token...

def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
    JWT_SECRET = os.getenv("JWT_SECRET")
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT_SECRET no configurado")

    token = None
    if credentials is not None and credentials.scheme.lower() == "bearer":
        token = credentials.credentials

    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Token faltante")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if not payload.get("dni_quit_quill"):
            raise HTTPException(status_code=400, detail="Falta DNI/CUIT/CUIL en token")
        return payload
    except Exception as exc:
        auth_logger.error("Error en get_current_user: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
