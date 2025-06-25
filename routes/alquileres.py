"""
----------------------------------------------------------
Archivo: routes/alquileres.py
Descripción: Rutas y lógica para el registro de alquileres de baños
Acceso: Privado
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-23
----------------------------------------------------------
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, ValidationError
from datetime import date
from supabase import create_client, Client
from postgrest.exceptions import APIError
import logging
import os

router = APIRouter()

# ==== Supabase client ====
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "alquileres.log")
logger = logging.getLogger("alquileres")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

# Nombre exacto de la tabla utilizada en Supabase
ALQUILERES_TABLE = "alquileres"

# ==== Modelo Pydantic ====


class AlquilerNuevo(BaseModel):
    """Datos necesarios para crear un alquiler."""

    numero_bano: str
    cliente_nombre: str
    dni_cuit_cuil: str
    direccion: str | None = None
    fecha_inicio: date
    fecha_fin: date | None = None
    observaciones: str | None = None


# ==== Endpoint POST ====


@router.post("/admin/alquileres/nuevo")
async def crear_alquiler(request: Request):
    """Crea un alquiler verificando que el número de baño no esté duplicado."""

    if not supabase:
        return {"error": "Supabase no configurado"}

    if request.headers.get("content-type", "").startswith("application/json"):
        datos = await request.json()
    else:
        form = await request.form()
        datos = dict(form)

    try:
        alquiler = AlquilerNuevo(**datos)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        existente = (
            supabase.table(ALQUILERES_TABLE)
            .select("numero_bano")
            .eq("numero_bano", alquiler.numero_bano)
            .maybe_single()
            .execute()
        )
    except APIError as exc:
        if exc.code == "204":
            existente = None
        else:  # pragma: no cover - otros errores de conexión
            raise HTTPException(status_code=500, detail=f"Error consultando datos: {exc}")
    except Exception as exc:  # pragma: no cover - errores de conexión
        raise HTTPException(status_code=500, detail=f"Error consultando datos: {exc}")

    if getattr(existente, "data", None):
        return {"error": "Ya existe un alquiler con ese número de baño"}

    datos = alquiler.model_dump()
    if datos.get("fecha_inicio"):
        datos["fecha_inicio"] = alquiler.fecha_inicio.isoformat()
    if datos.get("fecha_fin"):
        datos["fecha_fin"] = alquiler.fecha_fin.isoformat()

    try:
        resp = supabase.table(ALQUILERES_TABLE).insert(datos).execute()
        if getattr(resp, "error", None):
            raise Exception(resp.error.message)
    except Exception as exc:  # pragma: no cover - errores de conexión
        return {"error": f"Error al guardar alquiler: {exc}"}

    if request.headers.get("content-type", "").startswith("application/json"):
        return {"ok": True}
    return RedirectResponse("/admin/alquileres", status_code=303)


# ==== Endpoint GET ====


@router.get("/admin/api/alquileres")
async def listar_alquileres():
    if not supabase:
        logger.warning("Supabase no configurado")
        return []

    try:
        result = supabase.table(ALQUILERES_TABLE).select("*").execute()
    except Exception as exc:  # pragma: no cover - posibles fallos de conexión
        logger.exception("Error de conexión al listar alquileres:")
        raise HTTPException(status_code=500, detail=f"Error de conexión: {exc}")

    if getattr(result, "error", None):
        logger.error("Error en consulta de alquileres: %s", result.error)
        raise HTTPException(status_code=500, detail=f"Error en consulta: {result.error.message}")

    data = getattr(result, "data", None)
    if not data:
        logger.warning("Consulta de alquileres sin datos")
        return []

    # Reemplazar caracteres inválidos para evitar errores de codificación
    for registro in data:
        for key, value in registro.items():
            if isinstance(value, str):
                registro[key] = value.encode("utf-8", "replace").decode("utf-8")

    # Unificar nombres de campos para el frontend
    normalizados = []
    for item in data:
        normalizados.append(
            {
                "numero_bano": item.get("numero_bano"),
                "cliente_nombre": item.get("cliente_nombre") or item.get("cliente"),
                "dni_cuit_cuil": item.get("dni_cuit_cuil"),
                "direccion": item.get("direccion"),
                "fecha_inicio": item.get("fecha_inicio")
                or item.get("inicio_contrato"),
                "fecha_fin": item.get("fecha_fin") or item.get("fin_contrato"),
                "observaciones": item.get("observaciones"),
            }
        )

    return normalizados


class _IdLista(BaseModel):
    ids: list[str]


@router.post("/admin/api/alquileres/eliminar")
async def eliminar_alquileres(payload: _IdLista):
    """Elimina alquileres por número de baño."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        supabase.table(ALQUILERES_TABLE).delete().in_("numero_bano", payload.ids).execute()
    except Exception as exc:  # pragma: no cover - fallos de conexión
        logger.exception("Error eliminando alquileres:")
        raise HTTPException(status_code=500, detail=str(exc))
    return {"ok": True}

