"""
----------------------------------------------------------
Archivo: routes/alquileres.py
Descripción: Rutas y lógica para el registro de alquileres de baños
Acceso: Privado
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-15
----------------------------------------------------------
"""
"""Rutas y lógica para el registro de alquileres de baños."""

from datetime import date
import os

from fastapi import APIRouter, HTTPException, Depends
from utils.auth_utils import auth_required
from pydantic import BaseModel
from supabase import create_client, Client

# ==== Configuración de Supabase ====
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
# ==== Modelo de datos ====

class Alquiler(BaseModel):
    """Modelo de validación para registrar un alquiler de baño."""

    cliente_nombre: str
    dni: str
    direccion_entrega: str
    tipo_banio: str
    fecha_inicio: date
    fecha_fin: date
    observaciones: str | None = None
# ==== Endpoints ====

@router.post("/registrar_alquiler")
async def registrar_alquiler(alquiler: Alquiler, user: dict = Depends(auth_required)):
    """Guarda un nuevo alquiler en la tabla de Supabase."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    if user.get("rol") != "Administrador":
# ==== Lógica de guardado ====
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        # Convertir los datos recibidos en un diccionario
        datos = alquiler.model_dump()
        # Insertar el registro en la tabla 'alquileres'
        respuesta = supabase.table("alquileres").insert(datos).execute()
        if (
            not respuesta.data
            or (hasattr(respuesta, "status_code") and respuesta.status_code != 200)
            or getattr(respuesta, "error", None) is not None
        ):
            raise HTTPException(
                status_code=400,
                detail=str(getattr(respuesta, "error", "Error en Supabase")),
            )
        return {"mensaje": "Alquiler registrado con éxito"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
