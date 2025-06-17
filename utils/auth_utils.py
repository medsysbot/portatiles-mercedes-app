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

security = HTTPBearer(auto_error=False)


def auth_required(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Valida el token JWT presente en la cabecera Authorization."""
    JWT_SECRET = os.getenv("JWT_SECRET")
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT_SECRET no configurado")

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Token faltante")

    token = credentials.credentials

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception:
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
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
