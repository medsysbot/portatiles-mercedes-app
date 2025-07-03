"""
----------------------------------------------------------
Archivo: routes/limpieza.py
Descripción: Módulo de servicios de limpieza con estado
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

from routes.alertas import (
    EMAIL_ORIGIN,
    EMAIL_PASSWORD,
    SMTP_PORT,
    SMTP_SERVER,
)


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
    """Convierte la imagen recibida en un PDF y devuelve los bytes."""
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


def _enviar_correo(destino: str, asunto: str, mensaje: str, pdf: bytes, nombre: str) -> None:
    """Envía un correo al cliente con el PDF adjunto si es posible."""
    if not all([EMAIL_ORIGIN, EMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT]):
        logger.warning("Variables de SMTP no configuradas; email no enviado")
        return

    msg = EmailMessage()
    msg["From"] = EMAIL_ORIGIN
    msg["To"] = destino
    msg["Subject"] = asunto
    msg.set_content(f"{mensaje}\n\nAdjunto encontrará el remito de servicio.")
    msg.add_attachment(pdf, maintype="application", subtype="pdf", filename=nombre)

    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, int(SMTP_PORT)) as smtp:
            smtp.login(EMAIL_ORIGIN, EMAIL_PASSWORD)
            smtp.send_message(msg)
        logger.info("Correo enviado a %s", destino)
    except Exception as exc:
        logger.error("Error enviando correo: %s", exc)


# ========= ADMIN =========

@router.get("/admin/limpieza/nuevo", response_class=HTMLResponse)
async def form_servicio_limpieza(request: Request):
    """Muestra el formulario para registrar un servicio de limpieza (admin)."""
    return TEMPLATES.TemplateResponse("limpieza_form_admin.html", {"request": request})


@router.post("/admin/limpieza/nuevo")
async def crear_servicio_limpieza(
    request: Request,
    fecha_servicio: str = Form(...),
    numero_bano: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    nombre_cliente: str = Form(...),
    tipo_servicio: str = Form(...),
    estado: str = Form(...),
    observaciones: str | None = Form(None),
    remito: UploadFile | None = None,
):
    """Registra un servicio de limpieza desde el panel admin."""

    if not supabase:
        logger.error("Supabase no configurado al registrar servicio")
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    datos_form = {
        "fecha_servicio": fecha_servicio,
        "numero_bano": numero_bano,
        "dni_cuit_cuil": dni_cuit_cuil,
        "nombre_cliente": nombre_cliente,
        "tipo_servicio": tipo_servicio,
        "estado": estado,
        "observaciones": observaciones,
    }

    try:
        servicio = ServicioLimpiezaNuevo(**datos_form)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    remito_url = None
    if remito and remito.filename:
        imagen_bytes = await remito.read()
        extension = Path(remito.filename).suffix.lower() or ".jpg"
        pdf_bytes = _crear_pdf_desde_imagen(imagen_bytes, extension)

        fecha_archivo = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        nombre_pdf = f"remito_{numero_bano}_{fecha_archivo}.pdf"

        bucket = supabase.storage.from_(BUCKET)
        try:
            bucket.upload(nombre_pdf, pdf_bytes, {"content-type": "application/pdf"})
            remito_url = bucket.get_public_url(nombre_pdf)
        except Exception as exc:
            logger.exception("Error subiendo PDF a storage:")
            raise HTTPException(status_code=500, detail=str(exc))

    datos_insert = servicio.model_dump()
    datos_insert["fecha_servicio"] = servicio.fecha_servicio.isoformat()
    if remito_url:
        datos_insert["remito_url"] = remito_url

    try:
        res = supabase.table(TABLA).insert(datos_insert).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
    except Exception as exc:
        logger.exception("Error guardando servicio en la base:")
        raise HTTPException(status_code=500, detail=str(exc))

    return RedirectResponse("/admin/limpieza", status_code=303)


# ========= EMPLEADO =========

@router.get("/empleado/limpieza/nuevo", response_class=HTMLResponse)
async def form_servicio_limpieza_empleado(request: Request):
    """Muestra el formulario para registrar un servicio de limpieza (empleado)."""
    return TEMPLATES.TemplateResponse("limpieza_form_empleado.html", {"request": request})


@router.post("/empleado/limpieza/nuevo")
async def crear_servicio_limpieza_empleado(
    request: Request,
    fecha_servicio: str = Form(...),
    numero_bano: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    nombre_cliente: str = Form(...),
    tipo_servicio: str = Form(...),
    observaciones: str | None = Form(None),
    remito: UploadFile | None = None,
):
    """Registra un servicio de limpieza desde el panel de empleados."""

    if not supabase:
        logger.error("Supabase no configurado al registrar servicio")
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    datos_form = {
        "fecha_servicio": fecha_servicio,
        "numero_bano": numero_bano,
        "dni_cuit_cuil": dni_cuit_cuil,
        "nombre_cliente": nombre_cliente,
        "tipo_servicio": tipo_servicio,
        "estado": "pendiente",
        "observaciones": observaciones,
    }

    try:
        servicio = ServicioLimpiezaNuevo(**datos_form)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    remito_url = None
    if remito and remito.filename:
        imagen_bytes = await remito.read()
        extension = Path(remito.filename).suffix.lower() or ".jpg"
        pdf_bytes = _crear_pdf_desde_imagen(imagen_bytes, extension)

        fecha_archivo = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        nombre_pdf = f"remito_{numero_bano}_{fecha_archivo}.pdf"

        bucket = supabase.storage.from_(BUCKET)
        try:
            bucket.upload(nombre_pdf, pdf_bytes, {"content-type": "application/pdf"})
            remito_url = bucket.get_public_url(nombre_pdf)
        except Exception as exc:
            logger.exception("Error subiendo PDF a storage:")
            raise HTTPException(status_code=500, detail=str(exc))

    datos_insert = servicio.model_dump()
    datos_insert["fecha_servicio"] = servicio.fecha_servicio.isoformat()
    if remito_url:
        datos_insert["remito_url"] = remito_url

    try:
        res = supabase.table(TABLA).insert(datos_insert).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
    except Exception as exc:
        logger.exception("Error guardando servicio en la base:")
        raise HTTPException(status_code=500, detail=str(exc))

    return RedirectResponse("/empleado/limpieza", status_code=303)
