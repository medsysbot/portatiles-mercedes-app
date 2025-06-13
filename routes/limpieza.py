"""Rutas y lógica para el módulo de limpieza de baños."""

from datetime import datetime
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from app.backend.utils.auth_utils import auth_required
from supabase import create_client, Client

# Obtener configuración de Supabase desde variables de entorno
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


@router.post("/registrar_limpieza")
async def registrar_limpieza(
    cliente_nombre: str = Form(...),
    cliente_id: str = Form(...),
    bano_id: str = Form(...),
    empleado: str = Form(...),
    fecha_hora: str = Form(...),
    observaciones: str | None = Form(None),
    remito: UploadFile = File(...),
    user: dict = Depends(auth_required),
):
    """Recibe datos de limpieza y almacena la imagen del remito."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    if user.get("rol") != "empresa":
        raise HTTPException(status_code=401, detail="No autorizado")

    extension = Path(remito.filename).suffix.lower()
    # Desactivar temporalmente la validación de extensiones para permitir
    # subir imágenes con cualquier tipo de archivo. Recordar volver a
    # habilitar esta verificación más adelante para evitar la carga de
    # archivos ejecutables.
    # if extension in {".exe", ".sh", ".bat", ".py"}:
    #     raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")

    bucket_name = f"remitos-limpieza-{cliente_id}"
    fecha_archivo = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    nombre_archivo = f"remito_{bano_id}_{fecha_archivo}{extension}"

    try:
        # Crear bucket si no existe
        try:
            supabase.storage.create_bucket(bucket_name)
        except Exception:
            pass

        contenido = await remito.read()
        supabase.storage.from_(bucket_name).upload(nombre_archivo, contenido)
        url = supabase.storage.from_(bucket_name).get_public_url(nombre_archivo)

        datos = {
            "cliente_nombre": cliente_nombre,
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

        return {"mensaje": "Limpieza registrada correctamente"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
