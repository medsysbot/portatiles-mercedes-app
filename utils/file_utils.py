import os
import tempfile
from fpdf import FPDF


def obtener_tipo_archivo(data: bytes) -> str:
    """Devuelve el MIME real del archivo o 'desconocido'."""
    if data.startswith(b"%PDF"):
        return "application/pdf"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data[0:2] == b"\xff\xd8":
        return "image/jpeg"
    return "desconocido"


def imagen_a_pdf(data: bytes, extension: str) -> bytes:
    """Convierte una imagen a PDF y devuelve los bytes generados."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
        tmp.write(data)
        tmp.flush()
        imagen_path = tmp.name

    pdf = FPDF()
    pdf.add_page()
    pdf.image(imagen_path, x=10, y=10, w=190)
    pdf_bytes = pdf.output(dest="S").encode("latin1")
    os.unlink(imagen_path)
    return pdf_bytes
