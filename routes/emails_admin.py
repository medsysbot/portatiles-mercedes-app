"""
----------------------------------------------------------
Archivo: routes/emails_admin.py
Descripción: Gestión de e-mails administrativos
Acceso: Privado
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from __future__ import annotations

import logging
import os
import smtplib
import imaplib
import email
from email.message import EmailMessage
from email.utils import parsedate_to_datetime, parseaddr

from dotenv import load_dotenv

from fastapi import APIRouter, HTTPException, Request, Form
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()

# Cargar variables de entorno desde el archivo .env
load_dotenv()

EMAIL_ORIGIN = os.getenv("EMAIL_ORIGEN")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = os.getenv("SMTP_PORT")
IMAP_SERVER = os.getenv("IMAP_SERVER") or "imap.gmail.com"
IMAP_PORT = os.getenv("IMAP_PORT") or 993

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "emails_admin.log")
logger = logging.getLogger("emails_admin")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

TEMPLATES = Jinja2Templates(directory="templates")
TEMPLATES.env.globals["gmail_user"] = EMAIL_ORIGIN





@router.post("/admin/emails/enviar")
async def enviar_email(
    destino: str = Form(...),
    asunto: str = Form(...),
    cuerpo: str = Form(...),
):
    """Envía un correo desde la cuenta configurada."""
    if not all([EMAIL_ORIGIN, EMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT]):
        raise HTTPException(status_code=500, detail="SMTP no configurado")

    msg = EmailMessage()
    msg["From"] = EMAIL_ORIGIN
    msg["To"] = destino
    msg["Subject"] = asunto
    msg.set_content(cuerpo)

    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, int(SMTP_PORT)) as smtp:
            smtp.login(EMAIL_ORIGIN, EMAIL_PASSWORD)
            smtp.send_message(msg)
        logger.info("Correo enviado a %s", destino)
    except Exception as exc:  # pragma: no cover - dependencias externas
        logger.exception("Error enviando correo: %s", exc)
        raise HTTPException(status_code=500, detail=f"Error enviando correo: {exc}")

    return {"ok": True}
