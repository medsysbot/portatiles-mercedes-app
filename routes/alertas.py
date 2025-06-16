"""
----------------------------------------------------------
Archivo: routes/alertas.py
Descripción: Sistema de alertas automáticas
Última modificación: 2025-06-15
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

"""Sistema de alertas automáticas."""

from datetime import date, timedelta
import os
import smtplib
from email.message import EmailMessage

from fastapi import APIRouter, HTTPException


# Configuración para enviar correos
EMAIL_ORIGIN = os.getenv("EMAIL_ORIGIN")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = os.getenv("SMTP_PORT")

if not all([EMAIL_ORIGIN, EMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT]):
    print(
        "Advertencia: variables de correo no configuradas. "
        "Las notificaciones por email est\u00e1n deshabilitadas."
    )
    EMAIL_ORIGIN = EMAIL_PASSWORD = SMTP_SERVER = SMTP_PORT = None

router = APIRouter()


def enviar_correo(destinatario: str, asunto: str, mensaje: str) -> None:
    """Envía un correo electrónico simple."""

    if not all([EMAIL_ORIGIN, EMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT]):
        print(
            "Advertencia: no se pudo enviar correo porque las variables de "
            "SMTP no est\u00e1n configuradas."
        )
        return

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
    pass


def alertas_proxima_limpieza() -> None:
    """Notifica cuando corresponde una limpieza."""
    pass


def alertas_pagos_vencidos() -> None:
    """Envía recordatorios por pagos vencidos."""
    pass


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

