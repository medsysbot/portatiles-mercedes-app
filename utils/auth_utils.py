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
import jwt
import os

security = HTTPBearer()


def auth_required(credentials: HTTPAuthorizationCredentials = Depends(security)):
    JWT_SECRET = os.getenv("JWT_SECRET")
    token = credentials.credentials if credentials else None

    if not token or not JWT_SECRET:
        raise HTTPException(status_code=401, detail="Token no enviado o configuración incompleta")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
