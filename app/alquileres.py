"""Rutas y lógica para el registro de alquileres de baños."""

from datetime import date
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, constr
from supabase import create_client, Client

# Configurar la conexión con Supabase usando variables de entorno
SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    print(
        "Advertencia: SUPABASE_URL y SERVICE_ROLE_KEY no estan configurados. "
        "La conexión a Supabase estará deshabilitada."
    )
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# Crear un router específico para este módulo
router = APIRouter()

class Alquiler(BaseModel):
    """Modelo de validación para registrar un alquiler de baño."""

    cliente_nombre: constr(strip_whitespace=True, min_length=1)
    dni: constr(strip_whitespace=True, min_length=1)
    direccion_entrega: constr(strip_whitespace=True, min_length=1)
    tipo_banio: constr(strip_whitespace=True, min_length=1)
    fecha_inicio: date
    fecha_fin: date
    observaciones: str | None = None

@router.post("/registrar_alquiler")
async def registrar_alquiler(alquiler: Alquiler):
    """Guarda un nuevo alquiler en la tabla de Supabase."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        # Convertir los datos recibidos en un diccionario
        datos = alquiler.model_dump()
        # Insertar el registro en la tabla 'alquileres'
        respuesta = supabase.table("alquileres").insert(datos).execute()
        if respuesta.error:
            raise HTTPException(status_code=400, detail=str(respuesta.error))
        return {"mensaje": "Alquiler registrado con éxito"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
