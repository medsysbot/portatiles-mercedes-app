"""
Archivo: routes/cliente_panel.py
Descripción: Rutas backend para el panel de clientes y módulos integrados.
"""

from fastapi import APIRouter, Request, Depends
from fastapi.templating import Jinja2Templates
from utils.auth_utils import get_current_user
import os
import logging

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

# Panel principal: dashboard con resumen, cards, gráficos y calendario
@router.get("/cliente/panel")
async def panel_cliente(request: Request, usuario: dict = Depends(get_current_user)):
    return templates.TemplateResponse(
        "cliente_panel.html", {"request": request, "usuario": usuario}
    )

# Datos personales
@router.get("/clientes/datos_personales")
async def clientes_datos_personales(request: Request, usuario: dict = Depends(get_current_user)):
    return templates.TemplateResponse(
        "clientes_datos.html", {"request": request, "usuario": usuario}
    )

# Alquileres
@router.get("/clientes/alquileres")
async def clientes_alquileres(request: Request, usuario: dict = Depends(get_current_user)):
    return templates.TemplateResponse(
        "clientes_alquileres.html", {"request": request, "usuario": usuario}
    )

# Facturas pendientes
@router.get("/clientes/facturas_pendientes")
async def clientes_facturas_pendientes(request: Request, usuario: dict = Depends(get_current_user)):
    return templates.TemplateResponse(
        "clientes_factura_pendiente.html", {"request": request, "usuario": usuario}
    )

# Comprobantes
@router.get("/clientes/comprobantes")
async def clientes_comprobantes(request: Request, usuario: dict = Depends(get_current_user)):
    return templates.TemplateResponse(
        "clientes_comprobantes.html", {"request": request, "usuario": usuario}
    )

# Formulario de comprobantes (alta)
@router.get("/clientes/comprobantes/form")
async def clientes_comprobantes_form(request: Request, usuario: dict = Depends(get_current_user)):
    return templates.TemplateResponse(
        "clientes_comprobantes_form.html", {"request": request, "usuario": usuario}
    )

# Compras
@router.get("/clientes/mis_compras")
async def clientes_mis_compras(request: Request, usuario: dict = Depends(get_current_user)):
    return templates.TemplateResponse(
        "clientes_mis_compras.html", {"request": request, "usuario": usuario}
    )

# Servicios de limpieza
@router.get("/clientes/servicios_limpieza")
async def clientes_servicios_limpieza(request: Request, usuario: dict = Depends(get_current_user)):
    return templates.TemplateResponse(
        "clientes_servicios_limpieza.html", {"request": request, "usuario": usuario}
    )

# Emails principal
@router.get("/clientes/emails")
async def clientes_emails(request: Request, usuario: dict = Depends(get_current_user)):
    return templates.TemplateResponse(
        "clientes_emails.html", {"request": request, "usuario": usuario}
    )

# Lista de emails
@router.get("/clientes/emails/lista")
async def clientes_email_lista(request: Request, usuario: dict = Depends(get_current_user)):
    return templates.TemplateResponse(
        "clientes_email_lista.html", {"request": request, "usuario": usuario}
    )
