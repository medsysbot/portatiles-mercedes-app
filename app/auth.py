"""Rutas de autenticación y manejo de sesiones."""

import os

from fastapi import APIRouter, Form, HTTPException
from itsdangerous import URLSafeSerializer, BadSignature
from supabase import create_client, Client

# Configurar Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(
        "Advertencia: SUPABASE_URL y SUPABASE_KEY no estan configurados. "
        "La conexión a Supabase estará deshabilitada."
    )
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configurar el serializer para los tokens
SECRET_KEY = os.getenv("SECRET_KEY", "portatiles-secret")
serializer = URLSafeSerializer(SECRET_KEY)

router = APIRouter()


@router.post("/login")
async def login(
    email: str = Form(...),
    password: str = Form(...),
    rol: str = Form(...),
):
    """Valida usuario y retorna un token de sesión."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        resp = (
            supabase.table("usuarios")
            .select("id,email,password,rol")
            .eq("email", email)
            .eq("rol", rol)
            .single()
            .execute()
        )
        if not resp.data or resp.data.get("password") != password:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        token = serializer.dumps({"user_id": resp.data["id"], "rol": rol})
        return {"token": token}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/verificar_token")
async def verificar_token(token: str = Form(...)):
    """Comprueba que el token sea válido y devuelve su información."""
    try:
        datos = serializer.loads(token)
        return {"valido": True, "rol": datos.get("rol"), "user_id": datos.get("user_id")}
    except BadSignature:
        raise HTTPException(status_code=401, detail="Token inválido")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/registrar_cliente")
async def registrar_cliente(
    email: str = Form(...),
    password: str = Form(...),
):
    """Crea una cuenta de cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        resp = (
            supabase.table("usuarios")
            .insert({"email": email, "password": password, "rol": "cliente"})
            .execute()
        )
        if resp.error:
            raise HTTPException(status_code=400, detail=str(resp.error))
        return {"mensaje": "Registro exitoso"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
