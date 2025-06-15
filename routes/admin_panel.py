"""Endpoints para el panel administrativo de la empresa."""

from datetime import date
import os

from fastapi import APIRouter, HTTPException, Query, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from utils.auth_utils import auth_required
from supabase import create_client, Client


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(
        "Advertencia: SUPABASE_URL y SUPABASE_KEY no estan configurados. "
        "La conexión a Supabase estará deshabilitada."
    )
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()
templates = Jinja2Templates(directory="app_publico/templates")


def verificar_admin(user: dict) -> dict:
    """Valida que el usuario autenticado sea de rol Administrador."""
    if user.get("rol") != "Administrador":
        raise HTTPException(status_code=401, detail="No autorizado")
    return user


@router.get("/admin_panel", response_class=HTMLResponse)
def admin_panel_view(request: Request):
    return templates.TemplateResponse("admin_panel.html", {"request": request})


@router.get("/cliente_panel")
def cliente_panel(user=Depends(auth_required)):
    if user["rol"] != "cliente":
        raise HTTPException(status_code=403, detail="Acceso solo para clientes")
    return {"msg": f"Bienvenido {user['email']}, rol: {user['rol']}"}


@router.get("/admin/clientes")
async def admin_clientes(
    dni: str | None = Query(None),
    user: dict = Depends(auth_required),
):
    """Lista de clientes con filtro opcional por DNI."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    verificar_admin(user)
    consulta = supabase.table("clientes").select("*")
    if dni:
        consulta = consulta.eq("dni", dni)
    resp = consulta.execute()
    if resp.error:
        raise HTTPException(status_code=400, detail=str(resp.error))
    return resp.data


@router.get("/admin/alquileres")
async def admin_alquileres(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    dni: str | None = Query(None),
    user: dict = Depends(auth_required),
):
    """Alquileres con filtros por fecha y cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    verificar_admin(user)
    consulta = supabase.table("alquileres").select("*")
    if dni:
        consulta = consulta.eq("dni_cliente", dni)
    if desde:
        consulta = consulta.gte("fecha_inicio", desde.isoformat())
    if hasta:
        consulta = consulta.lte("fecha_fin", hasta.isoformat())
    resp = consulta.execute()
    if resp.error:
        raise HTTPException(status_code=400, detail=str(resp.error))
    return resp.data


@router.get("/admin/ventas")
async def admin_ventas(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    cliente: str | None = Query(None),
    user: dict = Depends(auth_required),
):
    """Ventas realizadas con filtros por fecha y nombre de cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    verificar_admin(user)
    consulta = supabase.table("ventas").select("*")
    if cliente:
        consulta = consulta.ilike("cliente_nombre", f"%{cliente}%")
    if desde:
        consulta = consulta.gte("created_at", desde.isoformat())
    if hasta:
        consulta = consulta.lte("created_at", hasta.isoformat())
    resp = consulta.execute()
    if resp.error:
        raise HTTPException(status_code=400, detail=str(resp.error))
    return resp.data


@router.get("/admin/limpiezas")
async def admin_limpiezas(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    dni: str | None = Query(None),
    user: dict = Depends(auth_required),
):
    """Limpiezas registradas con filtros por fecha y cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    verificar_admin(user)
    consulta = supabase.table("limpiezas").select("*")
    if dni:
        consulta = consulta.eq("dni_cliente", dni)
    if desde:
        consulta = consulta.gte("fecha_hora", desde.isoformat())
    if hasta:
        consulta = consulta.lte("fecha_hora", hasta.isoformat())
    resp = consulta.execute()
    if resp.error:
        raise HTTPException(status_code=400, detail=str(resp.error))
    return resp.data
