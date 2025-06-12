from fastapi import APIRouter, HTTPException
import traceback
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
    try:
        JWT_SECRET = os.getenv("JWT_SECRET")
        if not JWT_SECRET:
            raise HTTPException(status_code=500, detail="JWT_SECRET no configurado")

        result = supabase.table("usuarios").select("*").eq("email", data.email).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        usuario = result.data[0]
        if not usuario["activo"]:
            raise HTTPException(status_code=403, detail="Usuario inactivo")

        if not bcrypt.verify(data.password, usuario["password_hash"]):
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
                "nombre": usuario["nombre"]
            }
        }
    except Exception as e:
        print("ERROR LOGIN:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/test_env")
def test_env():
    """Devuelve todas las variables de entorno."""
    try:
        return dict(os.environ)
    except Exception as e:
        print("ERROR TEST_ENV:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
