"""
----------------------------------------------------------
Archivo: utils/auth_utils.py
Descripción: Funciones utilitarias para autenticación JWT.
Última modificación: 2025-07-06
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os
import logging
from datetime import datetime, timedelta

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

JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"


def crear_token_jwt(datos: dict, expira_minutos: int = 60):
    """Crea un token JWT válido por el tiempo especificado."""
    expiracion = datetime.utcnow() + timedelta(minutes=expira_minutos)
    datos.update({"exp": expiracion})
    return jwt.encode(datos, JWT_SECRET, algorithm=ALGORITHM)


def auth_required(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Valida token JWT."""
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT_SECRET no configurado")

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Token no encontrado")

    token = credentials.credentials

    try:
        usuario = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return usuario
    except JWTError as e:
        auth_logger.error(f"Error al validar JWT: {str(e)}")
        raise HTTPException(status_code=401, detail="Token inválido o sesión expirada")


def get_current_user(usuario: dict = Depends(auth_required)):
    """Devuelve usuario autenticado."""
    return usuario
