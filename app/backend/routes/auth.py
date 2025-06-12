from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.backend.supabase_client import supabase
from passlib.hash import bcrypt
import jwt
import os

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(data: LoginRequest):
    """Procesa el inicio de sesión y devuelve un token JWT."""
    result = supabase.table("usuarios").select("*").eq("email", data.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    usuario = result.data[0]
    if not bcrypt.verify(data.password, usuario["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    JWT_SECRET = os.getenv("JWT_SECRET")
    token = jwt.encode(
        {"id": usuario["id"], "email": usuario["email"], "rol": usuario["rol"]},
        JWT_SECRET,
        algorithm="HS256",
    )
    return {
        "access_token": token,
        "usuario": {
            "nombre": usuario["nombre"],
            "rol": usuario["rol"],
            "email": usuario["email"],
        },
    }

