"""
----------------------------------------------------------
Archivo: routes/ventas.py
Descripción: Rutas y lógica para el registro de ventas
Acceso: Privado
Proyecto: Portátiles Mercedes
Última modificación: 2025-07-01
----------------------------------------------------------
"""

"""Rutas y lógica para el registro de ventas."""

from datetime import date
import logging
import os

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, ValidationError
from fpdf import FPDF
from supabase import create_client, Client
from utils.email_sender import enviar_email

router = APIRouter()

# ==== Supabase ====
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "ventas.log")
logger = logging.getLogger("ventas")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

TEMPLATES = Jinja2Templates(directory="templates")
TEMPLATES.env.globals["gmail_user"] = os.getenv("EMAIL_ORIGEN")
VENTAS_TABLE = "ventas"

# ==== Configuración de correo ====
EMAIL_ORIGEN = os.getenv("EMAIL_ORIGEN")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = os.getenv("SMTP_PORT")


class VentaPublica(BaseModel):
    cliente_nombre: str
    dni_cuit_cuil: str
    tipo_bano: str
    cantidad: int
    direccion_entrega: str
    fecha_venta: date
    observaciones: str | None = None


class VentaNueva(BaseModel):
    fecha_operacion: date
    tipo_bano: str
    dni_cuit_cuil: str
    nombre_cliente: str
    forma_pago: str
    observaciones: str | None = None


@router.post("/registrar_venta")
async def registrar_venta(venta: VentaPublica):
    """Guarda la venta recibida desde el formulario público."""
    try:
        if supabase:
            datos = {
                "fecha_operacion": venta.fecha_venta.isoformat(),
                "tipo_bano": venta.tipo_bano,
                "dni_cuit_cuil": venta.dni_cuit_cuil,
                "nombre_cliente": venta.cliente_nombre,
                "forma_pago": "otro",
                "observaciones": venta.observaciones,
            }
            resp = supabase.table(VENTAS_TABLE).insert(datos).execute()
            if getattr(resp, "error", None):
                raise Exception(resp.error.message)

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.cell(0, 10, "Comprobante de Venta", ln=1)
        pdf.cell(0, 10, f"Cliente: {venta.cliente_nombre}", ln=1)
        pdf.cell(0, 10, f"DNI: {venta.dni_cuit_cuil}", ln=1)
        pdf.cell(0, 10, f"Tipo de baño: {venta.tipo_bano}", ln=1)
        pdf.cell(0, 10, f"Cantidad: {venta.cantidad}", ln=1)
        pdf.cell(0, 10, f"Dirección: {venta.direccion_entrega}", ln=1)
        pdf.cell(0, 10, f"Fecha: {venta.fecha_venta.isoformat()}", ln=1)
        if venta.observaciones:
            pdf.multi_cell(0, 10, f"Observaciones: {venta.observaciones}")
        pdf.output(dest="S").encode("latin1")

        cuerpo = (
            f"Cliente: {venta.cliente_nombre}\n"
            f"DNI/CUIT/CUIL: {venta.dni_cuit_cuil}\n"
            f"Tipo de baño: {venta.tipo_bano}\n"
            f"Cantidad: {venta.cantidad}\n"
            f"Dirección: {venta.direccion_entrega}\n"
            f"Fecha: {venta.fecha_venta}\n"
            f"Observaciones: {venta.observaciones or ''}"
        )
        EMAIL_ORIGEN = os.getenv("EMAIL_ORIGEN")
        if not EMAIL_ORIGEN:
            raise HTTPException(status_code=500, detail="Email de origen no configurado")
        try:
            await enviar_email(EMAIL_ORIGEN, "Nuevo formulario de Venta enviado", cuerpo)
            logger.info("Correo de venta enviado")
        except Exception as exc:  # pragma: no cover - dependencias externas
            logger.exception("Error enviando correo de venta: %s", exc)
            raise HTTPException(status_code=500, detail="No se pudo enviar el correo de venta")

        return {"mensaje": "Venta registrada"}
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover
        logger.exception("Error registrando venta:")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/admin/ventas/nueva", response_class=HTMLResponse)
