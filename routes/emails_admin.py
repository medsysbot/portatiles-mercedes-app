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

from fastapi import APIRouter, HTTPException, Request, Form, UploadFile, File, Depends
from fastapi.responses import JSONResponse, HTMLResponse, Response
from fastapi.templating import Jinja2Templates
from datetime import datetime
from utils.file_utils import obtener_tipo_archivo
from utils.auth_utils import auth_required

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


@router.get("/admin/emails", response_class=HTMLResponse)
async def emails_admin_page(request: Request, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse("emails_admin.html", {"request": request})





@router.post("/admin/emails/enviar")
async def enviar_email(
    destino: str = Form(...),
    asunto: str = Form(...),
    cuerpo: str = Form(...),
    adjuntos: list[UploadFile] | None = File(None),
    usuario=Depends(auth_required),
):
    """Envía un correo desde la cuenta configurada."""
    if not all([EMAIL_ORIGIN, EMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT]):
        raise HTTPException(status_code=500, detail="SMTP no configurado")

    msg = EmailMessage()
    msg["From"] = EMAIL_ORIGIN
    msg["To"] = destino
    msg["Subject"] = asunto
    msg.set_content(cuerpo)

    if adjuntos:
        for archivo in adjuntos:
            if not archivo.filename:
                continue
            datos = await archivo.read()
            if not datos:
                continue
            mime = obtener_tipo_archivo(datos)
            if mime == "desconocido":
                continue
            maintype, subtype = mime.split("/", 1)
            msg.add_attachment(datos, maintype=maintype, subtype=subtype, filename=archivo.filename)

    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, int(SMTP_PORT)) as smtp:
            smtp.login(EMAIL_ORIGIN, EMAIL_PASSWORD)
            smtp.send_message(msg)
        logger.info("Correo enviado a %s", destino)
    except Exception as exc:  # pragma: no cover - dependencias externas
        logger.exception("Error enviando correo: %s", exc)
        raise HTTPException(status_code=500, detail=f"Error enviando correo: {exc}")

    return {"ok": True}


@router.get("/api/emails/ultimos")
async def ultimos_emails(usuario=Depends(auth_required)):
    """Devuelve los últimos 10 correos recibidos en la bandeja de entrada."""
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")

    mensajes: list[dict] = []
    try:
        with imaplib.IMAP4_SSL(IMAP_SERVER, int(IMAP_PORT)) as imap:
            imap.login(EMAIL_ORIGIN, EMAIL_PASSWORD)
            imap.select("INBOX")
            status, data = imap.search(None, "ALL")
            if status == "OK" and data and data[0]:
                ids = data[0].split()[-10:]
                for uid in ids:
                    status, msg_data = imap.fetch(uid, "(RFC822)")
                    if status != "OK" or not msg_data:
                        continue
                    msg = email.message_from_bytes(msg_data[0][1])
                    fecha = parsedate_to_datetime(msg.get("Date")).isoformat()
                    de = parseaddr(msg.get("From"))[1]
                    asunto = msg.get("Subject", "")
                    cuerpo = ""
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain" and not part.get_filename():
                            cuerpo = part.get_payload(decode=True).decode(
                                part.get_content_charset() or "utf-8",
                                errors="replace",
                            )
                            break
                    snippet = "\n".join(cuerpo.strip().splitlines()[:2])
                    mensajes.append({
                        "uid": uid.decode(),
                        "mailbox": "INBOX",
                        "fecha": fecha,
                        "email_origen": de,
                        "asunto": asunto,
                        "mensaje": snippet,
                    })
    except Exception as exc:  # pragma: no cover - dependencias externas
        logger.exception("Error listando correos: %s", exc)
        raise HTTPException(status_code=500, detail="Error obteniendo emails")

    mensajes.sort(key=lambda m: m["fecha"], reverse=True)
    return mensajes


