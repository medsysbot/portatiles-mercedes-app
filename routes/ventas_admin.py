"""
----------------------------------------------------------
Archivo: routes/ventas_admin.py
Descripción: Endpoints para la gestión de ventas en el panel administrativo
Acceso: Privado
Proyecto: Portátiles Mercedes
Última modificación: 2025-07-31
----------------------------------------------------------
"""

from fastapi import APIRouter, HTTPException, Request, Form
from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from datetime import date
import os
import logging
from supabase import create_client, Client

router = APIRouter()

# ==== Configuración Supabase ====
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

VENTAS_TABLE = "ventas"

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "ventas_admin.log")
logger = logging.getLogger("ventas_admin")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

TEMPLATES = Jinja2Templates(directory="templates")

# ==== Modelo de venta ====

class VentaAdmin(BaseModel):
    fecha_operacion: date
    tipo_bano: str
    dni_cuit_cuil: str
    nombre_cliente: str
    forma_pago: str
    observaciones: str | None = None

# ==== Endpoint: Mostrar formulario de nueva venta ====
@router.get("/admin/ventas/nueva", response_class=HTMLResponse)
def form_nueva_venta(request: Request):
    return TEMPLATES.TemplateResponse("ventas_form.html", {"request": request})

# ==== Endpoint: Listar ventas ====
@router.get("/admin/api/ventas")
async def listar_ventas():
    if not supabase:
        logger.warning("Supabase no configurado")
        return []
    try:
        resp = supabase.table(VENTAS_TABLE).select("*").execute()
    except Exception as exc:
        logger.exception("Error al consultar ventas:")
        raise HTTPException(status_code=500, detail=f"Error consultando ventas: {exc}")
    data = getattr(resp, "data", None)
    if not data:
        return []
    return data

# ==== Endpoint: Eliminar ventas ====
class IdLista(BaseModel):
    ids: list[str]

@router.post("/admin/api/ventas/eliminar")
async def eliminar_ventas(payload: IdLista):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        supabase.table(VENTAS_TABLE).delete().in_("id_venta", payload.ids).execute()
    except Exception as exc:
        logger.exception("Error eliminando ventas:")
        raise HTTPException(status_code=500, detail=str(exc))
    return {"ok": True}

# ==== Endpoint: Agregar nueva venta (POST) ====
@router.post("/admin/ventas/nueva")
async def crear_venta(
    fecha_operacion: date = Form(...),
    tipo_bano: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    nombre_cliente: str = Form(...),
    forma_pago: str = Form(...),
    observaciones: str = Form(None),
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    datos = {
        "fecha_operacion": fecha_operacion.isoformat(),
        "tipo_bano": tipo_bano,
        "dni_cuit_cuil": dni_cuit_cuil,
        "nombre_cliente": nombre_cliente,
        "forma_pago": forma_pago,
        "observaciones": observaciones or ""
    }
    try:
        resp = supabase.table(VENTAS_TABLE).insert(datos).execute()
        if getattr(resp, "error", None):
            raise Exception(resp.error.message)
    except Exception as exc:
        logger.exception("Error al registrar venta:")
        raise HTTPException(status_code=500, detail=f"Error al registrar venta: {exc}")
    return RedirectResponse("/admin/ventas", status_code=303)
