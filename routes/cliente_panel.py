"""
----------------------------------------------------------
Archivo: routes/cliente_panel.py
Descripción: Panel de clientes con autenticación corregida.
Última modificación: 2025-07-06
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from fastapi import APIRouter, Request, Depends
from fastapi.templating import Jinja2Templates
from utils.auth_utils import get_current_user
import logging
import os

router = APIRouter()

templates = Jinja2Templates(directory="templates")

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "cliente_panel.log")

cliente_logger = logging.getLogger("cliente_panel")
cliente_logger.setLevel(logging.INFO)

if not cliente_logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    cliente_logger.addHandler(handler)
    cliente_logger.propagate = False


@router.get("/cliente/panel")
async def panel_cliente(request: Request, usuario: dict = Depends(get_current_user)):
    """Acceso al panel de clientes con usuario autenticado."""
    cliente_logger.info(f"Usuario accedió al panel: {usuario.get('email', '-')}")
    return templates.TemplateResponse("cliente_panel.html", {"request": request, "usuario": usuario})


@router.get("/clientes/datos_personales")
async def clientes_datos_personales(request: Request, usuario: dict = Depends(get_current_user)):
    """Acceso a datos personales del cliente autenticado."""
    cliente_logger.info(f"Usuario accedió a datos personales: {usuario.get('email', '-')}")
    return templates.TemplateResponse("clientes_datos.html", {"request": request, "usuario": usuario})
