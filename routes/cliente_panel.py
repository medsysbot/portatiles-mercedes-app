"""
----------------------------------------------------------
Archivo: routes/cliente_panel.py
Descripción: Rutas y lógica backend para el panel de clientes.
----------------------------------------------------------
"""

from fastapi import APIRouter, Request, Query, HTTPException, Depends
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from utils.auth_utils import get_current_user
import os
import logging

from supabase import create_client, Client

# Configuración de entorno y Supabase
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

# Configuración de templates y logging
templates = Jinja2Templates(directory="templates")
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "cliente_panel.log")
logger = logging.getLogger("cliente_panel")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

router = APIRouter()

# ========== Panel de clientes (vista principal) ==========
@router.get("/cliente/panel")
async def panel_cliente(request: Request, usuario: dict = Depends(get_current_user)):
    """
    Renderiza el panel principal de clientes.
    """
    return templates.TemplateResponse(
        "cliente_panel.html",
        {
            "request": request,
            "dni_quit_quill": usuario.get("dni_quit_quill", ""),
            "usuario": usuario
        }
    )

# ========== Endpoint: Obtener datos personales del cliente ==========
@router.get("/info_datos_cliente")
async def info_datos_cliente(email: str = Query(...)):
    """
    Devuelve los datos personales del cliente (por email).
    """
    if not supabase:
        logger.error("Supabase no configurado")
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        result = (
            supabase.table("datos_personales_clientes")
            .select("*")
            .eq("email", email)
            .single()
            .execute()
        )
        if getattr(result, "data", None):
            return result.data
        raise HTTPException(status_code=404, detail="Datos no encontrados")
    except Exception as exc:
        logger.error("Error consultando datos personales: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos personales")

# ========== Endpoint: Guardar datos personales del cliente ==========
@router.post("/guardar_datos_cliente")
async def guardar_datos_cliente(request: Request):
    """
    Guarda los datos personales del cliente en la base de datos (upsert por DNI).
    """
    data = await request.json()
    logger.info("Datos recibidos del cliente: %s", data)
    if not supabase:
        logger.error("Supabase no configurado")
        return JSONResponse(content={"error": "Supabase no configurado"}, status_code=500)
    try:
        resultado = (
            supabase.table("datos_personales_clientes")
            .upsert(data, on_conflict="dni_cuit_cuil")
            .execute()
        )
        if getattr(resultado, "error", None) is None:
            return JSONResponse(content={"mensaje": "¡Datos guardados correctamente!"}, status_code=200)
        logger.info("Datos guardados para cliente %s", data.get("dni_cuit_cuil"))
        return JSONResponse(content={"error": getattr(resultado.error, "message", str(resultado.error))}, status_code=400)
    except Exception as e:
        logger.error("Excepción al guardar datos: %s", str(e))
        return JSONResponse(content={"error": f"Error interno: {str(e)}"}, status_code=500)

