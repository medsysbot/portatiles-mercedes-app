"""
----------------------------------------------------------
Archivo: routes/morosos.py
Descripción: Rutas para el módulo de morosos
Acceso: Privado
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from datetime import date
import logging
import os
from decimal import Decimal, DecimalException

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, ValidationError
from supabase import create_client, Client
from postgrest.exceptions import APIError

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "morosos.log")
logger = logging.getLogger("morosos")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

TEMPLATES = Jinja2Templates(directory="templates")
TEMPLATES.env.globals["gmail_user"] = os.getenv("EMAIL_ORIGEN")
TABLA = "morosos"


class MorosoNuevo(BaseModel):
    fecha_facturacion: date
    numero_factura: str
    dni_cuit_cuil: str
    razon_social: str
    nombre_cliente: str
    monto_adeudado: Decimal


@router.get("/admin/morosos/nuevo", response_class=HTMLResponse)
async def form_nuevo_moroso(request: Request):
    """Muestra el formulario para crear un moroso."""
    logger.info("Vista nuevo moroso solicitada")
    return TEMPLATES.TemplateResponse("morosos_form.html", {"request": request})


@router.post("/admin/morosos/nuevo")
async def crear_moroso(request: Request):
    """Guarda un registro de moroso en la base."""
    if not supabase:
        logger.error("Supabase no configurado al crear moroso")
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    if request.headers.get("content-type", "").startswith("application/json"):
        datos_req = await request.json()
    else:
        form = await request.form()
        datos_req = dict(form)
    logger.info("Crear moroso datos recibidos: %s", datos_req)

    try:
        datos_req["monto_adeudado"] = Decimal(str(datos_req.get("monto_adeudado")))
        moroso = MorosoNuevo(**datos_req)
    except (ValidationError, DecimalException) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # --- Verificar duplicados por número de factura ---
    try:
        existente = (
            supabase.table(TABLA)
            .select("numero_factura")
            .eq("numero_factura", moroso.numero_factura)
            .maybe_single()
            .execute()
        )
    except APIError as exc:
        if exc.code == "204":
            existente = None
        else:  # pragma: no cover - otros errores de conexión
            raise HTTPException(status_code=500, detail=f"Error consultando datos: {exc}")
    except Exception as exc:  # pragma: no cover - errores de conexión
        raise HTTPException(status_code=500, detail=f"Error consultando datos: {exc}")

    if getattr(existente, "data", None):
        return {"error": "Ya existe un moroso con ese número de factura"}

    datos = moroso.model_dump()
    datos["fecha_facturacion"] = moroso.fecha_facturacion.isoformat()
    datos["monto_adeudado"] = float(moroso.monto_adeudado)

    try:
        resultado = supabase.table(TABLA).insert(datos).execute()
        if getattr(resultado, "error", None):
            raise Exception(resultado.error.message)
    except Exception as exc:  # pragma: no cover
        logger.exception("Error guardando moroso:")
        return {"error": f"Error al guardar moroso: {exc}"}

    if request.headers.get("content-type", "").startswith("application/json"):
        return {"ok": True}
    return RedirectResponse("/admin/morosos", status_code=303)


@router.get("/admin/api/morosos")
async def listar_morosos():
    """Obtiene todos los morosos desde Supabase y normaliza los campos."""

    if not supabase:
        logger.warning("Supabase no configurado al listar morosos")
        return []

    try:
        result = supabase.table(TABLA).select("*").execute()
    except Exception as exc:  # pragma: no cover - fallo de conexión
        logger.exception("Error de conexión al listar morosos:")
        raise HTTPException(status_code=500, detail=f"Error de conexión: {exc}")

    if getattr(result, "error", None):
        logger.error("Error en consulta de morosos: %s", result.error)
        raise HTTPException(status_code=500, detail=f"Error en consulta: {result.error.message}")

    data = getattr(result, "data", None)
    if not data:
        logger.warning("Consulta de morosos sin datos")
        return []

    for registro in data:
        for key, value in registro.items():
            if isinstance(value, str):
                registro[key] = value.encode("utf-8", "replace").decode("utf-8")

    normalizados = []
    for item in data:
        fecha = item.get("fecha_facturacion")
        if isinstance(fecha, date):
            fecha = fecha.isoformat()

        monto = item.get("monto_adeudado")
        if isinstance(monto, Decimal):
            monto = float(monto)

        normalizados.append(
            {
                "id_moroso": item.get("id_moroso") or item.get("id"),
                "fecha_facturacion": fecha,
                "numero_factura": item.get("numero_factura"),
                "dni_cuit_cuil": item.get("dni_cuit_cuil"),
                "razon_social": item.get("razon_social"),
                "nombre_cliente": item.get("nombre_cliente"),
                "monto_adeudado": monto,
            }
        )

    return normalizados


class _IdLista(BaseModel):
    ids: list[int]


@router.post("/admin/api/morosos/eliminar")
async def eliminar_morosos(payload: _IdLista):
    """Elimina morosos por ID."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        supabase.table(TABLA).delete().in_("id_moroso", payload.ids).execute()
    except Exception as exc:  # pragma: no cover
        logger.exception("Error eliminando morosos:")
        raise HTTPException(status_code=500, detail=str(exc))
    return {"ok": True}
