"""Sistema de alertas automáticas."""

from datetime import date, timedelta
import os
import smtplib
from email.message import EmailMessage

from fastapi import APIRouter, HTTPException
from supabase import create_client, Client

# Configuración de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados"
    )

supabase: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# Configuración para enviar correos
EMAIL_ORIGIN = os.getenv("EMAIL_ORIGIN")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = os.getenv("SMTP_PORT")

if not all([EMAIL_ORIGIN, EMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT]):
    raise RuntimeError(
        "EMAIL_ORIGIN, EMAIL_PASSWORD, SMTP_SERVER y SMTP_PORT deben estar configurados"
    )

router = APIRouter()


def enviar_correo(destinatario: str, asunto: str, mensaje: str) -> None:
    """Envía un correo electrónico simple."""

    msg = EmailMessage()
    msg["From"] = EMAIL_ORIGIN
    msg["To"] = destinatario
    msg["Subject"] = asunto
    msg.set_content(mensaje)

    with smtplib.SMTP_SSL(SMTP_SERVER, int(SMTP_PORT)) as smtp:
        smtp.login(EMAIL_ORIGIN, EMAIL_PASSWORD)
        smtp.send_message(msg)


def alerta_cumpleanos() -> None:
    """Saluda a los clientes que cumplen años hoy."""

    hoy = date.today()
    resp = supabase.table("clientes").select("nombre,email,fecha_nacimiento").execute()
    for cli in resp.data or []:
        fecha = cli.get("fecha_nacimiento")
        email = cli.get("email")
        if not fecha or not email:
            continue
        cumple = date.fromisoformat(fecha)
        if cumple.month == hoy.month and cumple.day == hoy.day:
            asunto = "\u00a1Feliz cumplea\u00f1os!"
            cuerpo = (
                f"Hola {cli['nombre']}, desde Port\xe1tiles Mercedes te deseamos un feliz cumplea\u00f1os."
            )
            enviar_correo(email, asunto, cuerpo)


def alertas_proxima_limpieza() -> None:
    """Notifica cuando corresponde una limpieza según la última fecha registrada."""

    hoy = date.today()
    resp = supabase.table("alquileres").select(
        "id,dni_cliente,email_responsable,email,fecha_inicio,fecha_ultima_limpieza"
    ).execute()
    for reg in resp.data or []:
        ultima = reg.get("fecha_ultima_limpieza") or reg.get("fecha_inicio")
        destino = reg.get("email_responsable") or reg.get("email")
        if not ultima or not destino:
            continue
        try:
            fecha_ult = date.fromisoformat(ultima)
        except ValueError:
            continue
        proxima = fecha_ult + timedelta(days=7)
        if proxima <= hoy:
            asunto = "Limpieza programada"
            cuerpo = (
                "Se debe realizar la limpieza del ba\u00f1o correspondiente al alquiler "
                f"ID {reg['id']} (cliente {reg.get('dni_cliente')})."
            )
            enviar_correo(destino, asunto, cuerpo)


def alertas_pagos_vencidos() -> None:
    """Envía recordatorios por pagos vencidos en ventas o alquileres."""

    hoy = date.today()
    ventas = supabase.table("ventas").select(
        "id,cliente_nombre,dni,email,fecha_pago,estado_pago"
    ).execute()
    for v in ventas.data or []:
        pago = v.get("fecha_pago")
        estado = v.get("estado_pago")
        email = v.get("email")
        if estado == "pagado" or not pago or not email:
            continue
        try:
            fecha_pago = date.fromisoformat(pago)
        except ValueError:
            continue
        if fecha_pago < hoy:
            asunto = "Pago vencido"
            cuerpo = (
                f"Estimado {v.get('cliente_nombre')}, su pago se encuentra vencido. Por favor regularice la situaci\u00f3n."
            )
            enviar_correo(email, asunto, cuerpo)

    alquileres = supabase.table("alquileres").select(
        "id,dni_cliente,email,fecha_pago,estado_pago"
    ).execute()
    for alq in alquileres.data or []:
        pago = alq.get("fecha_pago")
        estado = alq.get("estado_pago")
        email = alq.get("email")
        if estado == "pagado" or not pago or not email:
            continue
        try:
            fecha_pago = date.fromisoformat(pago)
        except ValueError:
            continue
        if fecha_pago < hoy:
            asunto = "Pago de alquiler vencido"
            cuerpo = (
                "Le recordamos que el pago del alquiler est\xe1 vencido. Por favor, p\u00f3ngase en contacto con Port\xe1tiles Mercedes."
            )
            enviar_correo(email, asunto, cuerpo)


@router.post("/ejecutar_alertas")
async def ejecutar_alertas():
    """Endpoint para lanzar manualmente todas las alertas."""

    try:
        alerta_cumpleanos()
        alertas_proxima_limpieza()
        alertas_pagos_vencidos()
        return {"mensaje": "Alertas ejecutadas"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


def programar_alertas_diarias() -> None:
    """Funci\u00f3n preparada para integrarse con tareas programadas."""

    # Aqu\u00ed se podr\u00eda integrar con Railway cron o edge functions en el futuro
    pass

