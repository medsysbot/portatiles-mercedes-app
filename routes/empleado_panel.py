"""
----------------------------------------------------------
Archivo: routes/empleado_panel.py
Descripción: Endpoints para el panel de empleados
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from datetime import date
from fastapi import APIRouter, HTTPException, Request, Form, File, UploadFile
from utils.file_utils import obtener_tipo_archivo, imagen_a_pdf
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, ValidationError
from pathlib import Path
import logging
import os
from supabase import Client, create_client

router = APIRouter()

templates = Jinja2Templates(directory="templates")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

tabla_reportes = "reportes"
tabla_servicios = "servicios_limpieza"
bucket_servicios = "servicios-limpieza"

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
logger = logging.getLogger("empleado_panel")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(os.path.join(LOG_DIR, "empleado_panel.log"), mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False


class ReporteNuevo(BaseModel):
    fecha: date
    nombre_persona: str
    asunto: str
    contenido: str


class ServicioLimpiezaNuevo(BaseModel):
    fecha_servicio: date
    numero_bano: str
    dni_cuit_cuil: str
    nombre_cliente: str
    direccion: str | None = None
    razon_social: str | None = None
    tipo_servicio: str
    observaciones: str | None = None


class _IdLista(BaseModel):
    ids: list[int]


@router.get("/empleado/panel", response_class=HTMLResponse)
def empleado_panel_view(request: Request):
    """Vista principal del panel de empleado."""
    return templates.TemplateResponse("panel_empleado.html", {"request": request})


# ----------------------- Reportes -----------------------

@router.get("/empleado/reportes", response_class=HTMLResponse)
def ver_reportes(request: Request):
    return templates.TemplateResponse("reportes_empleado.html", {"request": request})


@router.get("/empleado/reportes/nuevo", response_class=HTMLResponse)
async def form_nuevo_reporte(request: Request):
    return templates.TemplateResponse("reporte_form_empleado.html", {"request": request})


@router.post("/empleado/reportes/nuevo")
async def crear_reporte(request: Request):
    if not supabase:
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
        res = supabase.table(tabla_reportes).insert(datos).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
    except Exception as exc:  # pragma: no cover
        logger.exception("Error al guardar reporte:")
        return {"error": f"Error al guardar reporte: {exc}"}

    if request.headers.get("content-type", "").startswith("application/json"):
        return {"ok": True}
    return RedirectResponse("/empleado/reportes", status_code=303)


@router.get("/empleado/api/reportes")
async def listar_reportes():
    if not supabase:
        return []
    try:
        resultado = supabase.table(tabla_reportes).select("*").execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error de conexión: {exc}")

    if getattr(resultado, "error", None):
        raise HTTPException(status_code=500, detail=f"Error en consulta: {resultado.error.message}")

    data = getattr(resultado, "data", None) or []
    normalizados = []
    for item in data:
        normalizados.append({
            "id_reporte": item.get("id_reporte") or item.get("id"),
            "fecha": item.get("fecha"),
            "nombre_persona": item.get("nombre_persona") or item.get("nombre"),
            "asunto": item.get("asunto"),
            "contenido": item.get("contenido"),
        })
    return normalizados


# ------------------ Servicios de limpieza -----------------

@router.get("/empleado/limpieza", response_class=HTMLResponse)
def ver_servicios(request: Request):
    return templates.TemplateResponse("limpieza_empleado.html", {"request": request})


@router.get("/empleado/limpieza/nuevo", response_class=HTMLResponse)
async def form_servicio_limpieza(request: Request):
    return templates.TemplateResponse("servicio_limpieza_form_empleado.html", {"request": request})


@router.post("/empleado/limpieza/nuevo")
async def crear_servicio_limpieza(
    request: Request,
    fecha_servicio: str = Form(...),
    numero_bano: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    nombre_cliente: str = Form(...),
    direccion: str | None = Form(None),
    razon_social: str | None = Form(None),
    tipo_servicio: str = Form(...),
    observaciones: str | None = Form(None),
    remito: UploadFile = File(...),
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    datos_form = {
        "fecha_servicio": fecha_servicio,
        "numero_bano": numero_bano,
        "dni_cuit_cuil": dni_cuit_cuil,
        "nombre_cliente": nombre_cliente,
        "direccion": direccion,
        "razon_social": razon_social,
        "tipo_servicio": tipo_servicio,
        "observaciones": observaciones,
    }

    try:
        servicio = ServicioLimpiezaNuevo(**datos_form)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    imagen_bytes = await remito.read()
    mime = obtener_tipo_archivo(imagen_bytes)
    if mime not in {"application/pdf", "image/png", "image/jpeg"}:
        raise HTTPException(status_code=400, detail="Formato no permitido")
    if mime == "application/pdf":
        pdf_bytes = imagen_bytes
    else:
        extension = ".png" if mime == "image/png" else ".jpg"
        pdf_bytes = imagen_a_pdf(imagen_bytes, extension)

    fecha_archivo = date.today().strftime("%Y%m%d%H%M%S")
    nombre_pdf = f"remito_{numero_bano}_{fecha_archivo}.pdf"

    bucket = supabase.storage.from_(bucket_servicios)
    try:
        bucket.upload(nombre_pdf, pdf_bytes, {"content-type": "application/pdf"})
        url = bucket.get_public_url(nombre_pdf)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    datos_insert = servicio.model_dump()
    datos_insert["fecha_servicio"] = servicio.fecha_servicio.isoformat()
    datos_insert["remito_url"] = url

    try:
        res = supabase.table(tabla_servicios).insert(datos_insert).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if request.headers.get("content-type", "").startswith("application/json"):
        return {"ok": True, "url": url}

    return RedirectResponse("/empleado/limpieza", status_code=303)


@router.get("/empleado/api/servicios_limpieza")
async def listar_servicios_limpieza():
    if not supabase:
        return []
    try:
        result = supabase.table(tabla_servicios).select("*").execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if getattr(result, "error", None):
        raise HTTPException(status_code=500, detail=f"Error en consulta: {result.error.message}")

    datos = getattr(result, "data", None) or []
    normalizados = []
    for d in datos:
        normalizados.append({
            "id_servicio": d.get("id_servicio") or d.get("id"),
            "fecha_servicio": d.get("fecha_servicio"),
            "numero_bano": d.get("numero_bano"),
            "dni_cuit_cuil": d.get("dni_cuit_cuil"),
            "nombre_cliente": d.get("nombre_cliente"),
            "razon_social": d.get("razon_social"),
            "direccion": d.get("direccion"),
            "tipo_servicio": d.get("tipo_servicio"),
            "remito_url": d.get("remito_url"),
            "observaciones": d.get("observaciones"),
        })
    return normalizados


@router.post("/empleado/api/servicios_limpieza/eliminar")
async def eliminar_servicios_empleado(payload: _IdLista):
    """Elimina servicios de limpieza por ID desde el panel de empleados."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        supabase.table(tabla_servicios).delete().in_("id_servicio", payload.ids).execute()
    except Exception as exc:
        logger.exception("Error eliminando servicios:")
        raise HTTPException(status_code=500, detail=str(exc))
    return {"ok": True}


