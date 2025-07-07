"""
----------------------------------------------------------
Archivo: routes/cliente_panel.py
Descripción: Rutas API para el panel de clientes (Portátiles Mercedes)
Última modificación: 2025-07-06
----------------------------------------------------------
"""

from fastapi import APIRouter, Request, Query, Body, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
from utils.auth_utils import get_current_user
import logging
import os
import smtplib
from email.message import EmailMessage

# ========================= Configuración global =========================

load_dotenv()

# Supabase
from supabase import create_client, Client
SUPABASE_URL: str | None = os.getenv("SUPABASE_URL")
SUPABASE_KEY: str | None = os.getenv("SUPABASE_KEY")
supabase: Client | None = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

# Jinja templates
templates = Jinja2Templates(directory="templates")

# Logger para eventos del cliente
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

# Router principal
router = APIRouter()

# ========================= Utilidades internas =========================

def supabase_no_configurado():
    logger.error("Supabase no configurado")
    raise HTTPException(status_code=500, detail="Supabase no configurado")

async def enviar_email(destino: str, asunto: str, cuerpo: str) -> None:
    """
    Envía un correo simple usando la configuración SMTP del entorno.
    """
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

# ========================= Rutas del Panel Cliente =========================

@router.get("/cliente/panel")
async def panel_cliente(request: Request, usuario: dict = Depends(get_current_user)):
    """
    Renderiza el dashboard del cliente autenticado.
    """
    return templates.TemplateResponse(
        "cliente_panel.html",
        {
            "request": request,
            "dni_quit_quill": usuario["dni_quit_quill"]
        }
    )

@router.get("/cliente_panel")
def cliente_panel():
    """Mensaje de bienvenida al panel cliente."""
    return {"msg": "Bienvenido"}

# ------------------------ Datos personales ------------------------

@router.get("/info_cliente")
async def info_cliente(email: str = Query(...)):
    """
    Devuelve los datos personales de un cliente según su email.
    """
    if not supabase:
        return supabase_no_configurado()
    try:
        resp = (
            supabase.table("datos_personales_clientes")
            .select("dni_cuit_cuil,nombre,apellido,direccion,telefono,razon_social,email")
            .eq("email", email)
            .single()
            .execute()
        )
        if getattr(resp, "data", None):
            return resp.data
        raise HTTPException(status_code=404, detail="Datos no encontrados")
    except Exception as exc:
        logger.error("Error consultando datos de cliente: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos")

@router.get("/info_datos_cliente")
async def info_datos_cliente(email: str = Query(...)):
    """
    Devuelve los datos personales almacenados para un cliente.
    """
    if not supabase:
        return supabase_no_configurado()
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
        raise HTTPException(status_code=500, detail="Error consultando datos")

@router.post("/guardar_datos_cliente")
async def guardar_datos_cliente(request: Request):
    """
    Guarda los datos personales del cliente en la base de datos (upsert por DNI).
    """
    data = await request.json()
    logger.info("Datos recibidos del cliente: %s", data)
    data.pop("cuit", None)  # Depuración de campos innecesarios

    if not supabase:
        return supabase_no_configurado()

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

# ------------------------ Alquileres y servicios ------------------------

@router.get("/clientes/alquileres")
async def obtener_alquileres(dni_cuit_cuil: str = Query(...)):
    """
    Devuelve los alquileres asociados al cliente (por DNI).
    """
    if not supabase:
        return supabase_no_configurado()
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

