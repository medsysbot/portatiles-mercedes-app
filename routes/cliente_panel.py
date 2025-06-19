"""
----------------------------------------------------------
Archivo: routes/cliente_panel.py
Descripción: Rutas para consultar la información del panel de clientes
Última modificación: 2025-06-20
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

"""Rutas para consultar la información del panel de clientes."""

from fastapi import APIRouter, HTTPException, Query, Depends, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from utils.auth_utils import auth_required
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


@router.post("/guardar_datos_cliente")
async def guardar_datos_cliente(
    request: Request, token_data: dict = Depends(auth_required)
):
    """Guarda los datos personales del cliente en la base de datos."""
    try:
        data = await request.json()
        logger.info("\ud83d\udce5 Datos recibidos del cliente: %s", data)

        if not data.get("email"):
            return JSONResponse(
                status_code=400,
                content={"message": "El campo email es obligatorio"},
            )

        if not supabase:
            logger.error("Supabase no configurado")
            return JSONResponse(
                status_code=500,
                content={"message": "Supabase no configurado"},
            )

        response = (
            supabase.table("datos_personales_clientes").insert(data).execute()
        )

        if getattr(response, "status_code", 500) >= 300:
            logger.error("\u274c Error en respuesta Supabase: %s", response)
            return JSONResponse(
                content={"message": "Error al guardar en Supabase"},
                status_code=500,
            )

        logger.info("\u2705 Datos guardados correctamente en Supabase")
        return JSONResponse(
            content={"message": "Datos guardados correctamente"},
            status_code=200,
        )

    except Exception as e:
        logger.exception("\ud83d\udd25 Excepci\u00f3n al guardar datos: %s", str(e))
        return JSONResponse(
            content={"message": f"Error al guardar datos: {str(e)}"},
            status_code=500,
        )
