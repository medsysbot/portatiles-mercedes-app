"""
----------------------------------------------------------
Archivo: routes/ventas.py
Descripción: Rutas y lógica para el registro de ventas
Acceso: Privado
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-15
----------------------------------------------------------
"""

"""Rutas y lógica para el registro de ventas."""

from datetime import datetime, date
import os

from fastapi import APIRouter, HTTPException, Depends
from utils.auth_utils import auth_required
from pydantic import BaseModel
from fpdf import FPDF
from supabase import create_client, Client

# ==== Configuración de Supabase ====
# Configurar la conexión con Supabase usando las variables de entorno
SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    print(
        "Advertencia: SUPABASE_URL y SERVICE_ROLE_KEY no estan configurados. "
        "La conexión a Supabase estará deshabilitada."
    )
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

router = APIRouter()

# ==== Modelo de datos ====

class Venta(BaseModel):
    """Modelo de validación para el registro de una venta."""

    cliente_nombre: str
    dni: str
    tipo_banio: str
    cantidad: int
    direccion_entrega: str
    fecha_venta: date
    observaciones: str | None = None

# ==== Endpoints ====

@router.post("/registrar_venta")
async def registrar_venta(venta: Venta, user: dict = Depends(auth_required)):
    """Guarda la venta, genera el comprobante PDF y retorna su URL."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    if user.get("rol") != "Administrador":
# ==== Lógica de guardado ====
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        datos = venta.model_dump()
        datos["fecha_venta"] = venta.fecha_venta.isoformat()

        # Generar el comprobante PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.cell(0, 10, "Comprobante de Venta", ln=1)
        pdf.cell(0, 10, f"Cliente: {venta.cliente_nombre}", ln=1)
        pdf.cell(0, 10, f"DNI: {venta.dni}", ln=1)
        pdf.cell(0, 10, f"Tipo de baño: {venta.tipo_banio}", ln=1)
        pdf.cell(0, 10, f"Cantidad: {venta.cantidad}", ln=1)
        pdf.cell(0, 10, f"Dirección: {venta.direccion_entrega}", ln=1)
        pdf.cell(0, 10, f"Fecha: {venta.fecha_venta.isoformat()}", ln=1)
        if venta.observaciones:
            pdf.multi_cell(0, 10, f"Observaciones: {venta.observaciones}")
        pdf_bytes = pdf.output(dest="S").encode("latin1")

        # Subir el PDF al bucket correspondiente
        bucket_name = "ventas-boletos"
        try:
            supabase.storage.create_bucket(bucket_name)
        except Exception:
            pass
        nombre_archivo = (
            f"venta_{venta.dni}_{venta.fecha_venta.isoformat()}.pdf"
        )
        supabase.storage.from_(bucket_name).upload(nombre_archivo, pdf_bytes)
        url = supabase.storage.from_(bucket_name).get_public_url(nombre_archivo)

        # Guardar la venta en la tabla junto con la URL del PDF
        datos["pdf_url"] = url
        respuesta = supabase.table("ventas").insert(datos).execute()
        if (
            not respuesta.data
            or (hasattr(respuesta, "status_code") and respuesta.status_code != 200)
            or getattr(respuesta, "error", None) is not None
        ):
            raise HTTPException(
                status_code=400,
                detail=str(getattr(respuesta, "error", "Error en Supabase")),
            )

        return {"mensaje": "Venta registrada con éxito", "pdf_url": url}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
