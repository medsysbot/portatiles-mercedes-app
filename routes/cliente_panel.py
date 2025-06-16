"""
----------------------------------------------------------
Archivo: routes/cliente_panel.py
Descripción: Rutas para consultar la información del panel de clientes
Última modificación: 2025-06-15
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

"""Rutas para consultar la información del panel de clientes."""

from fastapi import APIRouter, HTTPException, Query

supabase = None

router = APIRouter()


@router.get("/cliente_panel")
def cliente_panel():
    return {"msg": "Bienvenido"}


@router.get("/info_cliente")
async def info_cliente(dni: str = Query(...)):
    """Devuelve nombre y fecha de nacimiento del cliente."""
    return {}


@router.get("/alquileres_cliente")
async def obtener_alquileres(dni: str = Query(...)):
    """Devuelve los alquileres asociados al cliente."""
    return []


@router.get("/pagos_cliente")
async def obtener_pagos(dni: str = Query(...)):
    """Devuelve los pagos realizados por el cliente."""
    return []


@router.get("/limpiezas_cliente")
async def obtener_limpiezas(dni: str = Query(...)):
    """Devuelve las limpiezas realizadas para el cliente."""
    return []
