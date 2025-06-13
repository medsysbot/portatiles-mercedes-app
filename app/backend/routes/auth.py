from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.backend.supabase_client import supabase
from passlib.hash import bcrypt
import jwt
import logging
import os

router = APIRouter()
login_logger = logging.getLogger("login_events")


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(data: LoginRequest):
    """Procesa el inicio de sesión y devuelve un token JWT."""
    login_logger.info(f"Intento de login - email: {data.email}")
    result = supabase.table("usuarios").select("*").eq("email", data.email).execute()
    if not result.data:
        login_logger.info(f"Login fallido - usuario no encontrado: {data.email}")
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    usuario = result.data[0]
    if not bcrypt.verify(data.password, usuario["password_hash"]):
        login_logger.info(f"Login fallido - contraseña incorrecta: {data.email}")
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    JWT_SECRET = os.getenv("JWT_SECRET")
    token = jwt.encode(
        {"id": usuario["id"], "email": usuario["email"], "rol": usuario["rol"]},
        JWT_SECRET,
        algorithm="HS256",
    )
    login_logger.info(f"Login exitoso - email: {data.email}")
    return {
        "access_token": token,
        "usuario": {
            "nombre": usuario["nombre"],
            "rol": usuario["rol"],
            "email": usuario["email"],
        },
    }

