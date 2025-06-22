"""
----------------------------------------------------------
Archivo: routes/facturas_pendientes.py
Descripción: Rutas para el módulo de facturas pendientes
Acceso: Privado
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from datetime import date
import logging
import os
from decimal import Decimal, DecimalException

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, ValidationError
from supabase import create_client, Client

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "facturas_pendientes.log")
logger = logging.getLogger("facturas_pendientes")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

TEMPLATES = Jinja2Templates(directory="templates")
TABLA = "facturas_pendientes"


class FacturaPendiente(BaseModel):
    fecha: date
    numero_factura: str
    dni_cuit_cuil: str
    razon_social: str
    nombre_cliente: str
    monto_adeudado: Decimal


@router.get("/admin/facturas_pendientes", response_class=HTMLResponse)
async def facturas_pendientes_admin(request: Request):
    """Vista principal del listado de facturas pendientes."""
    logger.info("Vista facturas pendientes solicitada")
    return TEMPLATES.TemplateResponse(
        "facturas_pendientes.html", {"request": request}
    )


@router.get("/admin/facturas_pendientes/nueva", response_class=HTMLResponse)
async def form_nueva_factura(request: Request):
    """Formulario para crear una factura pendiente."""
    logger.info("Vista nueva factura pendiente solicitada")
    return TEMPLATES.TemplateResponse(
        "facturas_pendientes_form.html", {"request": request}
    )


@router.post("/admin/facturas_pendientes/nueva")
async def crear_factura(request: Request):
    """Guarda un registro de factura pendiente en la base."""
    if not supabase:
        logger.error("Supabase no configurado al crear factura")
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    if request.headers.get("content-type", "").startswith("application/json"):
        datos_req = await request.json()
    else:
        form = await request.form()
        datos_req = dict(form)
    logger.info("Crear factura datos recibidos: %s", datos_req)

    try:
        datos_req["monto_adeudado"] = Decimal(str(datos_req.get("monto_adeudado")))
        factura = FacturaPendiente(**datos_req)
    except (ValidationError, DecimalException) as exc:  # type: ignore[name-defined]
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    datos = factura.model_dump()
    datos["fecha"] = factura.fecha.isoformat()
    datos["monto_adeudado"] = float(factura.monto_adeudado)

    try:
        result = supabase.table(TABLA).insert(datos).execute()
        if getattr(result, "error", None):
            raise Exception(result.error.message)
    except Exception as exc:  # pragma: no cover
        logger.exception("Error guardando factura:")
        return {"error": f"Error al guardar factura: {exc}"}

    if request.headers.get("content-type", "").startswith("application/json"):
        return {"ok": True}
    return {"ok": True}


@router.get("/admin/api/facturas_pendientes")
async def listar_facturas():
    """Devuelve la lista completa de facturas pendientes."""
    if not supabase:
        logger.warning("Supabase no configurado al listar facturas")
        return []

    try:
        res = supabase.table(TABLA).select("*").execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:  # pragma: no cover
        logger.exception("Error consultando facturas:")
        raise HTTPException(status_code=500, detail=str(exc))
