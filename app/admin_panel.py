"""Endpoints para el panel administrativo de la empresa."""

from datetime import date
import os

from fastapi import APIRouter, HTTPException, Query
from itsdangerous import BadSignature
from supabase import create_client, Client

from .auth import serializer

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


def verificar_admin(token: str) -> dict:
    """Devuelve la info del token si es válido y de rol empresa."""
    try:
        datos = serializer.loads(token)
        if datos.get("rol") != "empresa":
            raise HTTPException(status_code=401, detail="No autorizado")
        return datos
    except BadSignature as exc:
        raise HTTPException(status_code=401, detail="Token inválido") from exc


@router.get("/admin/clientes")
async def admin_clientes(
    token: str = Query(...),
    dni: str | None = Query(None),
):
    """Lista de clientes con filtro opcional por DNI."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    verificar_admin(token)
    consulta = supabase.table("clientes").select("*")
    if dni:
        consulta = consulta.eq("dni", dni)
    resp = consulta.execute()
    if resp.error:
        raise HTTPException(status_code=400, detail=str(resp.error))
    return resp.data


@router.get("/admin/alquileres")
async def admin_alquileres(
    token: str = Query(...),
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    dni: str | None = Query(None),
):
    """Alquileres con filtros por fecha y cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    verificar_admin(token)
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
    token: str = Query(...),
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    cliente: str | None = Query(None),
):
    """Ventas realizadas con filtros por fecha y nombre de cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    verificar_admin(token)
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
    token: str = Query(...),
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    dni: str | None = Query(None),
):
    """Limpiezas registradas con filtros por fecha y cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    verificar_admin(token)
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
