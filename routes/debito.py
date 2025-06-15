"""Rutas para manejar la activación de débitos automáticos."""

from datetime import datetime, timedelta
import os

from fastapi import APIRouter, HTTPException, Form, Depends
from utils.auth_utils import auth_required
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(
        "Advertencia: SUPABASE_URL y SUPABASE_KEY no estan configurados. "
        "La conexión a Supabase estará deshabilitada."
    )
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()


@router.post("/activar_debito")
async def activar_debito(
    dni: str = Form(...),
    monto: float = Form(...),
    frecuencia_dias: int = Form(...),
    user: dict = Depends(auth_required),
):
    """Registra un nuevo débito automático para el cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    if user.get("rol") != "Administrador":
        raise HTTPException(status_code=401, detail="No autorizado")
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
        if (
            not resp.data
            or (hasattr(resp, "status_code") and resp.status_code != 200)
            or getattr(resp, "error", None) is not None
        ):
            raise HTTPException(
                status_code=400,
                detail=str(getattr(resp, "error", "Error en Supabase")),
            )
        return {"mensaje": "Débito automático activado correctamente."}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
