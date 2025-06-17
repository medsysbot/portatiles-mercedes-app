"""
----------------------------------------------------------
Archivo: utils/auth_utils.py
Descripción: Funciones utilitarias de autenticación
Última modificación: 2025-06-15
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from fastapi import HTTPException, Depends
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


def verificar_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Alias de ``auth_required`` para usar como dependencia."""
    return auth_required(credentials)
