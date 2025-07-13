"""
----------------------------------------------------------
Archivo: routes/comprobantes_pago.py
Descripción: Endpoints para manejo de comprobantes de pago
Última modificación: 2025-07-01
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query
from supabase import Client, create_client
import os
from utils.auth_utils import auth_required

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
BUCKET = "comprobantes-pago"
TABLA = "comprobantes_pago"

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()


def _validar_extension(nombre: str) -> None:
    ext = os.path.splitext(nombre)[1].lower()
    if ext not in {".jpg", ".jpeg", ".png"}:
        raise HTTPException(status_code=400, detail="Formato no permitido")


@router.post("/api/comprobantes_pago")
async def subir_comprobante(
    nombre_cliente: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    archivo: UploadFile = File(...),
    usuario=Depends(auth_required),
):
    """Carga un comprobante de pago y registra la URL."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    _validar_extension(archivo.filename)
    fecha = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    nombre_archivo = f"{dni_cuit_cuil}_{fecha}{os.path.splitext(archivo.filename)[1]}"

    bucket = supabase.storage.from_(BUCKET)
    try:
        contenido = await archivo.read()
        bucket.upload(nombre_archivo, contenido, {"content-type": archivo.content_type})
        url = bucket.get_public_url(nombre_archivo)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    registro = {
        "nombre_cliente": nombre_cliente,
        "dni_cuit_cuil": dni_cuit_cuil,
        "comprobante_url": url,
        "fecha_envio": datetime.utcnow().isoformat(),
    }

    try:
        res = supabase.table(TABLA).insert(registro).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"ok": True, "url": url}


@router.get("/api/comprobantes_pago")
async def listar_comprobantes(
    dni_cuit_cuil: str = Query(...), usuario=Depends(auth_required)
):
    """Lista comprobantes del cliente autenticado."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    try:
        res = (
            supabase.table(TABLA)
            .select(
                "id,nombre_cliente,dni_cuit_cuil,factura_url,comprobante_url,fecha_envio"
            )
            .eq("dni_cuit_cuil", dni_cuit_cuil)
            .order("fecha_envio", desc=True)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))




@router.delete("/api/comprobantes_pago/{id}")
async def eliminar_comprobante(id: int, dni_cuit_cuil: str = Query(...), usuario=Depends(auth_required)):
    """Elimina un comprobante si pertenece al cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    try:
        res = (
            supabase.table(TABLA)
            .select("comprobante_url,dni_cuit_cuil")
            .eq("id", id)
            .single()
            .execute()
        )
        datos = res.data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if not datos or datos.get("dni_cuit_cuil") != dni_cuit_cuil:
        raise HTTPException(status_code=403, detail="Operación no permitida")

    bucket = supabase.storage.from_(BUCKET)
    nombre_archivo = os.path.basename(datos["comprobante_url"])
    try:
        bucket.remove(nombre_archivo)
        supabase.table(TABLA).delete().eq("id", id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"ok": True}
