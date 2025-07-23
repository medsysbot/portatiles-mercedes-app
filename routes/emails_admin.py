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
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from supabase import create_client, Client
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

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

BUCKET = "emails-adjuntos"
TABLA = "emails_enviados"

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

    urls_adjuntos: list[dict] = []
    if adjuntos:
        bucket = supabase.storage.from_(BUCKET) if supabase else None
        for archivo in adjuntos:
            if not archivo.filename:
                continue
            datos = await archivo.read()
            if not datos:
                continue
            mime = obtener_tipo_archivo(datos)
            if mime == "desconocido":
                continue
            nombre = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{archivo.filename}"
            if bucket:
                try:
                    bucket.upload(nombre, datos, {"content-type": mime})
                    url = bucket.get_public_url(nombre)
                    urls_adjuntos.append({"nombre": archivo.filename, "url": url})
                except Exception as exc:
                    logger.error("Error subiendo adjunto: %s", exc)
            msg.add_attachment(datos, maintype=mime.split('/')[0], subtype=mime.split('/')[1], filename=archivo.filename)

    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, int(SMTP_PORT)) as smtp:
            smtp.login(EMAIL_ORIGIN, EMAIL_PASSWORD)
            smtp.send_message(msg)
        logger.info("Correo enviado a %s", destino)
    except Exception as exc:  # pragma: no cover - dependencias externas
        logger.exception("Error enviando correo: %s", exc)
        raise HTTPException(status_code=500, detail=f"Error enviando correo: {exc}")

    if supabase:
        registro = {
            "fecha": datetime.utcnow().isoformat(),
            "email_origen": EMAIL_ORIGIN,
            "email_destino": destino,
            "asunto": asunto,
            "mensaje": cuerpo,
            "adjuntos": urls_adjuntos,
        }
        try:
            supabase.table(TABLA).insert(registro).execute()
        except Exception as exc:
            logger.error("Error registrando email en base: %s", exc)

    return {"ok": True}


@router.get("/admin/api/emails")
async def listar_emails(usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        return []
    try:
        res = (
            supabase.table(TABLA)
            .select("id,fecha,email_origen,email_destino,asunto,mensaje,adjuntos")
            .order("fecha", desc=True)
            .execute()
        )
        return res.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/admin/api/emails/{id}")
async def obtener_email(id: int, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=404, detail="No disponible")
    try:
        res = (
            supabase.table(TABLA)
            .select("id,fecha,email_origen,email_destino,asunto,mensaje,adjuntos")
            .eq("id", id)
            .single()
            .execute()
        )
        if getattr(res, "data", None):
            return res.data
        raise HTTPException(status_code=404, detail="Email no encontrado")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