async def form_nueva_venta(request: Request):
    """Muestra el formulario para crear una venta."""
    return TEMPLATES.TemplateResponse("ventas_form.html", {"request": request})


@router.post("/admin/ventas/nueva")
async def crear_venta(request: Request):
    """Crea un registro de venta en la tabla de Supabase."""
    if not supabase:
        logger.error("Supabase no configurado al crear venta")
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    if request.headers.get("content-type", "").startswith("application/json"):
        datos_req = await request.json()
    else:
        form = await request.form()
        datos_req = dict(form)

    try:
        venta = VentaNueva(**datos_req)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    datos = venta.model_dump()
    datos["fecha_operacion"] = venta.fecha_operacion.isoformat()

    try:
        result = supabase.table(VENTAS_TABLE).insert(datos).execute()
        if getattr(result, "error", None):
            raise Exception(result.error.message)
    except Exception as exc:  # pragma: no cover
        logger.exception("Error al guardar venta:")
        return {"error": f"Error al guardar venta: {exc}"}

    cuerpo = (
        f"Fecha de operación: {venta.fecha_operacion}\n"
        f"Tipo de baño: {venta.tipo_bano}\n"
        f"DNI/CUIT/CUIL: {venta.dni_cuit_cuil}\n"
        f"Nombre cliente: {venta.nombre_cliente}\n"
        f"Forma de pago: {venta.forma_pago}\n"
        f"Observaciones: {venta.observaciones or ''}"
    )
    try:
        await enviar_email(EMAIL_ORIGEN, "Nuevo formulario de Venta enviado", cuerpo)
        logger.info("Correo de venta enviado")
    except Exception as exc:  # pragma: no cover - dependencias externas
        logger.exception("Error enviando correo de venta: %s", exc)

    if request.headers.get("content-type", "").startswith("application/json"):
        return {"ok": True}
    return RedirectResponse("/admin/ventas", status_code=303)


@router.get("/admin/api/ventas")
async def listar_ventas():
    """Devuelve la lista completa de ventas."""
    if not supabase:
        logger.warning("Supabase no configurado al listar ventas")
        return []

    try:
        res = supabase.table(VENTAS_TABLE).select("*").execute()
    except Exception as exc:  # pragma: no cover - posibles fallos de conexión
        logger.exception("Error de conexión al listar ventas:")
        raise HTTPException(status_code=500, detail=f"Error de conexión: {exc}")

    if getattr(res, "error", None):
        logger.error("Error en consulta de ventas: %s", res.error)
        raise HTTPException(status_code=500, detail=f"Error en consulta: {res.error.message}")

    data = getattr(res, "data", None)
    if not data:
        logger.warning("Consulta de ventas sin datos")
        return []

    # Reemplazar caracteres inválidos para evitar errores de codificación
    for registro in data:
        for key, value in registro.items():
            if isinstance(value, str):
                registro[key] = value.encode("utf-8", "replace").decode("utf-8")

    # Normalizar campos para el frontend
    normalizados = []
    for item in data:
        normalizados.append(
            {
                "id_venta": item.get("id_venta") or item.get("id"),
                "fecha_operacion": item.get("fecha_operacion"),
                "tipo_bano": item.get("tipo_bano"),
                "dni_cuit_cuil": item.get("dni_cuit_cuil"),
                "nombre_cliente": item.get("nombre_cliente"),
                "forma_pago": item.get("forma_pago"),
                "observaciones": item.get("observaciones"),
            }
        )

    return normalizados


class _IdLista(BaseModel):
    ids: list[int]


@router.post("/admin/api/ventas/eliminar")
async def eliminar_ventas(payload: _IdLista):
    """Elimina ventas por ID."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        supabase.table(VENTAS_TABLE).delete().in_("id_venta", payload.ids).execute()
    except Exception as exc:  # pragma: no cover
        logger.exception("Error eliminando ventas:")
        raise HTTPException(status_code=500, detail=str(exc))
    return {"ok": True}
