"""Rutas y lógica para el registro de ventas."""

from datetime import datetime
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, constr
from fpdf import FPDF
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL y SUPABASE_KEY deben estar configurados")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()


class Venta(BaseModel):
    """Modelo de validación para una venta."""

    cliente_nombre: constr(strip_whitespace=True, min_length=1)
    tipo_banio: constr(strip_whitespace=True, min_length=1)
    cantidad: int
    precio_unitario: float


@router.post("/registrar_venta")
async def registrar_venta(venta: Venta):
    """Recibe una venta, genera el PDF y la almacena en Supabase."""
    try:
        total = venta.cantidad * venta.precio_unitario
        datos = venta.model_dump()
        datos["total"] = total

        # Guardar la venta en la tabla 'ventas'
        respuesta = supabase.table("ventas").insert(datos).execute()
        if respuesta.error:
            raise HTTPException(status_code=400, detail=str(respuesta.error))

        # Actualizar stock de forma sencilla
        try:
            stock_resp = (
                supabase.table("stock")
                .select("cantidad")
                .eq("tipo_banio", venta.tipo_banio)
                .single()
                .execute()
            )
            if stock_resp.data:
                nuevo = stock_resp.data["cantidad"] - venta.cantidad
                supabase.table("stock").update({"cantidad": nuevo}).eq(
                    "tipo_banio", venta.tipo_banio
                ).execute()
        except Exception:
            # Si el stock no existe, ignorar el error
            pass

        # Generar PDF con los datos de la venta
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.cell(0, 10, "Comprobante de Venta", ln=1)
        pdf.cell(0, 10, f"Cliente: {venta.cliente_nombre}", ln=1)
        pdf.cell(0, 10, f"Tipo de baño: {venta.tipo_banio}", ln=1)
        pdf.cell(0, 10, f"Cantidad: {venta.cantidad}", ln=1)
        pdf.cell(0, 10, f"Precio unitario: ${venta.precio_unitario:.2f}", ln=1)
        pdf.cell(0, 10, f"Total: ${total:.2f}", ln=1)
        pdf_bytes = pdf.output(dest="S").encode("latin1")

        bucket_name = "ventas-boletos"
        try:
            supabase.storage.create_bucket(bucket_name)
        except Exception:
            pass
        nombre_archivo = f"{datetime.utcnow().isoformat()}_{venta.cliente_nombre}.pdf"
        supabase.storage.from_(bucket_name).upload(nombre_archivo, pdf_bytes)
        url = supabase.storage.from_(bucket_name).get_public_url(nombre_archivo)

        return {"mensaje": "Venta registrada con éxito", "pdf_url": url}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
