"""
----------------------------------------------------------
Archivo: routes/cliente_panel.py
Descripción: Rutas para consultar la información del panel de clientes
Última modificación: 2025-06-20
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

"""Rutas para consultar la información del panel de clientes."""

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import logging
import os
from supabase import create_client, Client

load_dotenv()

# Cliente de Supabase
url: str | None = os.getenv("SUPABASE_URL")
key: str | None = os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if url and key:
    supabase = create_client(url, key)
# Nota: este flujo conecta el frontend con la tabla DATOS_PERSONALES_CLIENTES en Supabase

# Configuración de logging para operaciones de clientes
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "cliente_events.log")
logger = logging.getLogger("cliente_events")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

# Los datos personales se guardarán en la tabla
# `datos_personales_clientes` en Supabase

router = APIRouter()

# Refactor: integración exclusiva con datos_personales_clientes, usando DNI como clave única.


@router.get("/cliente_panel")
def cliente_panel():
    return {"msg": "Bienvenido"}


@router.get("/info_cliente")
async def info_cliente(email: str = Query(...)):
    """Devuelve los datos personales del cliente."""
    if supabase:
        try:
            resp = (
                supabase.table("datos_personales_clientes")
                .select("dni,nombre,apellido,direccion,telefono,cuit,razon_social,email")
                .eq("email", email)
                .single()
                .execute()
            )
        except Exception as exc:  # pragma: no cover - debug
            logger.error("Error consultando datos de cliente: %s", exc)
            raise HTTPException(status_code=500, detail="Error consultando datos")
        if getattr(resp, "data", None):
            return resp.data
        raise HTTPException(status_code=404, detail="Datos no encontrados")
    logger.error("Cliente_panel supabase no configurado")
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


@router.get("/info_datos_cliente")
async def info_datos_cliente(request: Request):
    email = request.query_params.get("email")
    try:
        result = (
            supabase.table("datos_personales_clientes")
            .select("*")
            .eq("email", email)
            .single()
            .execute()
        )

        if result.status_code >= 300:
            return JSONResponse(
                content={"message": "No se encontraron datos"}, status_code=404
            )

        return JSONResponse(content=result.data, status_code=200)

    except Exception as e:
        logger.error("\u274c Error al obtener datos personales: %s", str(e))
        return JSONResponse(
            content={"message": f"Error interno: {str(e)}"}, status_code=500
        )


@router.post("/guardar_datos_cliente")
async def guardar_datos_cliente(request: Request):
    """Guarda los datos personales del cliente en la base de datos."""
    data = await request.json()
    logger.info("\ud83d\udce5 Datos recibidos del cliente: %s", data)

    try:
        resultado = (
            supabase.table("datos_personales_clientes")
            .upsert(data, on_conflict="dni")
            .execute()
        )

        if resultado.status_code >= 300:
            logger.error(
                "\u274c Error al guardar en Supabase. Status: %s",
                resultado.status_code,
            )
            return JSONResponse(
                content={"message": "Error al guardar"}, status_code=500
            )

        return JSONResponse(content={"message": "Guardado exitoso"}, status_code=200)

    except Exception as e:
        logger.error("\ud83d\udd25 Excepci\u00f3n al guardar datos: %s", str(e))
        return JSONResponse(
            content={"message": f"Error interno: {str(e)}"}, status_code=500
        )
