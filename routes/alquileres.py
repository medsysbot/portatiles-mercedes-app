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

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

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
async def registrar_alquiler(alquiler: Alquiler):
    """Guarda un nuevo alquiler."""

    try:
        alquiler.model_dump()  # Validación del modelo
        return {"mensaje": "Alquiler registrado"}
    except Exception as exc:  # pragma: no cover - manejo genérico
        raise HTTPException(status_code=500, detail=str(exc))