# ------------------ Inventario de baños -----------------

@router.get("/empleado/inventario_banos", response_class=HTMLResponse)
def ver_inventario_empleado(request: Request):
    """Vista del inventario de baños para empleados."""
    return templates.TemplateResponse("inventario_banos_empleado.html", {"request": request})


@router.get("/empleado/api/inventario_banos")
async def listar_inventario_empleado():
    if not supabase:
        return []
    try:
        res = supabase.table("inventario_banos").select("*").execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ------------------ Alquileres -----------------

@router.get("/empleado/alquileres", response_class=HTMLResponse)
def ver_alquileres_empleado(request: Request):
    """Vista de alquileres en modo lectura para empleados."""
    return templates.TemplateResponse("alquileres_empleado.html", {"request": request})


@router.get("/empleado/api/alquileres")
async def listar_alquileres_empleado():
    if not supabase:
        return []
    try:
        result = supabase.table("alquileres").select("*").execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error de conexión: {exc}")

    if getattr(result, "error", None):
        raise HTTPException(status_code=500, detail=f"Error en consulta: {result.error.message}")

    data = getattr(result, "data", None) or []
    normalizados = []
    for item in data:
        normalizados.append(
            {
                "numero_bano": item.get("numero_bano"),
                "cliente_nombre": item.get("cliente_nombre") or item.get("cliente"),
                "razon_social": item.get("razon_social"),
                "dni_cuit_cuil": item.get("dni_cuit_cuil"),
                "direccion": item.get("direccion"),
                "fecha_inicio": item.get("fecha_inicio") or item.get("inicio_contrato"),
                "fecha_fin": item.get("fecha_fin") or item.get("fin_contrato"),
                "observaciones": item.get("observaciones"),
            }
        )
    return normalizados
