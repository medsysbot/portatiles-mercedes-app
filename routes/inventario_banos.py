"""
----------------------------------------------------------
Archivo: routes/inventario_banos.py
Descripción: Rutas para el inventario de baños
Acceso: Privado
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, ValidationError
from supabase import create_client, Client
from postgrest.exceptions import APIError
import logging
import os

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "inventario_banos.log")
logger = logging.getLogger("inventario_banos")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

TEMPLATES = Jinja2Templates(directory="templates")

TABLA = "inventario_banos"


class BanoNuevo(BaseModel):
    numero_bano: str
    condicion: str
    ultima_reparacion: str | None = None
    ultimo_mantenimiento: str | None = None
    estado: str
    observaciones: str | None = None


@router.get("/admin/inventario", response_class=HTMLResponse)
async def inventario_admin(request: Request):
    """Vista principal del inventario de baños."""
    logger.info("Vista inventario de baños solicitada")
    return TEMPLATES.TemplateResponse(
        "inventario_banos_admin.html", {"request": request}
    )


@router.get("/admin/inventario_banos/nuevo", response_class=HTMLResponse)
async def form_nuevo_bano(request: Request):
    """Muestra el formulario de alta de baño como página completa."""
    logger.info("Vista de nuevo baño solicitada")
    return TEMPLATES.TemplateResponse("inventario_banos_form.html", {"request": request})
@router.post("/admin/inventario_bano/nuevo")

@router.get("/admin/api/inventario_banos")
async def listar_banos():
    logger.info("Listado de baños solicitado")
    if not supabase:
        logger.warning("Supabase no configurado al listar baños")
        return []
    try:
        res = supabase.table(TABLA).select("*").execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:  # pragma: no cover
        logger.exception("Error consultando baños:")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/admin/inventario_banos/nuevo")
async def crear_bano(request: Request):
    if not supabase:
        logger.error("Supabase no configurado al crear baño")
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    if request.headers.get("content-type", "").startswith("application/json"):
        datos_req = await request.json()
    else:
        form = await request.form()
        datos_req = dict(form)
    logger.info("Crear baño datos recibidos: %s", datos_req)

    try:
        bano = BanoNuevo(**datos_req)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        existente = (
            supabase.table(TABLA)
            .select("numero_bano")
            .eq("numero_bano", bano.numero_bano)
            .maybe_single()
            .execute()
        )
    except APIError as exc:
        if exc.code == "204":
            existente = None
        else:
            raise HTTPException(status_code=500, detail=f"Error consultando datos: {exc}")
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"Error consultando datos: {exc}")

    if getattr(existente, "data", None):
        return {"error": "Ya existe un baño con ese número"}

    datos = bano.model_dump()
    try:
        result = supabase.table(TABLA).insert(datos).execute()
        if getattr(result, "error", None):
            raise Exception(result.error.message)
    except Exception as exc:  # pragma: no cover
        return {"error": f"Error al guardar baño: {exc}"}
    logger.info("Baño creado exitosamente")
    return {"ok": True}
