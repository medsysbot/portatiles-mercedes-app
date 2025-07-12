"""
----------------------------------------------------------
Archivo: routes/facturas_pendientes.py
Descripción: Rutas para el módulo de facturas pendientes
Acceso: Privado
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from datetime import date, datetime
import logging
import os
from decimal import Decimal, DecimalException
from dotenv import load_dotenv

from fastapi import APIRouter, HTTPException, Request, UploadFile, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, ValidationError
from fpdf import FPDF
import tempfile
from supabase import create_client, Client

load_dotenv()

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "facturas_pendientes.log")
logger = logging.getLogger("facturas_pendientes")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

TEMPLATES = Jinja2Templates(directory="templates")
TABLA = "facturas_pendientes"
BUCKET = "factura"

def _validar_factura(nombre: str, content_type: str, tamano: int) -> None:
    ext = os.path.splitext(nombre)[1].lower()
    if ext not in {".pdf", ".png", ".jpg", ".jpeg"}:
        raise HTTPException(status_code=400, detail="Formato no permitido")
    if content_type not in {"application/pdf", "image/png", "image/jpeg"}:
        raise HTTPException(status_code=400, detail="Tipo no permitido")
    if tamano > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Archivo demasiado grande")

def _convertir_a_pdf(data: bytes, extension: str) -> bytes:
    """Convierte una imagen a PDF si es necesario y devuelve el contenido."""
    if extension == ".pdf":
        return data

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

class FacturaPendiente(BaseModel):
    fecha: date
    numero_factura: str
    dni_cuit_cuil: str
    razon_social: str
    nombre_cliente: str
    monto_adeudado: Decimal
    factura_url: str | None = None

@router.get("/admin/facturas_pendientes", response_class=HTMLResponse)
async def facturas_pendientes_admin(request: Request):
    """Vista principal del listado de facturas pendientes."""
    logger.info("Vista facturas pendientes solicitada")
    return TEMPLATES.TemplateResponse(
        "facturas_pendientes.html", {"request": request}
    )

@router.get("/admin/facturas_pendientes/nueva", response_class=HTMLResponse)
async def form_nueva_factura(request: Request):
    """Formulario para crear una factura pendiente."""
    logger.info("Vista nueva factura pendiente solicitada")
    return TEMPLATES.TemplateResponse(
        "facturas_pendientes_form.html", {"request": request}
    )

@router.post("/admin/facturas_pendientes/nueva")
async def crear_factura(request: Request):
    """Guarda un registro de factura pendiente en la base."""
    if not supabase:
        logger.error("Supabase no configurado al crear factura")
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    archivo: UploadFile | None = None
    if request.headers.get("content-type", "").startswith("application/json"):
        datos_req = await request.json()
    else:
        form = await request.form()
        datos_req = dict(form)
        archivo = form.get("factura")  # type: ignore[assignment]
        datos_req.pop("factura", None)
    logger.info("Crear factura datos recibidos: %s", datos_req)

    try:
        datos_req["monto_adeudado"] = Decimal(str(datos_req.get("monto_adeudado")))
        factura = FacturaPendiente(**datos_req)
    except (ValidationError, DecimalException) as exc:  # type: ignore[name-defined]
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    datos = factura.model_dump()
    datos["fecha"] = factura.fecha.isoformat()
    datos["monto_adeudado"] = float(factura.monto_adeudado)
    datos["factura_url"] = None
    
    if isinstance(archivo, UploadFile) and archivo.filename:
        contenido = await archivo.read()
        _validar_factura(archivo.filename, archivo.content_type or "", len(contenido))
        ext = os.path.splitext(archivo.filename)[1].lower()
        pdf_bytes = _convertir_a_pdf(contenido, ext)
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        nombre_pdf = f"factura-{id_factura}-{timestamp}.pdf"
        bucket = supabase.storage.from_(BUCKET)

    try:
        logger.info(f"Subiendo archivo: {nombre_pdf}")
        bucket.upload(
            nombre_pdf,
            pdf_bytes,
            {"content-type": "application/pdf", "x-upsert": "true"},
        )
        factura_url = bucket.get_public_url(nombre_pdf)
        logger.info(f"Factura URL generada: {factura_url}")

        actualizacion = supabase.table(TABLA).update(
            {"factura_url": factura_url}
        ).eq("id_factura", id_factura).execute()

        if getattr(actualizacion, "error", None):
            raise Exception(actualizacion.error.message)
        logger.info("URL guardada correctamente en la tabla.")
    except Exception as exc:  # pragma: no cover
        logger.exception("Error subiendo factura:")
        raise HTTPException(status_code=500, detail="Error al guardar la factura.")
        

    try:
        insercion = supabase.table(TABLA).insert(datos).execute()
        if getattr(insercion, "error", None):
            raise Exception(insercion.error.message)
        if not insercion.data:
            raise Exception("Inserción sin datos devueltos")
        id_factura = insercion.data[0].get("id_factura") or insercion.data[0].get("id")
    except Exception as exc:  # pragma: no cover
        logger.exception("Error guardando factura:")
        raise HTTPException(status_code=500, detail=f"Error al guardar factura: {exc}")
        try:
            insercion = supabase.table(TABLA).insert(datos).execute()
    if getattr(insercion, "error", None):
        raise Exception(insercion.error.message)
    if not insercion.data:
        raise Exception("Inserción sin datos devueltos")
    id_factura = insercion.data[0].get("id_factura") or insercion.data[0].get("id")
    if isinstance(archivo, UploadFile) and archivo.filename:
        contenido = await archivo.read()
        _validar_factura(archivo.filename, archivo.content_type or "", len(contenido))
        ext = os.path.splitext(archivo.filename)[1].lower()
        pdf_bytes = _convertir_a_pdf(contenido, ext)
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        nombre_pdf = f"factura-{id_factura}-{timestamp}.pdf"
        bucket = supabase.storage.from_(BUCKET)
        try:
            logger.info(f"Subiendo archivo: {nombre_pdf}")
            bucket.upload(
                nombre_pdf,
                pdf_bytes,
                {"content-type": "application/pdf", "x-upsert": "true"},
            )
            factura_url = bucket.get_public_url(nombre_pdf)
            logger.info(f"Factura URL generada: {factura_url}")
            actualizacion = supabase.table(TABLA).update(
                {"factura_url": factura_url}
            ).eq("id_factura", id_factura).execute()
            if getattr(actualizacion, "error", None):
                raise Exception(actualizacion.error.message)
            logger.info("URL guardada correctamente en la tabla.")
        except Exception as exc:  # pragma: no cover
            logger.exception("Error subiendo factura:")
            raise HTTPException(status_code=500, detail="Error al guardar la factura.")
except Exception as exc:  # pragma: no cover
    logger.exception("Error guardando factura:")
    raise HTTPException(status_code=500, detail=f"Error al guardar factura: {exc}")

@router.get("/admin/api/clientes/busqueda")
async def buscar_clientes(q: str = Query("")):
    """Busca clientes por DNI, CUIT/CUIL, nombre o razón social."""
    if not supabase:
        logger.warning("Supabase no configurado al buscar clientes")
        return {"clientes": []}

    try:
        res = supabase.table("datos_personales_clientes").select("dni_cuit_cuil,nombre,apellido,razon_social").execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        lista = res.data or []
        q_low = q.lower()
        filtrados = [
            {
                "dni_cuit_cuil": c.get("dni_cuit_cuil"),
                "nombre": f"{c.get('nombre','')} {c.get('apellido','')}".strip(),
                "razon_social": c.get("razon_social") or "",
            }
            for c in lista
            if q_low in (c.get("dni_cuit_cuil") or "").lower()
            or q_low in (c.get("nombre") or "").lower()
            or q_low in (c.get("apellido") or "").lower()
            or q_low in (c.get("razon_social") or "").lower()
        ]
        return {"clientes": filtrados}
    except Exception as exc:
        logger.exception("Error buscando clientes:")
        raise HTTPException(status_code=500, detail=str(exc))

@router.get("/admin/api/facturas_pendientes")
async def listar_facturas():
    """Devuelve la lista completa de facturas pendientes."""
    if not supabase:
        logger.warning("Supabase no configurado al listar facturas")
        return []

    try:
        res = supabase.table(TABLA).select("*").execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:  # pragma: no cover
        logger.exception("Error consultando facturas:")
        raise HTTPException(status_code=500, detail=str(exc))

class _IdLista(BaseModel):
    ids: list[int]

@router.post("/admin/api/facturas_pendientes/eliminar")
async def eliminar_facturas(payload: _IdLista):
    """Elimina facturas pendientes por ID."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        supabase.table(TABLA).delete().in_("id_factura", payload.ids).execute()
    except Exception as exc:  # pragma: no cover
        logger.exception("Error eliminando facturas:")
        raise HTTPException(status_code=500, detail=str(exc))
    return {"ok": True}
