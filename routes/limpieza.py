"""
----------------------------------------------------------
Archivo: routes/limpieza.py
Descripción: Módulo de servicios de limpieza (alta y edición)
Acceso: Privado
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from __future__ import annotations

import logging
import os
import smtplib
from datetime import date, datetime
from email.message import EmailMessage
from pathlib import Path
import tempfile

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
)
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, ValidationError
from fpdf import FPDF
from supabase import Client, create_client

router = APIRouter()
TEMPLATES = Jinja2Templates(directory="templates")

# ===== Supabase =====
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

TABLA = "servicios_limpieza"
BUCKET = "servicios-limpieza"

# ===== Logging =====
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
logger = logging.getLogger("servicios_limpieza")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(os.path.join(LOG_DIR, "servicios_limpieza.log"), mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False


class ServicioLimpiezaNuevo(BaseModel):
    fecha_servicio: date
    numero_bano: str
    dni_cuit_cuil: str
    nombre_cliente: str
    tipo_servicio: str
    estado: str
    observaciones: str | None = None


def _crear_pdf_desde_imagen(data: bytes, extension: str) -> bytes:
    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
        tmp.write(data)
        tmp.flush()
        imagen_path = tmp.name

    pdf = FPDF()
    pdf.add_page()
    pdf.image(imagen_path, x=10, y=10, w=190)
    pdf_bytes = pdf.output(dest="S").encode("latin1")
    os.unlink(imagen_path)
    return pdf_bytes


# ========= ADMIN =========

@router.get("/admin/limpieza/nuevo", response_class=HTMLResponse)
async def form_nuevo_admin(request: Request):
    return TEMPLATES.TemplateResponse("limpieza_form_admin.html", {"request": request})

@router.post("/admin/limpieza/nuevo")
async def crear_admin(request: Request, **form_data):
    return await _procesar_alta_o_actualizacion(request, form_data, panel="admin", es_edicion=False)

@router.get("/admin/limpieza/editar/{id_servicio}", response_class=HTMLResponse)
async def form_editar_admin(request: Request, id_servicio: int):
    servicio = await _obtener_servicio(id_servicio)
    return TEMPLATES.TemplateResponse("limpieza_form_admin.html", {"request": request, "servicio": servicio})

@router.post("/admin/limpieza/editar/{id_servicio}")
async def actualizar_admin(request: Request, id_servicio: int, **form_data):
    return await _procesar_alta_o_actualizacion(request, form_data, panel="admin", es_edicion=True, id_servicio=id_servicio)


# ========= EMPLEADO =========

@router.get("/empleado/limpieza/nuevo", response_class=HTMLResponse)
async def form_nuevo_empleado(request: Request):
    return TEMPLATES.TemplateResponse("limpieza_form_empleado.html", {"request": request})

@router.post("/empleado/limpieza/nuevo")
async def crear_empleado(request: Request, **form_data):
    return await _procesar_alta_o_actualizacion(request, form_data, panel="empleado", es_edicion=False)

@router.get("/empleado/limpieza/editar/{id_servicio}", response_class=HTMLResponse)
async def form_editar_empleado(request: Request, id_servicio: int):
    servicio = await _obtener_servicio(id_servicio)
    return TEMPLATES.TemplateResponse("limpieza_form_empleado.html", {"request": request, "servicio": servicio})

@router.post("/empleado/limpieza/editar/{id_servicio}")
async def actualizar_empleado(request: Request, id_servicio: int, **form_data):
    return await _procesar_alta_o_actualizacion(request, form_data, panel="empleado", es_edicion=True, id_servicio=id_servicio)


# ========= UTILIDADES =========

async def _obtener_servicio(id_servicio: int) -> dict:
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    res = supabase.table(TABLA).select("*").eq("id_servicio", id_servicio).single().execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=500, detail=str(res.error.message))
    servicio = res.data
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return servicio

async def _procesar_alta_o_actualizacion(request: Request, form_data: dict, panel: str, es_edicion: bool, id_servicio: int | None = None):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    remito: UploadFile = form_data.pop("remito", None)
    if es_edicion and id_servicio is None:
        raise HTTPException(status_code=400, detail="ID de servicio faltante en edición")

    # Asignar estado por defecto para empleados
    if panel == "empleado" and not es_edicion:
        form_data["estado"] = "pendiente"

    try:
        servicio = ServicioLimpiezaNuevo(**form_data)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    remito_url = None
    if remito and remito.filename:
        imagen_bytes = await remito.read()
        extension = Path(remito.filename).suffix.lower() or ".jpg"
        pdf_bytes = _crear_pdf_desde_imagen(imagen_bytes, extension)
        nombre_pdf = f"remito_{servicio.numero_bano}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"
        bucket = supabase.storage.from_(BUCKET)
        bucket.upload(nombre_pdf, pdf_bytes, {"content-type": "application/pdf"})
        remito_url = bucket.get_public_url(nombre_pdf)

    datos = servicio.model_dump()
    datos["fecha_servicio"] = servicio.fecha_servicio.isoformat()
    if remito_url:
        datos["remito_url"] = remito_url

    if es_edicion:
        res = supabase.table(TABLA).update(datos).eq("id_servicio", id_servicio).execute()
    else:
        res = supabase.table(TABLA).insert(datos).execute()

    if getattr(res, "error", None):
        raise HTTPException(status_code=500, detail=str(res.error.message))

    destino = f"/{panel}/limpieza"
    return RedirectResponse(destino, status_code=303)
