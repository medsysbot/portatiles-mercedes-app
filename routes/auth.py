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

@router.post("/login")
def login(data: LoginInput):
    login_logger.info(f"Intento de login - email: {data.email}")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    res = supabase.table("usuarios").select("*").eq("email", data.email).execute()
    if not res.data:
        login_logger.info(f"Login fallido - usuario no encontrado: {data.email}")
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    usuario = res.data[0]
    if not bcrypt.verify(data.password, usuario.get("password_hash", "")):
        login_logger.info(f"Login fallido - contraseña incorrecta: {data.email}")
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    payload = {
        "sub": usuario["id"],
        "email": usuario["email"],
        "rol": usuario.get("rol"),
        "nombre": usuario.get("nombre"),
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXP_MINUTES),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

    login_logger.info(f"Login exitoso - email: {data.email}")

    return {
        "access_token": token,
        "rol": usuario.get("rol"),
        "nombre": usuario.get("nombre"),
    }

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


