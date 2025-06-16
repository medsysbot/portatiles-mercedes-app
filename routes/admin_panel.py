"""
----------------------------------------------------------
Archivo: routes/admin_panel.py
Descripción: Endpoints para el panel administrativo de la empresa
Última modificación: 2025-06-15
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

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
# Las plantillas privadas ahora se ubican en la carpeta `templates` de la raíz
# del proyecto. Por eso actualizamos la ruta que usa Jinja2Templates.
templates = Jinja2Templates(directory="templates")


def verificar_admin(user: dict) -> dict:
    """Valida que el usuario autenticado sea de rol Administrador."""
    if user.get("rol") != "Administrador":
        raise HTTPException(status_code=401, detail="No autorizado")
    return user


# Vista principal de reportes
@router.get("/admin/reportes", response_class=HTMLResponse)
def admin_reportes_view(request: Request):
    """Pantalla inicial con resumen de reportes"""
    return templates.TemplateResponse("reportes_admin.html", {"request": request})


@router.get("/admin/mercadopago", response_class=HTMLResponse)
def admin_mercadopago_view(request: Request):
    """Panel para pagos y cobranzas."""
    return templates.TemplateResponse("mercadopago_admin.html", {"request": request})


@router.get("/admin/facturacion", response_class=HTMLResponse)
def admin_facturacion_view(request: Request):
    """Pantalla de facturación"""
    return templates.TemplateResponse("facturacion_admin.html", {"request": request})




@router.get("/admin/bash-generator", response_class=HTMLResponse)
def admin_bash_generator_view(request: Request):
    """Pantalla para generación de scripts bash"""
    return templates.TemplateResponse("bash_generator_admin.html", {"request": request})

# Secciones del panel
@router.get("/admin/clientes", response_class=HTMLResponse)
def admin_clientes_page(request: Request):
    """Administración de clientes."""
    return templates.TemplateResponse("clientes_admin.html", {"request": request})

@router.get("/admin/alquileres", response_class=HTMLResponse)
def admin_alquileres_page(request: Request):
    """Gestión de alquileres."""
    return templates.TemplateResponse("alquileres_admin.html", {"request": request})

@router.get("/admin/ventas", response_class=HTMLResponse)
def admin_ventas_page(request: Request):
    """Gestión de ventas."""
    return templates.TemplateResponse("ventas_admin.html", {"request": request})

@router.get("/admin/limpiezas", response_class=HTMLResponse)
def admin_limpiezas_page(request: Request):
    """Registro de limpiezas."""
    return templates.TemplateResponse("limpiezas_admin.html", {"request": request})

@router.get("/admin/morosos", response_class=HTMLResponse)
def admin_morosos_page(request: Request):
    """Listado de clientes morosos."""
    return templates.TemplateResponse("morosos_admin.html", {"request": request})

@router.get("/admin/emails", response_class=HTMLResponse)
def admin_emails_page(request: Request):
    """Módulo de envíos de emails."""
    return templates.TemplateResponse("emails_admin.html", {"request": request})

@router.get("/admin/ia-respuestas", response_class=HTMLResponse)
def admin_ia_respuestas_page(request: Request):
    """Respuestas automáticas con IA."""
    return templates.TemplateResponse("ia_respuestas_admin.html", {"request": request})


@router.get("/cliente_panel")
def cliente_panel(user=Depends(auth_required)):
    if user["rol"] != "cliente":
        raise HTTPException(status_code=403, detail="Acceso solo para clientes")
    return {"msg": f"Bienvenido {user['email']}, rol: {user['rol']}"}


@router.get("/admin/api/clientes")
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
    if (
        not resp.data
        or (hasattr(resp, "status_code") and resp.status_code != 200)
        or getattr(resp, "error", None) is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=str(getattr(resp, "error", "Error en Supabase")),
        )
    return resp.data


@router.get("/admin/api/alquileres")
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
    if (
        not resp.data
        or (hasattr(resp, "status_code") and resp.status_code != 200)
        or getattr(resp, "error", None) is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=str(getattr(resp, "error", "Error en Supabase")),
        )
    return resp.data


@router.get("/admin/api/ventas")
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
    if (
        not resp.data
        or (hasattr(resp, "status_code") and resp.status_code != 200)
        or getattr(resp, "error", None) is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=str(getattr(resp, "error", "Error en Supabase")),
        )
    return resp.data


@router.get("/admin/api/limpiezas")
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
    if (
        not resp.data
        or (hasattr(resp, "status_code") and resp.status_code != 200)
        or getattr(resp, "error", None) is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=str(getattr(resp, "error", "Error en Supabase")),
        )
    return resp.data
