"""
----------------------------------------------------------
Archivo: routes/cliente_panel.py
Descripción: Rutas para consultar la información del panel de clientes
Última modificación: 2025-06-20
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

"""Rutas para consultar la información del panel de clientes."""

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
import psycopg2
from dotenv import load_dotenv
from utils.auth_utils import auth_required
import logging
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def obtener_conexion_supabase():
    """Devuelve una conexión a la base de Supabase."""
    try:
        return psycopg2.connect(DATABASE_URL)
    except Exception as exc:  # pragma: no cover - log de errores de conexión
        logger.error("Fallo al conectar con Supabase: %s", exc)
        return None

supabase = None  # Cliente de Supabase, se inyecta desde la app
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

# Refactor: integración exclusiva con datos_personales_clientes, usando DNI como clave única. Limpieza de código viejo.

# Verifica conexión al pooler de Supabase usando psycopg2.
def verificar_conexion_pooler() -> bool:
    """Comprueba la conexión al pooler de Supabase si está habilitado."""
    if os.getenv("ENABLE_POOLER_CHECK") != "1":
        return True

    url = os.getenv("DATABASE_URL")
    try:
        conn = psycopg2.connect(url)
        conn.close()
        logger.info("Conexión a pooler Supabase exitosa")
        return True
    except Exception as exc:  # pragma: no cover - solo log
        logger.error("Fallo conexión pooler Supabase: %s", exc)
        return False


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
def guardar_datos_cliente(
    datos: dict,
    token_data: dict = Depends(auth_required),
):
    """Guarda los datos personales del cliente en la base de datos."""
    try:
        conn = obtener_conexion_supabase()
        if conn is None:
            logger.error("No se pudo establecer conexión con Supabase")
            raise HTTPException(
                status_code=500,
                detail="Problema de conexión a la base de datos",
            )
        cur = conn.cursor()

        insert_query = """
            INSERT INTO datos_personales_clientes (dni, nombre, apellido, direccion, telefono, cuit, razon_social, email)
            VALUES (%(dni)s, %(nombre)s, %(apellido)s, %(direccion)s, %(telefono)s, %(cuit)s, %(razon_social)s, %(email)s);
        """

        cur.execute(insert_query, datos)
        conn.commit()

        cur.close()
        conn.close()

        return {"mensaje": "Datos guardados correctamente"}
    except Exception as exc:
        logger.error("Error al guardar datos del cliente: %s", exc)
        raise HTTPException(status_code=500, detail="Error al guardar los datos")
