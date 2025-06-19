"""
----------------------------------------------------------
Archivo: routes/cliente_panel.py
Descripción: Rutas para consultar la información del panel de clientes
Última modificación: 2025-06-18
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

"""Rutas para consultar la información del panel de clientes."""

from fastapi import APIRouter, HTTPException, Query, Form, Depends
from fastapi.responses import JSONResponse
import psycopg2
from utils.auth_utils import auth_required
import logging
import os

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

    url = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres.kccmlqoqhbkaecvetfce:porta1182villa@aws-0-us-west-1.pooler.supabase.com:5432/postgres",
    )
    try:
        conn = psycopg2.connect(url, connect_timeout=5)
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
        resp = (
            supabase.table("datos_personales_clientes")
            .select("dni,nombre,apellido,direccion,telefono,cuit,razon_social,email")
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
    cuit: str = Form(...),
    razon_social: str = Form(...),
    token_data: dict = Depends(auth_required),
):
    """Guarda o actualiza los datos personales del cliente."""
    if supabase:
        if not verificar_conexion_pooler():
            return JSONResponse(
                status_code=500,
                content={"status": "error", "detalle": "Fallo conexión pooler"},
            )

        datos = {
            "dni": dni,
            "nombre": nombre,
            "apellido": apellido,
            "direccion": direccion,
            "telefono": telefono,
            "cuit": cuit,
            "razon_social": razon_social,
            "email": email,
        }

        logger.info("Payload recibido: %s", datos)

        for campo, valor in datos.items():
            if not valor:
                raise HTTPException(status_code=400, detail=f"Campo '{campo}' faltante")

        existe = (
            supabase.table("datos_personales_clientes")
            .select("dni")
            .eq("dni", dni)
            .single()
            .execute()
        )

        try:
            if getattr(existe, "data", None):
                resultado = (
                    supabase.table("datos_personales_clientes")
                    .update(datos)
                    .eq("dni", dni)
                    .execute()
                )
            else:
                resultado = (
                    supabase.table("datos_personales_clientes")
                    .insert(datos)
                    .execute()
                )
            logger.info("Resultado en DATOS_PERSONALES_CLIENTES: %s", resultado)

            if getattr(resultado, "error", None):
                raise Exception(resultado.error)

            if not resultado.data:
                raise Exception("Operación sin datos devueltos")

        except Exception as e:  # Captura y log claro de cualquier excepción
            logger.error("Error en guardado Supabase: %s", e)
            return JSONResponse(
                status_code=400,
                content={"status": "error", "detalle": str(e)},
            )

        # <!-- Debug: Verificación completa de guardado en datos_personales_clientes, errores visibles en logs y frontend. -->

    return {"mensaje": "Datos guardados"}
