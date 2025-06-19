"""
----------------------------------------------------------
Archivo: routes/datos_personales.py
Descripción: Operaciones CRUD para datos personales de clientes
Última modificación: 2025-06-19
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from fastapi import APIRouter, HTTPException, Form
from supabase import create_client, Client
import os

# Reutilizamos la misma conexión que en routes/login.py
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase no configurado")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()

@router.post("/registrar_datos_cliente")
def registrar_datos_cliente(
    nombre: str = Form(...),
    apellido: str = Form(...),
    dni: str = Form(...),
    direccion: str = Form(...),
    telefono: str = Form(...),
    cuit: str = Form(...),
    razon_social: str = Form(...),
    email: str = Form(...),
):
    """Registra datos personales de un cliente."""

    datos_insert = {
        "nombre": nombre,
        "apellido": apellido,
        "dni": dni,
        "direccion": direccion,
        "telefono": telefono,
        "cuit": cuit,
        "razon_social": razon_social,
        "email": email,
    }

    for campo, valor in datos_insert.items():
        if not valor:
            raise HTTPException(status_code=400, detail=f"Campo '{campo}' faltante")

    if supabase:
        existe = (
            supabase.table("datos_personales_clientes")
            .select("dni")
            .eq("dni", dni)
            .execute()
        )
        if getattr(existe, "data", []):
            raise HTTPException(status_code=400, detail="El DNI ya está registrado")
        try:
            resp = supabase.table("datos_personales_clientes").insert(datos_insert).execute()
        except Exception as e:  # pragma: no cover - debug supabase errors
            raise HTTPException(status_code=500, detail=str(e))

        if not resp.data or getattr(resp, "error", None) is not None:
            raise HTTPException(
                status_code=400,
                detail=str(getattr(resp, "error", "Error en Supabase")),
            )

    return {"mensaje": "Registro exitoso"}


@router.get("/datos_cliente")
def obtener_datos_cliente(dni: str):
    """Devuelve los datos personales del cliente por DNI."""
    if supabase:
        resp = (
            supabase.table("datos_personales_clientes")
            .select("*")
            .eq("dni", dni)
            .single()
            .execute()
        )
        if getattr(resp, "data", None):
            return resp.data
        raise HTTPException(status_code=404, detail="Datos no encontrados")
    return {}
