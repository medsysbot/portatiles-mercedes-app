"""Rutas para consultar la información del panel de clientes."""

import os
from fastapi import APIRouter, HTTPException, Query, Depends
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


@router.get("/cliente_panel")
def cliente_panel(user=Depends(auth_required)):
    if user["rol"] != "cliente":
        raise HTTPException(status_code=403, detail="Acceso solo para clientes")
    return {"msg": f"Bienvenido {user['email']}, rol: {user['rol']}"}


@router.get("/info_cliente")
async def info_cliente(dni: str = Query(...), user: dict = Depends(auth_required)):
    """Devuelve nombre y fecha de nacimiento del cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        resp = (
            supabase.table("clientes")
            .select("nombre,fecha_nacimiento")
            .eq("dni", dni)
            .single()
            .execute()
        )
        if resp.error:
            raise HTTPException(status_code=400, detail=str(resp.error))
        return resp.data
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/alquileres_cliente")
async def obtener_alquileres(dni: str = Query(...), user: dict = Depends(auth_required)):
    """Devuelve los alquileres asociados al cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        resp = (
            supabase.table("alquileres")
            .select("tipo_banio, ubicacion, fecha_inicio, fecha_fin")
            .eq("dni_cliente", dni)
            .execute()
        )
        if resp.error:
            raise HTTPException(status_code=400, detail=str(resp.error))
        return resp.data
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/pagos_cliente")
async def obtener_pagos(dni: str = Query(...), user: dict = Depends(auth_required)):
    """Devuelve los pagos realizados por el cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        resp = (
            supabase.table("pagos")
            .select("fecha,monto,metodo")
            .eq("dni_cliente", dni)
            .execute()
        )
        if resp.error:
            raise HTTPException(status_code=400, detail=str(resp.error))
        return resp.data
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/limpiezas_cliente")
async def obtener_limpiezas(dni: str = Query(...), user: dict = Depends(auth_required)):
    """Devuelve las limpiezas realizadas para el cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        resp = (
            supabase.table("limpiezas")
            .select("fecha,observaciones,remito_url")
            .eq("dni_cliente", dni)
            .execute()
        )
        if resp.error:
            raise HTTPException(status_code=400, detail=str(resp.error))
        return resp.data
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
