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
import sys
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

# --- Si usas alertas, descomenta e incluye las variables SMTP ---
# from routes.alertas import (
#     EMAIL_ORIGIN,
#     EMAIL_PASSWORD,
#     SMTP_PORT,
#     SMTP_SERVER,
# )

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
LOG_FILE = os.path.join(LOG_DIR, "servicios_limpieza.log")
logger = logging.getLogger("servicios_limpieza")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler_file = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler_file.setFormatter(formatter)
    logger.addHandler(handler_file)

    handler_console = logging.StreamHandler(sys.stdout)
    handler_console.setFormatter(formatter)
    logger.addHandler(handler_console)

    logger.propagate = False

# ===== Modelos =====
class ServicioLimpiezaNuevo(BaseModel):
    fecha_servicio: date
    numero_bano: str
    dni_cuit_cuil: str
    nombre_cliente: str
    tipo_servicio: str
    estado: str = "pendiente"
    observaciones: str | None = None

# ===== Utilidades =====
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

# # Opcional: Si necesitas envío de correo, reactiva esto:
# def _enviar_correo(destino: str, asunto: str, mensaje: str, pdf: bytes, nombre: str) -> None:
#     if not all([EMAIL_ORIGIN, EMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT]):
#         logger.warning("Variables de SMTP no configuradas; email no enviado")
#         return
#     msg = EmailMessage()
#     msg["From"] = EMAIL_ORIGIN
#     msg["To"] = destino
#     msg["Subject"] = asunto
#     msg.set_content(f"{mensaje}\n\nAdjunto encontrará el remito de servicio.")
#     msg.add_attachment(pdf, maintype="application", subtype="pdf", filename=nombre)
#     try:
#         with smtplib.SMTP_SSL(SMTP_SERVER, int(SMTP_PORT)) as smtp:
#             smtp.login(EMAIL_ORIGIN, EMAIL_PASSWORD)
#             smtp.send_message(msg)
#         logger.info("Correo enviado a %s", destino)
#     except Exception as exc:
#         logger.error("Error enviando correo: %s", exc)

# ========= FORMULARIOS =========
@router.get("/empleado/limpieza/nuevo", response_class=HTMLResponse)
async def form_nuevo_empleado(request: Request):
    return TEMPLATES.TemplateResponse("limpieza_form_empleado.html", {"request": request})

@router.get("/empleado/limpieza/editar/{id_servicio}", response_class=HTMLResponse)
async def form_editar_empleado(request: Request, id_servicio: int):
    servicio = await _obtener_servicio(id_servicio)
    return TEMPLATES.TemplateResponse("limpieza_form_empleado.html", {"request": request, "servicio": servicio})

# ========= ACCIONES =========
@router.post("/empleado/limpieza/nuevo")
async def crear_empleado(
    request: Request,
    fecha_servicio: str = Form(...),
    numero_bano: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    nombre_cliente: str = Form(...),
    tipo_servicio: str = Form(...),
    estado: str = Form("pendiente"),
    observaciones: str | None = Form(None),
    remito: UploadFile = File(None),
):
    return await _procesar_alta_o_actualizacion(
        request, {
            "fecha_servicio": fecha_servicio,
            "numero_bano": numero_bano,
            "dni_cuit_cuil": dni_cuit_cuil,
            "nombre_cliente": nombre_cliente,
            "tipo_servicio": tipo_servicio,
            "estado": estado,
            "observaciones": observaciones,
            "remito": remito,
        }, es_edicion=False
    )

@router.post("/empleado/limpieza/editar/{id_servicio}")
async def actualizar_empleado(
    request: Request, id_servicio: int,
    fecha_servicio: str = Form(...),
    numero_bano: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    nombre_cliente: str = Form(...),
    tipo_servicio: str = Form(...),
    estado: str = Form(...),
    observaciones: str | None = Form(None),
    remito: UploadFile = File(None),
):
    return await _procesar_alta_o_actualizacion(
        request, {
            "fecha_servicio": fecha_servicio,
            "numero_bano": numero_bano,
            "dni_cuit_cuil": dni_cuit_cuil,
            "nombre_cliente": nombre_cliente,
            "tipo_servicio": tipo_servicio,
            "estado": estado,
            "observaciones": observaciones,
            "remito": remito,
        }, es_edicion=True, id_servicio=id_servicio
    )

# ========= API LISTADO =========
@router.get("/empleado/api/servicios_limpieza")
async def api_listar_servicios_empleado():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    res = supabase.table(TABLA).select("*").order("fecha_servicio", desc=True).execute()
    if getattr(res, "error", None):
        logger.error("Error al obtener servicios: %s", res.error.message)
        raise HTTPException(status_code=500, detail=str(res.error.message))
    return res.data or []

# ========= UTILIDADES =========
async def _obtener_servicio(id_servicio: int) -> dict:
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    res = supabase.table(TABLA).select("*").eq("id_servicio", id_servicio).single().execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=500, detail=str(res.error.message))
    return res.data

async def _procesar_alta_o_actualizacion(request: Request, form_data: dict, es_edicion: bool, id_servicio: int | None = None):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    remito: UploadFile | None = form_data.pop("remito", None)
    logger.info("[DEBUG] remito: %s", f"filename={remito.filename}" if remito and remito.filename else "Ninguno recibido")

    # VALIDACIÓN Y NORMALIZACIÓN DE DATOS
    try:
        form_data["fecha_servicio"] = datetime.fromisoformat(form_data["fecha_servicio"]).date()
        servicio = ServicioLimpiezaNuevo(**form_data)
    except Exception as exc:
        logger.exception("Error procesando datos del formulario:")
        raise HTTPException(status_code=400, detail=f"Error en datos: {exc}")

    # SUBIDA DE REMITO SI EXISTE
    remito_url = ""
    if isinstance(remito, UploadFile) and remito.filename:
        imagen_bytes = await remito.read()
        extension = Path(remito.filename).suffix.lower() or ".jpg"
        pdf_bytes = _crear_pdf_desde_imagen(imagen_bytes, extension)
        nombre_pdf = f"remito_{servicio.numero_bano}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"

        bucket = supabase.storage.from_(BUCKET)
        try:
            bucket.upload(nombre_pdf, pdf_bytes, {"content-type": "application/pdf"})
            remito_url = bucket.get_public_url(nombre_pdf)
            logger.info("Remito subido correctamente: %s", remito_url)
        except Exception as exc:
            logger.error("Error subiendo remito a Supabase: %s", exc)
            raise HTTPException(status_code=500, detail=f"Error subiendo remito: {exc}")

    elif es_edicion:
        # En edición: mantener el remito anterior si no se sube uno nuevo
        servicio_existente = await _obtener_servicio(id_servicio)
        remito_url = servicio_existente.get("remito_url") or ""

    datos = servicio.model_dump()
    datos["fecha_servicio"] = servicio.fecha_servicio.isoformat()
    datos["remito_url"] = remito_url

    if es_edicion:
        res = supabase.table(TABLA).update(datos).eq("id_servicio", id_servicio).execute()
    else:
        res = supabase.table(TABLA).insert(datos).execute()

    if getattr(res, "error", None):
        logger.error("Error en Supabase: %s", res.error.message)
        raise HTTPException(status_code=500, detail=str(res.error.message))

    logger.info("Operación %s completada correctamente", "actualización" if es_edicion else "alta")
    return RedirectResponse("/empleado/limpieza", status_code=303)
