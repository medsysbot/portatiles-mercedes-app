import os
import smtplib
from email.message import EmailMessage
from typing import Iterable
from fastapi import UploadFile
from utils.file_utils import obtener_tipo_archivo

EMAIL_ORIGEN = os.getenv("EMAIL_ORIGEN")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = os.getenv("SMTP_PORT")


async def enviar_email(destino: str, asunto: str, cuerpo: str, adjuntos: Iterable[UploadFile] | None = None) -> None:
    """Envía un email usando el backend de Gmail con adjuntos opcionales."""
    if not all([EMAIL_ORIGEN, EMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT]):
        raise Exception("SMTP no configurado")

    msg = EmailMessage()
    msg["From"] = EMAIL_ORIGEN
    msg["To"] = destino
    msg["Subject"] = asunto
    msg.set_content(cuerpo)

    if adjuntos:
        for archivo in adjuntos:
            if not getattr(archivo, "filename", None):
                continue
            datos = await archivo.read()
            if not datos:
                continue
            mime = obtener_tipo_archivo(datos)
            if mime == "desconocido":
                continue
            maintype, subtype = mime.split("/", 1)
            msg.add_attachment(datos, maintype=maintype, subtype=subtype, filename=archivo.filename)

    with smtplib.SMTP_SSL(SMTP_SERVER, int(SMTP_PORT)) as smtp:
        smtp.login(EMAIL_ORIGEN, EMAIL_PASSWORD)
        smtp.send_message(msg)
