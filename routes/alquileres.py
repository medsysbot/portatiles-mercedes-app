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
from supabase import create_client
import os

router = APIRouter()

# ==== Supabase client ====
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==== Modelo Pydantic ====

class AlquilerNuevo(BaseModel):
    numero_bano: str
    cliente: str
    direccion: str
    inicio_contrato: date
    fin_contrato: date
    observaciones: str | None = None

# ==== Endpoint POST ====

@router.post("/admin/alquileres/nuevo")
async def crear_alquiler(alquiler: AlquilerNuevo):
    try:
        data = alquiler.dict()
        result = supabase.table("alquileres").insert(data).execute()
        if result.error:
            raise Exception(result.error.message)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar alquiler: {e}")

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
