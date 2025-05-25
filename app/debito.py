"""Rutas para manejar la activación de débitos automáticos."""

from datetime import datetime, timedelta
import os

from fastapi import APIRouter, HTTPException, Form
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL y SUPABASE_KEY deben estar configurados")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()


@router.post("/activar_debito")
async def activar_debito(
    dni: str = Form(...),
    monto: float = Form(...),
    frecuencia_dias: int = Form(...),
):
    """Registra un nuevo débito automático para el cliente."""
    hoy = datetime.utcnow().date()
    proximo_pago = hoy + timedelta(days=frecuencia_dias)

    datos = {
        "dni_cliente": dni,
        "monto": monto,
        "frecuencia_dias": frecuencia_dias,
        "fecha_inicio": hoy.isoformat(),
        "proximo_pago": proximo_pago.isoformat(),
    }

    try:
        resp = supabase.table("debitos_programados").insert(datos).execute()
        if resp.error:
            raise HTTPException(status_code=400, detail=str(resp.error))
        return {"mensaje": "Débito automático activado correctamente."}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
