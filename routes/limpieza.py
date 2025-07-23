"""
----------------------------------------------------------
Archivo: routes/limpieza.py
Descripción: Gestión de servicios de limpieza (empleados y admin).
Incluye el campo opcional "razon_social" para cada servicio.
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

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
from utils.file_utils import obtener_tipo_archivo, imagen_a_pdf

router = APIRouter()

# ===== Supabase =====
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ===== Logging =====
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "servicios_limpieza.log")
logger = logging.getLogger("servicios_limpieza")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

TEMPLATES = Jinja2Templates(directory="templates")
TEMPLATES.env.globals["gmail_user"] = os.getenv("EMAIL_ORIGEN")
TABLA = "servicios_limpieza"
BUCKET = "servicios-limpieza"

# ======== MODELOS ==========

class ServicioLimpiezaNuevo(BaseModel):
    fecha_servicio: date
    numero_bano: str
    dni_cuit_cuil: str
    nombre_cliente: str
    direccion: str | None = None
    razon_social: str | None = None
    tipo_servicio: str
    observaciones: str | None = None
    estado: str

class _IdLista(BaseModel):
    ids: list[int]

# ======== UTILS ============

def _crear_pdf_desde_imagen(data: bytes, extension: str) -> bytes:
    """Convierte la imagen recibida en un PDF y devuelve los bytes."""
    return imagen_a_pdf(data, extension)

# =========== EMPLEADO: FORMULARIO Y CRUD =============

@router.get("/empleado/limpieza/nuevo", response_class=HTMLResponse)
async def form_servicio_limpieza_empleado(request: Request):
    return TEMPLATES.TemplateResponse("limpieza_form_empleado.html", {"request": request, "servicio": None})

@router.post("/empleado/limpieza/nuevo")
async def crear_servicio_limpieza_empleado(
    request: Request,
    fecha_servicio: str = Form(...),
    numero_bano: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    nombre_cliente: str = Form(...),
    direccion: str | None = Form(None),
    razon_social: str | None = Form(None),
    tipo_servicio: str = Form(...),
    observaciones: str | None = Form(None),
    estado: str = Form(...),
    remito: UploadFile = File(None)
):
    return await _procesar_servicio(
        request=request,
        form_data={
            "fecha_servicio": fecha_servicio,
            "numero_bano": numero_bano,
            "dni_cuit_cuil": dni_cuit_cuil,
            "nombre_cliente": nombre_cliente,
            "direccion": direccion,
            "razon_social": razon_social,
            "tipo_servicio": tipo_servicio,
            "observaciones": observaciones,
            "estado": estado,
            "remito": remito,
        },
        es_edicion=False,
        id_servicio=None,
        plantilla="limpieza_form_empleado.html",
        redir="/empleado/limpieza"
    )

@router.get("/empleado/limpieza/editar/{id_servicio}", response_class=HTMLResponse)
async def editar_servicio_limpieza_empleado(request: Request, id_servicio: int):
    return await _cargar_form_edicion(
        request, id_servicio, plantilla="limpieza_form_empleado.html"
    )

@router.post("/empleado/limpieza/editar/{id_servicio}")
async def actualizar_servicio_limpieza_empleado(
    request: Request,
    id_servicio: int,
    fecha_servicio: str = Form(...),
    numero_bano: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    nombre_cliente: str = Form(...),
    direccion: str | None = Form(None),
    razon_social: str | None = Form(None),
    tipo_servicio: str = Form(...),
    observaciones: str | None = Form(None),
    estado: str = Form(...),
    remito: UploadFile = File(None)
):
    return await _procesar_servicio(
        request=request,
        form_data={
            "fecha_servicio": fecha_servicio,
            "numero_bano": numero_bano,
            "dni_cuit_cuil": dni_cuit_cuil,
            "nombre_cliente": nombre_cliente,
            "direccion": direccion,
            "razon_social": razon_social,
            "tipo_servicio": tipo_servicio,
            "observaciones": observaciones,
            "estado": estado,
            "remito": remito,
        },
        es_edicion=True,
        id_servicio=id_servicio,
        plantilla="limpieza_form_empleado.html",
        redir="/empleado/limpieza"
    )

@router.get("/empleado/api/servicios_limpieza")
async def listar_servicios_limpieza_empleado():
    return await _listar_servicios()

@router.post("/empleado/api/servicios_limpieza/eliminar")
async def eliminar_servicios_empleado(payload: _IdLista):
    return await _eliminar_servicios(payload)

# =========== ADMIN: FORMULARIO Y CRUD =============

@router.get("/admin/limpieza/nuevo", response_class=HTMLResponse)
async def form_servicio_limpieza_admin(request: Request):
    return TEMPLATES.TemplateResponse("limpieza_form_admin.html", {"request": request, "servicio": None})

@router.post("/admin/limpieza/nuevo")
async def crear_servicio_limpieza_admin(
    request: Request,
    fecha_servicio: str = Form(...),
    numero_bano: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    nombre_cliente: str = Form(...),
    direccion: str | None = Form(None),
    razon_social: str | None = Form(None),
    tipo_servicio: str = Form(...),
    observaciones: str | None = Form(None),
    estado: str = Form(...),
    remito: UploadFile = File(None)
):
    return await _procesar_servicio(
        request=request,
        form_data={
            "fecha_servicio": fecha_servicio,
            "numero_bano": numero_bano,
            "dni_cuit_cuil": dni_cuit_cuil,
            "nombre_cliente": nombre_cliente,
            "direccion": direccion,
            "razon_social": razon_social,
            "tipo_servicio": tipo_servicio,
            "observaciones": observaciones,
            "estado": estado,
            "remito": remito,
        },
        es_edicion=False,
        id_servicio=None,
        plantilla="limpieza_form_admin.html",
        redir="/admin/limpieza"
    )

@router.get("/admin/limpieza/editar/{id_servicio}", response_class=HTMLResponse)
async def editar_servicio_limpieza_admin(request: Request, id_servicio: int):
    return await _cargar_form_edicion(
        request, id_servicio, plantilla="limpieza_form_admin.html"
    )

@router.post("/admin/limpieza/editar/{id_servicio}")
async def actualizar_servicio_limpieza_admin(
    request: Request,
    id_servicio: int,
    fecha_servicio: str = Form(...),
    numero_bano: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    nombre_cliente: str = Form(...),
    direccion: str | None = Form(None),
    razon_social: str | None = Form(None),
    tipo_servicio: str = Form(...),
    observaciones: str | None = Form(None),
    estado: str = Form(...),
    remito: UploadFile = File(None)
):
    return await _procesar_servicio(
        request=request,
        form_data={
            "fecha_servicio": fecha_servicio,
            "numero_bano": numero_bano,
            "dni_cuit_cuil": dni_cuit_cuil,
            "nombre_cliente": nombre_cliente,
            "direccion": direccion,
            "razon_social": razon_social,
            "tipo_servicio": tipo_servicio,
            "observaciones": observaciones,
            "estado": estado,
            "remito": remito,
        },
        es_edicion=True,
        id_servicio=id_servicio,
        plantilla="limpieza_form_admin.html",
        redir="/admin/limpieza"
    )

@router.get("/admin/api/servicios_limpieza")
async def listar_servicios_limpieza_admin():
    return await _listar_servicios()

@router.post("/admin/api/servicios_limpieza/eliminar")
async def eliminar_servicios_admin(payload: _IdLista):
    return await _eliminar_servicios(payload)

# ======== FUNCIONES AUXILIARES =========

async def _cargar_form_edicion(request: Request, id_servicio: int, plantilla: str):
    if not supabase:
        logger.warning("Supabase no configurado al editar servicios")
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    result = supabase.table(TABLA).select("*").eq("id_servicio", id_servicio).maybe_single().execute()
    if getattr(result, "error", None) or not getattr(result, "data", None):
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    servicio = result.data
    return TEMPLATES.TemplateResponse(plantilla, {"request": request, "servicio": servicio})

async def _procesar_servicio(request, form_data, es_edicion, id_servicio, plantilla, redir):
    if not supabase:
        logger.error("Supabase no configurado al registrar/editar servicio")
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    remito: UploadFile | None = form_data.pop("remito", None)
    try:
        form_data["fecha_servicio"] = datetime.fromisoformat(form_data["fecha_servicio"]).date()
        servicio = ServicioLimpiezaNuevo(**form_data)
    except Exception as exc:
        logger.exception("Error procesando datos del formulario:")
        raise HTTPException(status_code=400, detail=f"Error en datos: {exc}")

    remito_url = None
    if remito and remito.filename:
        imagen_bytes = await remito.read()
        if not imagen_bytes:
            logger.error(f"El archivo remito '{remito.filename}' está vacío.")
            raise HTTPException(status_code=400, detail="El archivo remito está vacío o corrupto.")
        mime = obtener_tipo_archivo(imagen_bytes)
        if mime not in {"application/pdf", "image/png", "image/jpeg"}:
            logger.error("Formato de remito no soportado")
            raise HTTPException(status_code=400, detail="Formato no permitido")
        if mime == "application/pdf":
            pdf_bytes = imagen_bytes
        else:
            extension = ".png" if mime == "image/png" else ".jpg"
            pdf_bytes = _crear_pdf_desde_imagen(imagen_bytes, extension)
        fecha_archivo = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        nombre_pdf = f"remito_{form_data['numero_bano']}_{fecha_archivo}.pdf"
        bucket = supabase.storage.from_(BUCKET)
        try:
            bucket.upload(nombre_pdf, pdf_bytes, {"content-type": "application/pdf"})
            remito_url = bucket.get_public_url(nombre_pdf)
        except Exception as exc:
            logger.exception("Error subiendo PDF a storage:")
            raise HTTPException(status_code=500, detail=str(exc))
    elif es_edicion and id_servicio:
        # Mantener el remito anterior si no se sube uno nuevo
        result = supabase.table(TABLA).select("*").eq("id_servicio", id_servicio).maybe_single().execute()
        remito_url = result.data.get("remito_url") if getattr(result, "data", None) else None

    datos_insert = servicio.model_dump()
    datos_insert["fecha_servicio"] = servicio.fecha_servicio.isoformat()
    datos_insert["remito_url"] = remito_url

    try:
        if es_edicion and id_servicio:
            res = supabase.table(TABLA).update(datos_insert).eq("id_servicio", id_servicio).execute()
        else:
            res = supabase.table(TABLA).insert(datos_insert).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
    except Exception as exc:
        logger.exception("Error guardando servicio en la base:")
        raise HTTPException(status_code=500, detail=str(exc))

    return RedirectResponse(redir, status_code=303)

async def _listar_servicios():
    if not supabase:
        logger.warning("Supabase no configurado al listar servicios")
        return []
    try:
        result = supabase.table(TABLA).select("*").execute()
    except Exception as exc:
        logger.exception("Error consultando servicios de limpieza:")
        raise HTTPException(status_code=500, detail=str(exc))
    if getattr(result, "error", None):
        logger.error("Error en consulta de servicios de limpieza: %s", result.error)
        raise HTTPException(status_code=500, detail=f"Error en consulta: {result.error.message}")
    datos = getattr(result, "data", None)
    if not datos:
        logger.warning("Consulta de servicios de limpieza sin datos")
        return []
    normalizados = []
    for d in datos:
        normalizados.append(
            {
                "id_servicio": d.get("id_servicio") or d.get("id"),
                "fecha_servicio": d.get("fecha_servicio"),
                "numero_bano": d.get("numero_bano"),
                "dni_cuit_cuil": d.get("dni_cuit_cuil"),
                "nombre_cliente": d.get("nombre_cliente"),
                "razon_social": d.get("razon_social"),
                "direccion": d.get("direccion"),
                "tipo_servicio": d.get("tipo_servicio"),
                "estado": d.get("estado"),
                "remito_url": d.get("remito_url"),
                "observaciones": d.get("observaciones"),
            }
        )
    return normalizados

async def _eliminar_servicios(payload):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        supabase.table(TABLA).delete().in_("id_servicio", payload.ids).execute()
    except Exception as exc:
        logger.exception("Error eliminando servicios:")
        raise HTTPException(status_code=500, detail=str(exc))
    return {"ok": True}
