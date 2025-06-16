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

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fpdf import FPDF

supabase = None

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
async def registrar_venta(venta: Venta):
    """Guarda la venta, genera el comprobante PDF y retorna su URL."""

    try:
        datos = venta.model_dump()
        datos["fecha_venta"] = venta.fecha_venta.isoformat()

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
        pdf.output(dest="S").encode("latin1")

        return {"mensaje": "Venta registrada"}
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc))
