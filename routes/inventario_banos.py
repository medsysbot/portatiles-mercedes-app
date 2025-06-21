"""
----------------------------------------------------------
Archivo: routes/inventario_banos.py
Descripción: Rutas para el inventario de baños
Acceso: Privado
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from supabase import create_client, Client
import os

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

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
    return TEMPLATES.TemplateResponse(
        "inventario_banos_admin.html", {"request": request}
    )


@router.get("/inventario_bano_form", response_class=HTMLResponse)
async def inventario_form(request: Request):
    """Formulario modal de alta de baño."""
    return TEMPLATES.TemplateResponse("inventario_bano_form.html", {"request": request})


@router.get("/admin/api/inventario_banos")
async def listar_banos():
    if not supabase:
        return []
    try:
        res = supabase.table(TABLA).select("*").execute()
        if res.error:
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/admin/inventario_banos/nuevo")
async def crear_bano(bano: BanoNuevo):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    datos = bano.model_dump()
    try:
        result = supabase.table(TABLA).insert(datos).execute()
        if getattr(result, "error", None):
            raise Exception(result.error.message)
    except Exception as exc:  # pragma: no cover
        return {"error": f"Error al guardar baño: {exc}"}
    return {"ok": True}
