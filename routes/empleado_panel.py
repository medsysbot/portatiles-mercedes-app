"""
----------------------------------------------------------
Archivo: routes/empleado_panel.py
Descripción: Endpoints para el panel de empleados
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from datetime import date
from fastapi import APIRouter, HTTPException, Request, Form, File, UploadFile
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
    dni_cliente: str
    nombre_cliente: str
    tipo_servicio: str
    observaciones: str | None = None


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
    dni_cliente: str = Form(...),
    nombre_cliente: str = Form(...),
    tipo_servicio: str = Form(...),
    observaciones: str | None = Form(None),
    remito: UploadFile = File(...),
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    datos_form = {
        "fecha_servicio": fecha_servicio,
        "numero_bano": numero_bano,
        "dni_cliente": dni_cliente,
        "nombre_cliente": nombre_cliente,
        "tipo_servicio": tipo_servicio,
        "observaciones": observaciones,
    }

    try:
        servicio = ServicioLimpiezaNuevo(**datos_form)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    imagen_bytes = await remito.read()
    extension = Path(remito.filename).suffix.lower() or ".jpg"
    from fpdf import FPDF
    import tempfile

    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
        tmp.write(imagen_bytes)
        tmp.flush()
        imagen_path = tmp.name

    pdf = FPDF()
    pdf.add_page()
    pdf.image(imagen_path, x=10, y=10, w=190)
    pdf_bytes = pdf.output(dest="S").encode("latin1")
    os.unlink(imagen_path)

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
            "fecha_servicio": d.get("fecha_servicio"),
            "numero_bano": d.get("numero_bano"),
            "dni_cliente": d.get("dni_cliente"),
            "nombre_cliente": d.get("nombre_cliente"),
            "tipo_servicio": d.get("tipo_servicio"),
            "remito_url": d.get("remito_url"),
            "observaciones": d.get("observaciones"),
        })
    return normalizados
