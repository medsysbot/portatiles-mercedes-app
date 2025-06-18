"""
----------------------------------------------------------
Archivo: routes/cliente_panel.py
Descripción: Rutas para consultar la información del panel de clientes
Última modificación: 2025-06-18
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

"""Rutas para consultar la información del panel de clientes."""

from fastapi import APIRouter, HTTPException, Query, Form

supabase = None  # Cliente de Supabase, se inyecta desde la app

# Los datos personales se guardarán en la tabla
# `datos_personales_clientes`

router = APIRouter()


@router.get("/cliente_panel")
def cliente_panel():
    return {"msg": "Bienvenido"}


@router.get("/info_cliente")
async def info_cliente(email: str = Query(...)):
    """Devuelve los datos personales del cliente."""
    if supabase:
        # Consulta en la tabla datos_personales_clientes
        resp = (
            supabase.table("datos_personales_clientes")
            .select("nombre,apellido,dni,direccion,telefono,email")
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
    nombre: str = Form(...),
    apellido: str = Form(...),
    dni: str = Form(...),
    direccion: str = Form(...),
    telefono: str = Form(...),
):
    """Guarda o actualiza los datos personales del cliente."""
    if supabase:
        # Almacenamos en la tabla datos_personales_clientes
        data = {
            "email": email,
            "nombre": nombre,
            "apellido": apellido,
            "dni": dni,
            "direccion": direccion,
            "telefono": telefono,
        }
        supabase.table("datos_personales_clientes").upsert(data).execute()
    return {"mensaje": "Datos guardados"}
