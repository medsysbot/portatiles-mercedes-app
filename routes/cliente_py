"""
----------------------------------------------------------
Archivo: routes/cliente_panel.py
Descripción: Rutas para consultar la información del panel de clientes
Última modificación: 2025-07-04
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from fastapi import APIRouter, HTTPException, Query, Request, Body
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import logging
import os
import smtplib
from email.message import EmailMessage
from supabase import create_client, Client

load_dotenv()

# Cliente de Supabase
url: str | None = os.getenv("SUPABASE_URL")
key: str | None = os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if url and key:
    supabase = create_client(url, key)

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

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# 🔹 NUEVO: Endpoint para renderizar el splash del cliente
@router.get("/splash_cliente")
async def splash_cliente(request: Request, nombre_usuario: str = Query(...)):
    """
    Renderiza el splash de bienvenida del cliente.
    Espera el nombre del usuario como parámetro para personalizar el saludo.
    """
    return templates.TemplateResponse(
        "splash_cliente.html",
        {"request": request, "nombre_usuario": nombre_usuario},
    )

# 🔹 Renderiza el panel cliente como HTML completo
@router.get("/panel_cliente")
async def render_panel_cliente(request: Request):
    """Renderiza el panel de cliente como página HTML completa."""
    return templates.TemplateResponse("cliente_panel.html", {"request": request})

@router.get("/info_cliente")
async def info_cliente(email: str = Query(...)):
    """Devuelve los datos personales del cliente."""
    if supabase:
        try:
            resp = (
                supabase.table("datos_personales_clientes")
                .select("dni_cuit_cuil,nombre,apellido,direccion,telefono,razon_social,email")
                .eq("email", email)
                .single()
                .execute()
            )
        except Exception as exc:
            logger.error("Error consultando datos de cliente: %s", exc)
            raise HTTPException(status_code=500, detail="Error consultando datos")
        if getattr(resp, "data", None):
            return resp.data
        raise HTTPException(status_code=404, detail="Datos no encontrados")
    logger.error("Cliente_panel supabase no configurado")
    return {}

@router.get("/alquileres_cliente")
async def obtener_alquileres(dni_cuit_cuil: str = Query(...)):
    """Devuelve los alquileres asociados al cliente."""
    if not supabase:
        logger.warning("Supabase no configurado")
        return []
    try:
        res = (
            supabase.table("alquileres")
            .select("numero_bano,cliente_nombre,dni_cuit_cuil,direccion,fecha_inicio,fecha_fin,observaciones")
            .eq("dni_cuit_cuil", dni_cuit_cuil)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:
        logger.error("Error consultando alquileres cliente: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos")

@router.get("/facturas_pendientes_cliente")
async def obtener_facturas_pendientes(dni: str = Query(...)):
    """Facturas pendientes del cliente."""
    if not supabase:
        logger.warning("Supabase no configurado")
        return []
    try:
        res = (
            supabase.table("facturas_pendientes")
            .select("fecha,numero_factura,dni_cuit_cuil,razon_social,nombre_cliente,monto_adeudado")
            .eq("dni_cuit_cuil", dni)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:
        logger.error("Error consultando facturas pendientes: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos")

@router.get("/limpiezas_cliente")
async def obtener_limpiezas(dni_cuit_cuil: str = Query(...)):
    """Servicios de limpieza del cliente."""
    if not supabase:
        logger.warning("Supabase no configurado")
        return []
    try:
        res = (
            supabase.table("servicios_limpieza")
            .select("fecha_servicio,numero_bano,dni_cuit_cuil,nombre_cliente,tipo_servicio,estado,remito_url,observaciones")
            .eq("dni_cuit_cuil", dni_cuit_cuil)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:
        logger.error("Error consultando limpiezas: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos")

@router.get("/ventas_cliente")
async def obtener_ventas(dni_cuit_cuil: str = Query(...)):
    """Ventas asociadas al cliente."""
    if not supabase:
        logger.warning("Supabase no configurado")
        return []
    try:
        res = (
            supabase.table("ventas")
            .select("fecha_operacion,tipo_bano,dni_cuit_cuil,nombre_cliente,forma_pago,observaciones")
            .eq("dni_cuit_cuil", dni_cuit_cuil)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:
        logger.error("Error consultando ventas: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos")

@router.get("/emails_cliente")
async def obtener_emails_cliente(email: str = Query(...)):
    """Devuelve los últimos 10 emails enviados al cliente."""
    if not supabase:
        logger.warning("Supabase no configurado")
        return []
    try:
        res = (
            supabase.table("emails_enviados")
            .select("fecha,asunto,estado")
            .eq("email_destino", email)
            .order("fecha", desc=True)
            .limit(10)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:
        logger.error("Error consultando emails cliente: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos")

@router.post("/cliente/reporte")
async def crear_reporte_cliente(request: Request):
    """Permite al cliente enviar un reporte."""
    datos = await request.json()
    registro = {
        "fecha": datos.get("fecha"),
        "nombre_persona": datos.get("nombre_persona"),
        "asunto": datos.get("motivo"),
        "contenido": datos.get("observaciones"),
    }
    if "dni_cuit_cuil" in datos:
        registro["dni_cuit_cuil"] = datos["dni_cuit_cuil"]
    if not supabase:
        logger.warning("Supabase no configurado")
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        res = supabase.table("reportes").insert(registro).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return {"ok": True}
    except Exception as exc:
        logger.error("Error guardando reporte cliente: %s", exc)
        raise HTTPException(status_code=500, detail="Error guardando reporte")

async def enviar_email(destino: str, asunto: str, cuerpo: str) -> None:
    """Envía un correo simple usando la configuración SMTP."""
    email_origen = os.getenv("EMAIL_ORIGEN")
    email_pwd = os.getenv("EMAIL_PASSWORD")
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    if not all([email_origen, email_pwd, smtp_server, smtp_port]):
        raise Exception("SMTP no configurado")
    msg = EmailMessage()
    msg["From"] = email_origen
    msg["To"] = destino
    msg["Subject"] = asunto
    msg.set_content(cuerpo)
    with smtplib.SMTP_SSL(smtp_server, int(smtp_port)) as smtp:
        smtp.login(email_origen, email_pwd)
        smtp.send_message(msg)

@router.post("/api/enviar_email_cliente")
async def enviar_email_cliente(data: dict = Body(...)):
    """Recibe los datos del formulario y envía un correo a la dirección oficial."""
    destinatario = data.get("destinatario", "").strip()
    asunto = data.get("asunto", "").strip()
    mensaje = data.get("mensaje", "").strip()
    if not asunto or not mensaje:
        raise HTTPException(status_code=400, detail="Motivo y mensaje obligatorios.")
    if destinatario != "portatilesmercedes.bot@gmail.com":
        raise HTTPException(status_code=400, detail="Destinatario no permitido.")
    try:
        await enviar_email(destinatario, asunto, mensaje)
        return {"ok": True, "msg": "Mensaje enviado correctamente"}
    except Exception as e:
        logger.error("Error enviando email de cliente: %s", e)
        raise HTTPException(status_code=500, detail="Error enviando email")
