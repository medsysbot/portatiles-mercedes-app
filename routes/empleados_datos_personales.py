# ----------------------------------------------------------
# Archivo: routes/empleados_datos_personales.py
# Descripción: CRUD de datos personales de empleados
# Proyecto: Portátiles Mercedes
# ----------------------------------------------------------

from datetime import date
import os
import tempfile
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, Form, File, UploadFile, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, ValidationError
from supabase import create_client, Client
from fpdf import FPDF
from utils.file_utils import obtener_tipo_archivo, imagen_a_pdf

from utils.auth_utils import auth_required

router = APIRouter()
TEMPLATES = Jinja2Templates(directory="templates")
TEMPLATES.env.globals["gmail_user"] = os.getenv("EMAIL_ORIGEN")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
logger = logging.getLogger("empleados_datos_personales")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(
        os.path.join(LOG_DIR, "empleados_datos_personales.log"),
        mode="a",
        encoding="utf-8",
    )
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

TABLA = "empleados_datos_personales"
BUCKET = "empleados-datos-personales"


class DatosEmpleado(BaseModel):
    nombre_empleado: str
    dni_cuit_cuil: str
    email: str
    fecha_ingreso: date


@router.get("/admin/empleados_datos_personales", response_class=HTMLResponse)
async def empleados_datos_personales_admin(
    request: Request, usuario=Depends(auth_required)
):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse(
        "empleados_datos_personales_admin.html", {"request": request}
    )


@router.get("/admin/empleados_datos_personales/nuevo", response_class=HTMLResponse)
async def form_nuevo_dato(request: Request, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse(
        "empleados_datos_personales_form.html", {"request": request}
    )


@router.get("/empleado/datos_personales", response_class=HTMLResponse)
async def empleados_datos_personales_empleado(
    request: Request, usuario=Depends(auth_required)
):
    if usuario.get("rol") not in ("empleado", "Administrador"):
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse(
        "empleados_datos_personales_empleado.html", {"request": request}
    )


@router.get("/admin/api/empleados_datos_personales")
async def listar_datos_personales(usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        return []
    res = supabase.table(TABLA).select("*").execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=500, detail=str(res.error))
    return res.data or []


@router.get("/empleado/api/datos_personales")
async def listar_datos_personales_empleado(usuario=Depends(auth_required)):
    if not supabase:
        return []
    email = usuario.get("sub")
    res = supabase.table(TABLA).select("*").eq("email", email).execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=500, detail=str(res.error))
    return res.data or []


@router.post("/admin/empleados_datos_personales/nuevo")
async def crear_dato_personal(
    nombre_empleado: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    email: str = Form(...),
    fecha_ingreso: str = Form(...),
    documento: UploadFile = File(...),
    usuario=Depends(auth_required),
):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    try:
        fecha_dt = date.fromisoformat(fecha_ingreso)
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha inválida (formato esperado: YYYY-MM-DD)")

    datos_form = {
        "nombre_empleado": nombre_empleado,
        "dni_cuit_cuil": dni_cuit_cuil,
        "email": email,
        "fecha_ingreso": fecha_dt,
    }

    try:
        DatosEmpleado(**datos_form)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    contenido = await documento.read()
    mime = obtener_tipo_archivo(contenido)
    if mime not in {"application/pdf", "image/png", "image/jpeg"}:
        raise HTTPException(status_code=400, detail="Formato no permitido")
    if mime == "application/pdf":
        pdf_bytes = contenido
    else:
        extension = ".png" if mime == "image/png" else ".jpg"
        pdf_bytes = imagen_a_pdf(contenido, extension)

    fecha_arch = date.today().strftime("%Y%m%d%H%M%S")
    nombre_pdf = f"doc_{dni_cuit_cuil}_{fecha_arch}.pdf"
    bucket = supabase.storage.from_(BUCKET)
    try:
        bucket.upload(nombre_pdf, pdf_bytes, {"content-type": "application/pdf"})
        url = bucket.get_public_url(nombre_pdf)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    datos_insert = datos_form.copy()
    datos_insert["fecha_ingreso"] = fecha_dt.isoformat()
    datos_insert["documento_pdf_url"] = url

    res = supabase.table(TABLA).insert(datos_insert).execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=500, detail=str(res.error))
    return {"ok": True, "url": url}


class _IdLista(BaseModel):
    ids: list[int]


@router.post("/admin/api/empleados_datos_personales/eliminar")
async def eliminar_datos(payload: _IdLista, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        supabase.table(TABLA).delete().in_("id", payload.ids).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"ok": True}
