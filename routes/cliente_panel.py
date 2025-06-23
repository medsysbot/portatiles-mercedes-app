"""
----------------------------------------------------------
Archivo: routes/cliente_panel.py
Descripción: Rutas para consultar la información del panel de clientes
Última modificación: 2025-06-20
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

"""Rutas para consultar la información del panel de clientes."""

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
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
async def obtener_alquileres(dni: str = Query(...)):
    """Devuelve los alquileres asociados al cliente."""
    if not supabase:
        logger.warning("Supabase no configurado")
        return []

    try:
        res = (
            supabase.table("alquileres")
            .select(
                "numero_bano,cliente_nombre,cliente_dni,direccion,fecha_inicio,fecha_fin,observaciones"
            )
            .eq("cliente_dni", dni)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:  # pragma: no cover - conexión
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
            .select("fecha,numero_factura,razon_social,monto_adeudado")
            .eq("dni_cuit_cuil", dni)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:  # pragma: no cover
        logger.error("Error consultando facturas pendientes: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos")


@router.get("/limpiezas_cliente")
async def obtener_limpiezas(dni: str = Query(...)):
    """Servicios de limpieza del cliente."""
    if not supabase:
        logger.warning("Supabase no configurado")
        return []

    try:
        res = (
            supabase.table("servicios_limpieza")
            .select("fecha,numero_bano,tipo_servicio,observaciones,remito_url")
            .eq("dni_cuit_cuil", dni)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:  # pragma: no cover
        logger.error("Error consultando limpiezas: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos")


@router.get("/info_datos_cliente")
async def info_datos_cliente(
    email: str = Query(..., description="Email del cliente")
):
    """Devuelve los datos personales almacenados para un cliente."""
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
    except Exception as exc:  # pragma: no cover - errores de conexión
        logger.error("\u274c Error al consultar datos personales: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos")

    if getattr(result, "data", None):
        return result.data

    raise HTTPException(status_code=404, detail="Datos no encontrados")


@router.post("/guardar_datos_cliente")
async def guardar_datos_cliente(request: Request):
    """Guarda los datos personales del cliente en la base de datos."""
    data = await request.json()
    logger.info("\ud83d\udce5 Datos recibidos del cliente: %s", data)

    try:
        resultado = (
            supabase.table("datos_personales_clientes")
            .upsert(data, on_conflict="dni")
            .execute()
        )

        logger.info("\ud83d\udce6 Respuesta Supabase: %s", resultado)

        if getattr(resultado, "error", None) is None:
            return JSONResponse(
                content={"mensaje": "\u00a1Datos guardados correctamente!"},
                status_code=200,
            )

        logger.error("\u274c Error en Supabase: %s", resultado.error)
        return JSONResponse(
            content={"error": getattr(resultado.error, "message", str(resultado.error))},
            status_code=400,
        )

    except Exception as e:
        logger.error("\ud83d\udd25 Excepci\u00f3n al guardar datos: %s", str(e))
        return JSONResponse(
            content={"error": f"Error interno: {str(e)}"}, status_code=500
        )


@router.get("/facturas_cliente")
async def obtener_facturas(dni: str = Query(...)):
    """Historial de facturación del cliente."""
    if not supabase:
        logger.warning("Supabase no configurado")
        return []

    try:
        res = (
            supabase.table("facturas")
            .select("fecha,numero_factura,monto,estado")
            .eq("dni_cuit_cuil", dni)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:  # pragma: no cover
        logger.error("Error consultando facturas: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos")


@router.get("/ventas_cliente")
async def obtener_ventas(dni: str = Query(...)):
    """Ventas asociadas al cliente."""
    if not supabase:
        logger.warning("Supabase no configurado")
        return []

    try:
        res = (
            supabase.table("ventas")
            .select(
                "fecha_operacion,tipo_bano,nombre_cliente,forma_pago,observaciones"
            )
            .eq("dni_cliente", dni)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:  # pragma: no cover
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
    except Exception as exc:  # pragma: no cover
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
    if "dni" in datos:
        registro["dni"] = datos["dni"]
    if not supabase:
        logger.warning("Supabase no configurado")
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    try:
        res = supabase.table("reportes").insert(registro).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return {"ok": True}
    except Exception as exc:  # pragma: no cover
        logger.error("Error guardando reporte cliente: %s", exc)
        raise HTTPException(status_code=500, detail="Error guardando reporte")


@router.post("/cliente/email")
async def enviar_email_cliente(request: Request):
    """Envía un email a la empresa usando EMAIL_ORIGEN."""
    data = await request.json()
    email_origen = os.getenv("EMAIL_ORIGEN")
    email_pwd = os.getenv("EMAIL_PASSWORD")
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    if not all([email_origen, email_pwd, smtp_server, smtp_port]):
        raise HTTPException(status_code=500, detail="SMTP no configurado")

    msg = EmailMessage()
    msg["From"] = email_origen
    msg["To"] = email_origen
    msg["Subject"] = data.get("asunto", "Mensaje desde panel cliente")
    if data.get("email"):
        msg["Reply-To"] = data["email"]
    msg.set_content(data.get("mensaje", ""))

    try:
        with smtplib.SMTP_SSL(smtp_server, int(smtp_port)) as smtp:
            smtp.login(email_origen, email_pwd)
            smtp.send_message(msg)
        return {"ok": True}
    except Exception as exc:  # pragma: no cover
        logger.error("Error enviando email cliente: %s", exc)
        raise HTTPException(status_code=500, detail="Error enviando email")
