"""
----------------------------------------------------------
Archivo: routes/empleados_ausencias.py
Descripción: CRUD de ausencias de empleados
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

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

from utils.auth_utils import auth_required

router = APIRouter()
TEMPLATES = Jinja2Templates(directory="templates")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
logger = logging.getLogger("empleados_ausencias")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(os.path.join(LOG_DIR, "empleados_ausencias.log"), mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

TABLA = "empleados_ausencias"
BUCKET = "empleados-ausencias"


class AusenciaEmpleado(BaseModel):
    nombre_empleado: str
    dni_cuit_cuil: str
    tipo_ausencia: str
    fecha_inicio: date
    fecha_fin: date


@router.get("/admin/empleados_ausencias", response_class=HTMLResponse)
async def ausencias_admin(request: Request, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse("empleados_ausencias_admin.html", {"request": request})


@router.get("/admin/empleados_ausencias/nuevo", response_class=HTMLResponse)
async def form_nueva_ausencia(request: Request, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse("empleados_ausencias_form.html", {"request": request})


@router.get("/empleado/empleados_ausencias", response_class=HTMLResponse)
async def ausencias_empleado(request: Request, usuario=Depends(auth_required)):
    if usuario.get("rol") not in ("empleado", "Administrador"):
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse("empleados_ausencias_empleado.html", {"request": request})


@router.get("/admin/api/empleados_ausencias")
async def listar_ausencias(usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        return []
    res = supabase.table(TABLA).select("*").execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=500, detail=str(res.error))
    return res.data or []


@router.get("/empleado/api/empleados_ausencias")
async def listar_ausencias_empleado(usuario=Depends(auth_required)):
    if not supabase:
        return []
    email = usuario.get("sub")
    dni_res = (
        supabase.table("empleados_datos_personales")
        .select("dni_cuit_cuil")
        .eq("email", email)
        .single()
        .execute()
    )
    if getattr(dni_res, "error", None):
        raise HTTPException(status_code=500, detail=str(dni_res.error))
    dni = dni_res.data.get("dni_cuit_cuil") if dni_res.data else None
    if not dni:
        return []
    res = supabase.table(TABLA).select("*").eq("dni_cuit_cuil", dni).execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=500, detail=str(res.error))
    return res.data or []


@router.post("/admin/empleados_ausencias/nuevo")
async def crear_ausencia(
    nombre_empleado: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    tipo_ausencia: str = Form(...),
    fecha_inicio: date = Form(...),
    fecha_fin: date = Form(...),
    certificado: UploadFile = File(...),
    usuario=Depends(auth_required),
):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    datos_form = {
        "nombre_empleado": nombre_empleado,
        "dni_cuit_cuil": dni_cuit_cuil,
        "tipo_ausencia": tipo_ausencia,
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
    }
    try:
        AusenciaEmpleado(**datos_form)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    contenido = await certificado.read()
    extension = Path(certificado.filename).suffix.lower()
    if extension != ".pdf":
        with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
            tmp.write(contenido)
            tmp.flush()
            imagen_path = tmp.name
        pdf = FPDF()
        pdf.add_page()
        pdf.image(imagen_path, x=10, y=10, w=190)
        pdf_bytes = pdf.output(dest="S").encode("latin1")
        os.unlink(imagen_path)
    else:
        pdf_bytes = contenido

    fecha_arch = date.today().strftime("%Y%m%d%H%M%S")
    nombre_pdf = f"certificado_{dni_cuit_cuil}_{fecha_arch}.pdf"
    bucket = supabase.storage.from_(BUCKET)
    try:
        bucket.upload(nombre_pdf, pdf_bytes, {"content-type": "application/pdf"})
        url = bucket.get_public_url(nombre_pdf)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    datos_insert = datos_form.copy()
    datos_insert["fecha_inicio"] = fecha_inicio.isoformat()
    datos_insert["fecha_fin"] = fecha_fin.isoformat()
    datos_insert["certificado_medico_pdf_url"] = url

    try:
        res = supabase.table(TABLA).insert(datos_insert).execute()
    except Exception as exc:  # pragma: no cover - errores de conexión
        logger.error("Error insertando ausencia en %s: %s", TABLA, exc)
        raise HTTPException(status_code=500, detail=str(exc))

    if (
        getattr(res, "error", None) is not None
        or not getattr(res, "data", None)
        or (hasattr(res, "status_code") and res.status_code >= 300)
    ):
        logger.error(
            "Fallo al insertar ausencia en Supabase: %s",
            getattr(res, "error", "sin datos"),
        )
        raise HTTPException(
            status_code=500,
            detail=str(getattr(res, "error", "Error en Supabase")),
        )

    logger.info("Ausencia registrada correctamente para %s", nombre_empleado)
    return {"ok": True, "url": url}


class _IdLista(BaseModel):
    ids: list[int]


@router.post("/admin/api/empleados_ausencias/eliminar")
async def eliminar_ausencias(payload: _IdLista, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        supabase.table(TABLA).delete().in_("id", payload.ids).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"ok": True}
