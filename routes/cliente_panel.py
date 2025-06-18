"""
----------------------------------------------------------
Archivo: routes/cliente_panel.py
Descripción: Rutas para consultar la información del panel de clientes
Última modificación: 2025-06-18
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

"""Rutas para consultar la información del panel de clientes."""

from datetime import date
from fastapi import APIRouter, HTTPException, Query, Form

supabase = None

router = APIRouter()


@router.get("/cliente_panel")
def cliente_panel():
    return {"msg": "Bienvenido"}


@router.get("/info_cliente")
async def info_cliente(email: str = Query(...)):
    """Devuelve nombre y fecha de nacimiento del cliente."""
    if supabase:
        resp = (
            supabase.table("clientes_info")
            .select("dni,fecha_nacimiento")
            .eq("email", email)
            .single()
            .execute()
        )
        if getattr(resp, "data", None):
            return resp.data
        raise HTTPException(status_code=404, detail="Datos no encontrados")
    return {}


@router.get("/alquileres_cliente")
async def obtener_alquileres(email: str = Query(...)):
    """Devuelve los alquileres asociados al cliente."""
    return []


@router.get("/pagos_cliente")
async def obtener_pagos(email: str = Query(...)):
    """Devuelve los pagos realizados por el cliente."""
    return []


@router.get("/limpiezas_cliente")
async def obtener_limpiezas(email: str = Query(...)):
    """Devuelve las limpiezas realizadas para el cliente."""
    return []


@router.post("/guardar_datos_cliente")
async def guardar_datos_cliente(
    email: str = Form(...),
    dni: str = Form(...),
    fecha_nacimiento: date | None = Form(None),
):
    """Guarda o actualiza los datos personales del cliente."""
    if supabase:
        data = {"email": email, "dni": dni}
        if fecha_nacimiento:
            data["fecha_nacimiento"] = fecha_nacimiento.isoformat()
        supabase.table("clientes_info").upsert(data).execute()
    return {"mensaje": "Datos guardados"}