@router.get("/clientes/servicios_limpiezas")
async def obtener_limpiezas(dni_cuit_cuil: str = Query(...)):
    """
    Servicios de limpieza solicitados por el cliente.
    """
    if not supabase:
        return supabase_no_configurado()
    try:
        res = (
            supabase.table("servicios_limpieza")
            .select("fecha_servicio,numero_bano,dni_cuit_cuil,nombre_cliente,tipo_servicio,remito_url,observaciones")
            .eq("dni_cuit_cuil", dni_cuit_cuil)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        data = res.data or []
        for item in data:
            item["dni_cuit_cuil"] = item.get("dni_cuit_cuil") or ""
        return data
    except Exception as exc:
        logger.error("Error consultando limpiezas: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos")

# ------------------------ Facturación y comprobantes ------------------------

@router.get("/clientes/facturas_pendientes")
async def obtener_facturas_pendientes(dni: str = Query(...)):
    """
    Devuelve las facturas pendientes del cliente.
    """
    if not supabase:
        return supabase_no_configurado()
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

@router.get("/facturas_cliente")
async def obtener_facturas(dni_cuit_cuil: str = Query(...)):
    """
    Historial de facturación del cliente (todas las facturas).
    """
    if not supabase:
        return supabase_no_configurado()
    try:
        res = (
            supabase.table("facturas")
            .select("fecha,numero_factura,monto,estado")
            .eq("dni_cuit_cuil", dni_cuit_cuil)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:
        logger.error("Error consultando facturas: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos")

# ------------------------ Compras/Ventas cliente ------------------------

@router.get("/clientes/mis_compras")
async def obtener_ventas(dni_cuit_cuil: str = Query(...)):
    """
    Devuelve las compras/ventas asociadas al cliente.
    """
    if not supabase:
        return supabase_no_configurado()
    try:
        res = (
            supabase.table("ventas")
            .select("fecha_operacion,tipo_bano,dni_cuit_cuil,nombre_cliente,forma_pago,observaciones")
            .eq("dni_cuit_cuil", dni_cuit_cuil)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        data = res.data or []
        for item in data:
            item["dni_cuit_cuil"] = item.get("dni_cuit_cuil") or ""
        return data
    except Exception as exc:
        logger.error("Error consultando ventas: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos")

# ------------------------ Emails cliente ------------------------

@router.get("/clientes/emails")
async def obtener_emails_cliente(email: str = Query(...)):
    """
    Devuelve los últimos 10 emails enviados al cliente.
    """
    if not supabase:
        return supabase_no_configurado()
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

# ------------------------ Dashboard resumen cliente ------------------------

@router.get("/cliente/api/dashboard")
async def obtener_dashboard_cliente(
    dni_cuit_cuil: str = Query(...),
    email: str = Query(...)
):
    """
    Devuelve datos de resumen para el dashboard del panel cliente.
    """
    if not supabase:
        return supabase_no_configurado()

    resultado = {
        "facturas_pendientes": {"cantidad": 0, "monto_total": 0},
        "moroso": False,
        "alquileres": 0,
        "ultimo_comprobante": None,
        "proxima_limpieza": None,
        "emails": [],
    }

    try:
        # Facturas pendientes
        fact = (
            supabase.table("facturas_pendientes")
            .select("monto_adeudado")
            .eq("dni_cuit_cuil", dni_cuit_cuil)
            .execute()
        )
        datos = fact.data or []
        resultado["facturas_pendientes"]["cantidad"] = len(datos)
        resultado["facturas_pendientes"]["monto_total"] = sum(float(f.get("monto_adeudado") or 0) for f in datos)
    except Exception as exc:
        logger.error("Error facturas dashboard: %s", exc)

    try:
        # Estado de moroso
        mor = (
            supabase.table("morosos")
            .select("id")
            .eq("dni_cuit_cuil", dni_cuit_cuil)
            .maybe_single()
            .execute()
        )
        if getattr(mor, "data", None):
            resultado["moroso"] = True
    except Exception as exc:
        logger.error("Error morosidad dashboard: %s", exc)

    try:
        # Cantidad de alquileres activos
        alq = (
            supabase.table("alquileres")
            .select("numero_bano")
            .eq("dni_cuit_cuil", dni_cuit_cuil)
            .execute()
        )
        resultado["alquileres"] = len(alq.data or [])
    except Exception as exc:
        logger.error("Error alquileres dashboard: %s", exc)

    try:
        # Último comprobante enviado
        comp = (
            supabase.table("comprobantes_pago")
            .select("comprobante_url,fecha_envio")
            .eq("dni_cuit_cuil", dni_cuit_cuil)
            .order("fecha_envio", desc=True)
            .limit(1)
            .execute()
        )
        if comp.data:
            resultado["ultimo_comprobante"] = comp.data[0]
    except Exception as exc:
        logger.error("Error comprobantes dashboard: %s", exc)

    try:
        # Próxima limpieza agendada
        from datetime import date
        hoy = date.today().isoformat()
        limp = (
            supabase.table("servicios_limpieza")
            .select("fecha_servicio,numero_bano")
            .eq("dni_cuit_cuil", dni_cuit_cuil)
            .gte("fecha_servicio", hoy)
            .order("fecha_servicio")
            .limit(1)
            .execute()
        )
        if limp.data:
            resultado["proxima_limpieza"] = limp.data[0]
    except Exception as exc:
        logger.error("Error limpiezas dashboard: %s", exc)

    try:
        # Últimos emails enviados
        emails = (
            supabase.table("emails_enviados")
            .select("fecha,asunto,estado")
            .eq("email_destino", email)
            .order("fecha", desc=True)
            .limit(4)
            .execute()
        )
        resultado["emails"] = emails.data or []
    except Exception as exc:
        logger.error("Error emails dashboard: %s", exc)

    return resultado

# ------------------------ Reportes y envío de email ------------------------

@router.post("/cliente/reporte")
async def crear_reporte_cliente(request: Request):
    """
    Permite al cliente enviar un reporte (se guarda en la tabla 'reportes').
    """
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
        return supabase_no_configurado()
    try:
        res = supabase.table("reportes").insert(registro).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return {"ok": True}
    except Exception as exc:
        logger.error("Error guardando reporte cliente: %s", exc)
        raise HTTPException(status_code=500, detail="Error guardando reporte")

@router.post("/api/enviar_email_cliente")
async def enviar_email_cliente(data: dict = Body(...)):
    """
    Recibe datos de formulario y envía un correo a la dirección oficial.
    """
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

