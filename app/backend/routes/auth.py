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
    JWT_SECRET = os.getenv("JWT_SECRET")
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT_SECRET no configurado")

    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    result = supabase.table("usuarios").select("*").eq("email", data.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    usuario = result.data[0]
    if not usuario.get("activo", True):
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    if not bcrypt.verify(data.password, usuario.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = jwt.encode({
        "id": usuario["id"],
        "email": usuario["email"],
        "rol": usuario["rol"]
    }, JWT_SECRET, algorithm="HS256")

    return {
        "token": token,
        "usuario": {
            "id": usuario["id"],
            "email": usuario["email"],
            "rol": usuario["rol"],
            "nombre": usuario.get("nombre")
        }
    }
