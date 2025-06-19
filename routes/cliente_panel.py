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
from utils.auth_utils import auth_required
import logging
import os

supabase = None  # Cliente de Supabase, se inyecta desde la app
# Nota: este flujo conecta el frontend con la tabla CLIENTES de Supabase

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
# `clientes` en Supabase

router = APIRouter()


@router.get("/cliente_panel")
def cliente_panel():
    return {"msg": "Bienvenido"}


@router.get("/info_cliente")
async def info_cliente(id_usuario: str = Query(...)):
    """Devuelve los datos personales del cliente."""
    if supabase:
        # Consulta en la tabla clientes
        resp = (
            supabase.table("clientes")
            .select("nombre,apellido,dni,direccion,telefono,email")
            .eq("id_usuario", id_usuario)
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
    id_usuario: str = Form(None),
    token_data: dict = Depends(auth_required),
):
    """Guarda o actualiza los datos personales del cliente."""
    if supabase:
        # Validar DNI único antes de insertar
        existe = (
            supabase.table("clientes").select("id").eq("dni", dni).execute()
        )
        if getattr(existe, "data", []):
            raise HTTPException(status_code=400, detail="Ese DNI ya está registrado")

        id_usuario = id_usuario or token_data.get("id")
        if not id_usuario:
            raise HTTPException(status_code=400, detail="UUID faltante")

        # Verificamos que el usuario exista
        usuario_resp = (
            supabase.table("usuarios").select("id").eq("id", id_usuario).single().execute()
        )
        if not usuario_resp.data:
            raise HTTPException(status_code=400, detail="UUID inválido")

        # Almacenamos en la tabla clientes
        datos = {
            "id_usuario": id_usuario,
            "email": email,
            "nombre": nombre,
            "apellido": apellido,
            "dni": dni,
            "direccion": direccion,
            "telefono": telefono,
        }

        # Validamos que ningún campo esté vacío
        for campo, valor in datos.items():
            if not valor:
                raise HTTPException(status_code=400, detail=f"Campo '{campo}' faltante")

        try:
            resultado = supabase.table("clientes").insert(datos).execute()
            print("Resultado del insert en CLIENTES:", resultado)
            logger.info("Resultado del insert en CLIENTES: %s", resultado)
        except Exception as e:
            print("ERROR AL GUARDAR CLIENTE:", e)
            logger.error("ERROR AL GUARDAR CLIENTE: %s", e)
            raise HTTPException(
                status_code=500,
                detail="No se pudo guardar el registro. Ver logs para más detalles.",
            )

        if not getattr(resultado, "data", None):
            raise HTTPException(status_code=500, detail="Insert no generó datos")

    return {"mensaje": "Datos guardados"}
