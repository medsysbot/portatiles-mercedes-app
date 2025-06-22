"""
----------------------------------------------------------
Archivo: routes/reportes.py
Descripción: Módulo de reportes
Acceso: Privado
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from datetime import date
import logging
import os

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, ValidationError
from supabase import create_client, Client

router = APIRouter()

# ==== Supabase ====
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "reportes.log")
logger = logging.getLogger("reportes")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

TEMPLATES = Jinja2Templates(directory="templates")
TABLA = "reportes"


class ReporteNuevo(BaseModel):
    fecha: date
    nombre_persona: str
    asunto: str
    contenido: str


@router.get("/admin/reportes/nuevo", response_class=HTMLResponse)
async def form_nuevo_reporte(request: Request):
    """Muestra el formulario para crear un reporte."""
    return TEMPLATES.TemplateResponse("reporte_form.html", {"request": request})


@router.post("/admin/reportes/nuevo")
async def crear_reporte(request: Request):
    """Crea un nuevo reporte en la tabla de Supabase."""
    if not supabase:
        logger.error("Supabase no configurado al crear reporte")
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    if request.headers.get("content-type", "").startswith("application/json"):
        datos_req = await request.json()
    else:
        form = await request.form()
        datos_req = dict(form)

    try:
        reporte = ReporteNuevo(**datos_req)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    datos = reporte.model_dump()
    datos["fecha"] = reporte.fecha.isoformat()

    try:
        res = supabase.table(TABLA).insert(datos).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
    except Exception as exc:  # pragma: no cover
        logger.exception("Error al guardar reporte:")
        return {"error": f"Error al guardar reporte: {exc}"}

    if request.headers.get("content-type", "").startswith("application/json"):
        return {"ok": True}
    return RedirectResponse("/admin/reportes", status_code=303)


@router.get("/admin/api/reportes")
async def listar_reportes():
    """Devuelve la lista completa de reportes."""
    if not supabase:
        logger.warning("Supabase no configurado al listar reportes")
        return []

    try:
        resultado = supabase.table(TABLA).select("*").execute()
    except Exception as exc:  # pragma: no cover - posibles fallos de conexión
        logger.exception("Error de conexión al listar reportes:")
        raise HTTPException(status_code=500, detail=f"Error de conexión: {exc}")

    if getattr(resultado, "error", None):
        logger.error("Error en consulta de reportes: %s", resultado.error)
        raise HTTPException(
            status_code=500, detail=f"Error en consulta: {resultado.error.message}"
        )

    data = getattr(resultado, "data", None)
    if not data:
        logger.warning("Consulta de reportes sin datos")
        return []

    for registro in data:
        for key, val in registro.items():
            if isinstance(val, str):
                registro[key] = val.encode("utf-8", "replace").decode("utf-8")

    normalizados = []
    for item in data:
        normalizados.append(
            {
                "id_reporte": item.get("id_reporte") or item.get("id"),
                "fecha": item.get("fecha"),
                "nombre_persona": item.get("nombre_persona") or item.get("nombre"),
                "asunto": item.get("asunto"),
                "contenido": item.get("contenido"),
            }
        )

    return normalizados
