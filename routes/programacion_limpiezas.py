"""
----------------------------------------------------------
Archivo: routes/programacion_limpiezas.py
Descripción: Endpoints para programar limpiezas de baños
Acceso: Privado
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from datetime import date
import logging
import os

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, ValidationError
from supabase import create_client, Client

from utils.auth_utils import auth_required

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "programacion_limpiezas.log")
logger = logging.getLogger("programacion_limpiezas")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

TABLA = "programacion_limpiezas"

TEMPLATES = Jinja2Templates(directory="templates")


class LimpiezaProgramada(BaseModel):
    fecha_limpieza: date
    hora_aprox: str
    numero_bano: str
    nombre_cliente: str
    dni_cuit_cuil: str
    direccion: str


class IdsPayload(BaseModel):
    ids: list[int]


@router.get("/admin/programacion_limpiezas/view", response_class=HTMLResponse)
async def vista_admin(request: Request, usuario=Depends(auth_required)):
    """Vista con formulario y tabla para administración."""
    if usuario.get("rol", "").lower() != "administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse(
        "programacion_limpiezas_admin.html", {"request": request}
    )


@router.get("/empleado/programacion_limpiezas/view", response_class=HTMLResponse)
async def vista_empleado(request: Request, usuario=Depends(auth_required)):
    if usuario.get("rol", "").lower() != "empleado":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse(
        "programacion_limpiezas_empleado.html", {"request": request}
    )


@router.get("/cliente/programacion_limpiezas/view", response_class=HTMLResponse)
async def vista_cliente(request: Request, usuario=Depends(auth_required)):
    if usuario.get("rol", "").lower() != "cliente":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse(
        "programacion_limpiezas_cliente.html", {"request": request}
    )


@router.get("/admin/api/limpiezas_programadas")
async def listar_programacion_admin(usuario=Depends(auth_required)):
    """Listado completo de limpiezas programadas."""
    if usuario.get("rol", "").lower() != "administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        res = (
            supabase.table(TABLA)
            .select("*")
            .order("fecha_limpieza")
            .order("nombre_cliente")
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:  # pragma: no cover - fallos externos
        logger.error("Error listando programaciones: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/admin/api/limpiezas_programadas/agregar")
async def crear_programacion(
    datos: LimpiezaProgramada, usuario=Depends(auth_required)
):
    """Registra una nueva limpieza programada."""
    if usuario.get("rol", "").lower() != "administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        registro = datos.model_dump()
        registro["fecha_limpieza"] = datos.fecha_limpieza.isoformat()
        supabase.table(TABLA).insert(registro).execute()
        return {"ok": True}
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Error creando programacion: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/admin/api/limpiezas_programadas/eliminar")
async def eliminar_programaciones(
    payload: IdsPayload, usuario=Depends(auth_required)
):
    """Elimina limpiezas programadas por ID."""
    if usuario.get("rol", "").lower() != "administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        supabase.table(TABLA).delete().in_("id", payload.ids).execute()
        return {"ok": True}
    except Exception as exc:  # pragma: no cover
        logger.error("Error eliminando programaciones: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/cliente/api/limpiezas_programadas")
async def programacion_cliente(usuario=Depends(auth_required)):
    """Limpiezas programadas del cliente autenticado."""
    if usuario.get("rol", "").lower() != "cliente":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    dni = usuario.get("dni_cuit_cuil")
    email = usuario.get("sub")
    if not dni and email:
        try:
            resp = (
                supabase.table("datos_personales_clientes")
                .select("dni_cuit_cuil")
                .eq("email", email)
                .single()
                .execute()
            )
            if getattr(resp, "error", None):
                raise Exception(resp.error.message)
            dni = resp.data.get("dni_cuit_cuil") if resp.data else None
        except Exception as exc:  # pragma: no cover
            logger.error("Error obteniendo DNI cliente: %s", exc)
            raise HTTPException(status_code=500, detail="Error consultando datos")
    if not dni:
        return []
    try:
        res = (
            supabase.table(TABLA)
            .select("fecha_limpieza,hora_aprox,numero_bano,direccion")
            .eq("dni_cuit_cuil", dni)
            .order("fecha_limpieza")
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:  # pragma: no cover
        logger.error("Error listando programaciones cliente: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/empleado/api/limpiezas_programadas")
async def programacion_empleado(usuario=Depends(auth_required)):
    """Lista de limpiezas programadas para empleados."""
    if usuario.get("rol", "").lower() != "empleado":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        res = (
            supabase.table(TABLA)
            .select("*")
            .order("fecha_limpieza")
            .order("nombre_cliente")
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:  # pragma: no cover
        logger.error("Error listando programaciones empleado: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