@router.get("/admin/api/emails")
async def listar_emails(q: str | None = None, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")

    mensajes: list[dict] = []
    try:
        with imaplib.IMAP4_SSL(IMAP_SERVER, int(IMAP_PORT)) as imap:
            imap.login(EMAIL_ORIGIN, EMAIL_PASSWORD)
            for mailbox in ["INBOX", '"[Gmail]/Sent Mail"']:
                imap.select(mailbox)
                criterio = "ALL"
                if q:
                    criterio = f'(OR SUBJECT "{q}" FROM "{q}")'
                status, data = imap.search(None, criterio)
                if status != "OK" or not data or not data[0]:
                    continue
                ids = data[0].split()[-20:]
                for uid in ids:
                    status, msg_data = imap.fetch(uid, "(RFC822)")
                    if status != "OK" or not msg_data:
                        continue
                    msg = email.message_from_bytes(msg_data[0][1])
                    fecha = parsedate_to_datetime(msg.get("Date")).isoformat()
                    de = parseaddr(msg.get("From"))[1]
                    para = parseaddr(msg.get("To"))[1]
                    asunto = msg.get("Subject", "")
                    cuerpo = ""
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain" and not part.get_filename():
                            cuerpo = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors="replace")
                            break
                    snippet = "\n".join(cuerpo.strip().splitlines()[:2])
                    mensajes.append({
                        "uid": uid.decode(),
                        "mailbox": mailbox,
                        "fecha": fecha,
                        "email_origen": de,
                        "email_destino": para,
                        "asunto": asunto,
                        "mensaje": snippet,
                    })
    except Exception as exc:  # pragma: no cover - dependencias externas
        logger.exception("Error listando correos: %s", exc)
        raise HTTPException(status_code=500, detail="Error obteniendo emails")

    mensajes.sort(key=lambda m: m["fecha"], reverse=True)
    return mensajes[:10]

@router.get("/admin/api/emails/{mailbox}/{uid}")
async def obtener_email(mailbox: str, uid: str, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")

    try:
        with imaplib.IMAP4_SSL(IMAP_SERVER, int(IMAP_PORT)) as imap:
            imap.login(EMAIL_ORIGIN, EMAIL_PASSWORD)
            imap.select(mailbox)
            status, data = imap.fetch(uid, "(RFC822)")
            if status != "OK" or not data:
                raise HTTPException(status_code=404, detail="Email no encontrado")
            msg = email.message_from_bytes(data[0][1])
            fecha = parsedate_to_datetime(msg.get("Date")).isoformat()
            de = parseaddr(msg.get("From"))[1]
            para = parseaddr(msg.get("To"))[1]
            asunto = msg.get("Subject", "")
            cuerpo = ""
            adjuntos: list[str] = []
            for part in msg.walk():
                if part.get_filename():
                    adjuntos.append(part.get_filename())
                elif part.get_content_type() == "text/plain" and not cuerpo:
                    cuerpo = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors="replace")
            return {
                "uid": uid,
                "mailbox": mailbox,
                "fecha": fecha,
                "email_origen": de,
                "email_destino": para,
                "asunto": asunto,
                "cuerpo": cuerpo,
                "adjuntos": adjuntos,
            }
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - dependencias externas
        logger.exception("Error obteniendo email: %s", exc)
        raise HTTPException(status_code=500, detail="Error obteniendo email")


@router.get("/admin/api/emails/{mailbox}/{uid}/adjunto/{indice}")
async def descargar_adjunto(mailbox: str, uid: str, indice: int, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    try:
        with imaplib.IMAP4_SSL(IMAP_SERVER, int(IMAP_PORT)) as imap:
            imap.login(EMAIL_ORIGIN, EMAIL_PASSWORD)
            imap.select(mailbox)
            status, data = imap.fetch(uid, "(RFC822)")
            if status != "OK" or not data:
                raise HTTPException(status_code=404, detail="Adjunto no encontrado")
            msg = email.message_from_bytes(data[0][1])
            archivos = [p for p in msg.walk() if p.get_filename()]
            if indice < 0 or indice >= len(archivos):
                raise HTTPException(status_code=404, detail="Adjunto no encontrado")
            part = archivos[indice]
            nombre = part.get_filename()
            contenido = part.get_payload(decode=True)
            mime = part.get_content_type()
            headers = {"Content-Disposition": f"attachment; filename={nombre}"}
            return Response(contenido, media_type=mime, headers=headers)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - dependencias externas
        logger.exception("Error descargando adjunto: %s", exc)
        raise HTTPException(status_code=500, detail="Error descargando adjunto")


@router.delete("/admin/api/emails/{mailbox}/{uid}")
async def eliminar_email(mailbox: str, uid: str, usuario=Depends(auth_required)):
    """Elimina un email de la bandeja especificada."""
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    try:
        with imaplib.IMAP4_SSL(IMAP_SERVER, int(IMAP_PORT)) as imap:
            imap.login(EMAIL_ORIGIN, EMAIL_PASSWORD)
            imap.select(mailbox)
            imap.store(uid, "+FLAGS", "\\Deleted")
            imap.expunge()
        logger.info("Email %s eliminado de %s", uid, mailbox)
        return {"ok": True}
    except Exception as exc:  # pragma: no cover - dependencias externas
        logger.exception("Error eliminando email: %s", exc)
        raise HTTPException(status_code=500, detail="Error eliminando email")
