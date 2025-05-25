"""Rutas y lógica para el registro de limpiezas."""

from datetime import datetime
import os

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL y SUPABASE_KEY deben estar configurados")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()


@router.post("/registro_limpieza")
async def registrar_limpieza(
    cliente_id: str = Form(...),
    bano_id: str = Form(...),
    empleado: str = Form(...),
    fecha_hora: str = Form(...),
    observaciones: str | None = Form(None),
    remito: UploadFile = File(...),
):
    """Guarda un registro de limpieza en Supabase y sube la imagen."""
    try:
        bucket_name = f"remitos-limpieza-{cliente_id}"
        # Crear el bucket si no existe
        try:
            supabase.storage.create_bucket(bucket_name)
        except Exception:
            pass

        contenido = await remito.read()
        archivo_destino = f"{datetime.utcnow().isoformat()}_{remito.filename}"
        supabase.storage.from_(bucket_name).upload(archivo_destino, contenido)
        url = supabase.storage.from_(bucket_name).get_public_url(archivo_destino)

        datos = {
            "cliente_id": cliente_id,
            "bano_id": bano_id,
            "empleado": empleado,
            "fecha_hora": fecha_hora,
            "observaciones": observaciones,
            "remito_url": url,
        }
        respuesta = supabase.table("limpiezas").insert(datos).execute()
        if respuesta.error:
            raise HTTPException(status_code=400, detail=str(respuesta.error))
        return {"mensaje": "Limpieza registrada con éxito"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
