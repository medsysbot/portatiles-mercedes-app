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

from fastapi import APIRouter, HTTPException, Request, Form
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()

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


def _obtener_emails() -> list[dict]:
    """Devuelve los últimos 10 correos recibidos."""
    if not all([EMAIL_ORIGIN, EMAIL_PASSWORD, IMAP_SERVER, IMAP_PORT]):
        logger.warning("Variables de IMAP no configuradas")
        return []
    mensajes: list[dict] = []
    try:
        with imaplib.IMAP4_SSL(IMAP_SERVER, int(IMAP_PORT)) as imap:
            imap.login(EMAIL_ORIGIN, EMAIL_PASSWORD)
            imap.select("INBOX")
            status, data = imap.search(None, "ALL")
            if status != "OK":
                return []
            ids = data[0].split()
            for uid in reversed(ids[-10:]):
                stat, msg_data = imap.fetch(uid, "(RFC822)")
                if stat != "OK" or not msg_data:
                    continue
                msg = email.message_from_bytes(msg_data[0][1])
                fecha = parsedate_to_datetime(msg.get("Date"))
                cuerpo = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        ctype = part.get_content_type()
                        disp = part.get_content_disposition()
                        if ctype == "text/plain" and disp in (None, "inline"):
                            cuerpo = part.get_payload(decode=True).decode(errors="ignore")
                            break
                else:
                    cuerpo = msg.get_payload(decode=True).decode(errors="ignore")
                mensajes.append(
                    {
                        "fecha": fecha.strftime("%Y-%m-%d %H:%M"),
                        "remitente": parseaddr(msg.get("From"))[1],
                        "asunto": msg.get("Subject") or "(sin asunto)",
                        "cuerpo": cuerpo,
                    }
                )
    except Exception as exc:  # pragma: no cover - dependencias externas
        logger.exception("Error leyendo emails: %s", exc)
    return mensajes


@router.get("/admin/api/emails")
async def listar_emails():
    """API con los últimos correos recibidos."""
    return JSONResponse(content=_obtener_emails())


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
        raise HTTPException(status_code=500, detail="Error enviando correo")

    return {"ok": True}
