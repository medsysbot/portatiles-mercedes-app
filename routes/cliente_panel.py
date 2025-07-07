"""
----------------------------------------------------------
Archivo: routes/cliente_panel.py
Descripción: Rutas API para el panel de clientes (Portátiles Mercedes)
----------------------------------------------------------
"""

from fastapi import APIRouter, Request, Query, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from utils.auth_utils import get_current_user
from dotenv import load_dotenv
import os
import logging
from supabase import create_client, Client

# Configuración global y logger igual que en empleados
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

templates = Jinja2Templates(directory="templates")
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

router = APIRouter()

# =============== Panel principal de clientes ===============
@router.get("/cliente/panel")
async def panel_cliente(request: Request, usuario: dict = Depends(get_current_user)):
    """
    Renderiza el panel principal de cliente autenticado.
    """
    return templates.TemplateResponse(
        "cliente_panel.html",
        {
            "request": request,
            "dni_quit_quill": usuario["dni_quit_quill"]
        }
    )

# =============== Datos personales de cliente ===============
@router.get("/info_datos_cliente")
async def info_datos_cliente(email: str = Query(...)):
    """
    Devuelve los datos personales almacenados de un cliente según su email.
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
        logger.error("Error en Supabase: %s", resultado.error)
        return JSONResponse(content={"error": getattr(resultado.error, "message", str(resultado.error))}, status_code=400)
    except Exception as e:
        logger.error("Excepción al guardar datos: %s", str(e))
        return JSONResponse(content={"error": f"Error interno: {str(e)}"}, status_code=500)

