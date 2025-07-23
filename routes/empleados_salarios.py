"""
----------------------------------------------------------
Archivo: routes/empleados_salarios.py
Descripción: CRUD de salarios de empleados
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from datetime import date, datetime
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
logger = logging.getLogger("empleados_salarios")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(os.path.join(LOG_DIR, "empleados_salarios.log"), mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

TABLA = "empleados_salarios"
BUCKET = "empleados-salarios"


class SalarioEmpleado(BaseModel):
    nombre_empleado: str
    dni_cuit_cuil: str
    salario: float
    anticipo_pedido: float
    saldo_a_pagar: float


@router.get("/admin/empleados_salarios", response_class=HTMLResponse)
async def salarios_admin(request: Request, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse("empleados_salarios_admin.html", {"request": request})


@router.get("/admin/empleados_salarios/nuevo", response_class=HTMLResponse)
async def form_nuevo_salario(request: Request, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse("empleados_salarios_form.html", {"request": request})


@router.get("/empleado/empleados_salarios", response_class=HTMLResponse)
async def salarios_empleado(request: Request, usuario=Depends(auth_required)):
    if usuario.get("rol") not in ("empleado", "Administrador"):
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse("empleados_salarios_empleado.html", {"request": request})


@router.get("/admin/api/empleados_salarios")
async def listar_salarios(usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        return []
    res = supabase.table(TABLA).select("*").execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=500, detail=str(res.error))
    return res.data or []


@router.get("/empleado/api/empleados_salarios")
async def listar_salarios_empleado(usuario=Depends(auth_required)):
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


@router.post("/admin/empleados_salarios/nuevo")
async def crear_salario(
    nombre_empleado: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    salario: float = Form(...),
    anticipo_pedido: float = Form(...),
    saldo_a_pagar: float = Form(...),
    recibo: UploadFile = File(...),
    usuario=Depends(auth_required),
):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    datos_form = {
        "nombre_empleado": nombre_empleado,
        "dni_cuit_cuil": dni_cuit_cuil,
        "salario": salario,
        "anticipo_pedido": anticipo_pedido,
        "saldo_a_pagar": saldo_a_pagar,
    }
    try:
        SalarioEmpleado(**datos_form)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    contenido = await recibo.read()
    mime = obtener_tipo_archivo(contenido)
    if mime not in {"application/pdf", "image/png", "image/jpeg"}:
        raise HTTPException(status_code=400, detail="Formato no permitido")
    if mime == "application/pdf":
        pdf_bytes = contenido
    else:
        extension = ".png" if mime == "image/png" else ".jpg"
        pdf_bytes = imagen_a_pdf(contenido, extension)

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    nombre_pdf = f"recibo_{dni_cuit_cuil}_{timestamp}.pdf"
    bucket = supabase.storage.from_(BUCKET)
    try:
        bucket.upload(
            nombre_pdf,
            pdf_bytes,
            {"content-type": "application/pdf", "x-upsert": "true"},
        )
        url = bucket.get_public_url(nombre_pdf)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    datos_insert = datos_form.copy()
    datos_insert["recibo_sueldo_pdf_url"] = url

    try:
        res = supabase.table(TABLA).insert(datos_insert).execute()
    except Exception as exc:  # pragma: no cover - debug supabase errors
        logger.error("Error insertando salario en %s: %s", TABLA, exc)
        raise HTTPException(status_code=500, detail=str(exc))

    if (
        getattr(res, "error", None) is not None
        or not getattr(res, "data", None)
        or (hasattr(res, "status_code") and res.status_code >= 300)
    ):
        logger.error(
            "Fallo al insertar salario en Supabase: %s", getattr(res, "error", "sin datos")
        )
        raise HTTPException(
            status_code=500,
            detail=str(getattr(res, "error", "Error en Supabase")),
        )

    logger.info("Salario registrado correctamente para %s", nombre_empleado)
    return {"ok": True, "url": url}


class _IdLista(BaseModel):
    ids: list[int]


@router.post("/admin/api/empleados_salarios/eliminar")
async def eliminar_salarios(payload: _IdLista, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        supabase.table(TABLA).delete().in_("id", payload.ids).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"ok": True}
