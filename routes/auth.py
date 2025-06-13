from fastapi import APIRouter, HTTPException, Form, Header
from pydantic import BaseModel
from passlib.hash import bcrypt
from supabase import create_client
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET", "clave_secreta")
JWT_EXP_MINUTES = 60

supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
router = APIRouter()

class LoginInput(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(data: LoginInput):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    res = supabase.table("usuarios").select("*").eq("email", data.email).execute()
    if not res.data:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    usuario = res.data[0]
    if not bcrypt.verify(data.password, usuario.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    payload = {
        "sub": usuario["id"],
        "email": usuario["email"],
        "rol": usuario.get("rol"),
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXP_MINUTES),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

    return {
        "access_token": token,
        "usuario": {
            "nombre": usuario.get("nombre"),
            "rol": usuario.get("rol"),
            "email": usuario.get("email"),
        },
    }

@router.post("/verificar_token")
def verificar_token(Authorization: str | None = Header(None)):
    if not Authorization or not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token faltante")
    token = Authorization.split(" ", 1)[1]
    try:
        datos = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {"valido": True, "rol": datos.get("rol"), "user_id": datos.get("sub")}
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


