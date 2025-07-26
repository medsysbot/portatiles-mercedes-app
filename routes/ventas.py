"""
----------------------------------------------------------
Archivo: routes/ventas.py
Descripción: Recibe formulario público de ventas y envía correo
Acceso: Público
Proyecto: Portátiles Mercedes
Versión final - Sin Supabase, sin PDF
----------------------------------------------------------
"""

from datetime import date
import logging
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.email_sender import enviar_email

router = APIRouter()

# ==== Logger ====
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "ventas.log")
logger = logging.getLogger("ventas")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

# ==== Modelo de formulario ====
class VentaPublica(BaseModel):
    cliente_nombre: str
    dni_cuit_cuil: str
    tipo_bano: str
    cantidad: int
    direccion_entrega: str
    fecha_venta: date
    correo_cliente: str
    observaciones: str | None = None

# ==== Endpoint ====
@router.post("/registrar_venta")
async def registrar_venta(venta: VentaPublica):
    """Recibe los datos del formulario de ventas y envía correo."""

    EMAIL_ORIGEN = os.getenv("EMAIL_ORIGEN")
    if not EMAIL_ORIGEN:
        raise HTTPException(status_code=500, detail="Email de origen no configurado")

    cuerpo = (
        f"Nuevo formulario de VENTA recibido:\n\n"
        f"Cliente: {venta.cliente_nombre}\n"
        f"DNI/CUIT/CUIL: {venta.dni_cuit_cuil}\n"
        f"Correo del cliente: {venta.correo_cliente}\n"
        f"Tipo de baño: {venta.tipo_bano}\n"
        f"Cantidad: {venta.cantidad}\n"
        f"Dirección de entrega: {venta.direccion_entrega}\n"
        f"Fecha de venta: {venta.fecha_venta}\n"
        f"Observaciones: {venta.observaciones or ''}"
    )

    try:
        await enviar_email(EMAIL_ORIGEN, "Nuevo formulario de Venta enviado", cuerpo)
        logger.info("Correo de venta enviado correctamente")
        return {"ok": True}
    except Exception as exc:
        logger.exception("Error al enviar correo de venta: %s", exc)
        raise HTTPException(status_code=500, detail="No se pudo enviar el correo de venta")
