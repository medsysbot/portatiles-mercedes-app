"""
----------------------------------------------------------
Archivo: routes/login.py
Descripción: Endpoint completo para autenticación del usuario.
Última modificación: 2025-07-06
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.auth_utils import crear_token_jwt
from utils.supabase_client import supabase
import logging

router = APIRouter()

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "login.log")

login_logger = logging.getLogger("login")
login_logger.setLevel(logging.INFO)

if not login_logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    login_logger.addHandler(handler)
    login_logger.propagate = False


class Credenciales(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(credenciales: Credenciales):
    """Autentica usuario y devuelve JWT."""
    usuario = supabase.auth.sign_in_with_password({
        "email": credenciales.email,
        "password": credenciales.password
    })

    if not usuario or "session" not in usuario:
        login_logger.warning(f"Intento fallido de inicio de sesión: {credenciales.email}")
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = crear_token_jwt({"email": credenciales.email})

    login_logger.info(f"Usuario autenticado correctamente: {credenciales.email}")

    return {"token": token}
