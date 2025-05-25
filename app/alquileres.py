"""Rutas y lógica para el registro de alquileres de baños."""

from datetime import date
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, constr
from supabase import create_client, Client

# Configurar la conexión con Supabase usando variables de entorno
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL y SUPABASE_KEY deben estar configurados")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()

class Alquiler(BaseModel):
    """Modelo de validación para un alquiler."""

    cliente_nombre: constr(strip_whitespace=True, min_length=1)
    cliente_email: EmailStr
    tipo_banio: constr(strip_whitespace=True)
    ubicacion: constr(strip_whitespace=True)
    fecha_inicio: date
    fecha_fin: date
    observaciones: str | None = None

@router.post("/registrar_alquiler")
async def registrar_alquiler(alquiler: Alquiler):
    """Guarda un nuevo alquiler en la tabla de Supabase."""
    try:
        datos = alquiler.model_dump()
        respuesta = supabase.table("alquileres").insert(datos).execute()
        if respuesta.error:
            raise HTTPException(status_code=400, detail=str(respuesta.error))
        return {"mensaje": "Alquiler registrado con éxito"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
