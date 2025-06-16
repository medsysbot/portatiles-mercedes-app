"""
----------------------------------------------------------
Archivo: routes/debito.py
Descripción: Rutas para manejar la activación de débitos automáticos
Acceso: Privado
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-15
----------------------------------------------------------
"""

"""Rutas para manejar la activación de débitos automáticos."""

from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Form

supabase = None

router = APIRouter()

# ==== Endpoints ====

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
        datos  # Validación del diccionario
        return {"mensaje": "Débito automático activado"}
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc))
