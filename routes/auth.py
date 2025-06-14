from fastapi import APIRouter, HTTPException, Form
from pydantic import BaseModel
from passlib.hash import bcrypt
from supabase import create_client
from jose import jwt, JWTError
from datetime import datetime, timedelta
import logging
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET", "clave_secreta")
JWT_EXP_MINUTES = 60

supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
router = APIRouter()
login_logger = logging.getLogger("login_events")

class LoginInput(BaseModel):
    email: str
    password: str


@router.post("/verificar_token")
def verificar_token(data: dict):
    token = data.get("token")

    if not token:
        raise HTTPException(status_code=401, detail="Token faltante")

    try:
        datos = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {
            "status": "ok",
            "rol": datos.get("rol"),
            "user_id": datos.get("sub"),
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.post("/registrar_cliente")
def registrar_cliente(email: str = Form(...), password: str = Form(...)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    hash_pwd = bcrypt.hash(password)
    resp = supabase.table("usuarios").insert({
        "email": email,
        "password_hash": hash_pwd,
        "rol": "cliente",
    }).execute()
    if resp.error:
        raise HTTPException(status_code=400, detail=str(resp.error))
    return {"mensaje": "Registro exitoso"}


