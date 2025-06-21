"""
----------------------------------------------------------
Archivo: routes/alquileres.py
Descripción: Rutas y lógica para el registro de alquileres de baños
Acceso: Privado
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-21
----------------------------------------------------------
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from datetime import date
from supabase import create_client, Client
import os

router = APIRouter()

# ==== Supabase client ====
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==== Modelo Pydantic ====

class AlquilerNuevo(BaseModel):
    """Datos necesarios para crear un alquiler."""

    numero_bano: str
    cliente: str
    direccion: str | None = None
    inicio_contrato: date
    fin_contrato: date | None = None
    observaciones: str | None = None

# ==== Endpoint POST ====

@router.post("/admin/alquileres/nuevo")
async def crear_alquiler(alquiler: AlquilerNuevo):
    """Crea un alquiler verificando que el número de baño no esté duplicado."""

    if not supabase:
        return {"error": "Supabase no configurado"}

    try:
        existente = (
            supabase.table("alquileres")
            .select("numero_bano")
            .eq("numero_bano", alquiler.numero_bano)
            .single()
            .execute()
        )
        if getattr(existente, "data", None):
            return {"error": "Ya existe un alquiler con ese número de baño"}
    except Exception as exc:  # pragma: no cover - errores de conexión
        raise HTTPException(status_code=500, detail=f"Error consultando datos: {exc}")

    datos = alquiler.model_dump()
    if datos.get("inicio_contrato"):
        datos["inicio_contrato"] = alquiler.inicio_contrato.isoformat()
    if datos.get("fin_contrato"):
        datos["fin_contrato"] = alquiler.fin_contrato.isoformat()

    try:
        supabase.table("alquileres").insert(datos).execute()
    except Exception as exc:  # pragma: no cover - errores de conexión
        raise HTTPException(status_code=500, detail=f"Error al guardar alquiler: {exc}")

    return {"ok": True}

# ==== Endpoint GET ====

@router.get("/admin/api/alquileres")
async def listar_alquileres():
    try:
        result = supabase.table("alquileres").select("*").execute()
        if result.error:
            raise Exception(result.error.message)
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar alquileres: {e}")
