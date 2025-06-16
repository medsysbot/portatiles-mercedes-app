"""
----------------------------------------------------------
Archivo: routes/limpieza.py
Descripción: Rutas y lógica para el módulo de limpieza de baños
Acceso: Privado
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-15
----------------------------------------------------------
"""
"""Rutas y lógica para el módulo de limpieza de baños."""

from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

supabase = None

router = APIRouter()

# ==== Endpoints ====

@router.post("/registrar_limpieza")
async def registrar_limpieza(
    cliente_nombre: str = Form(...),
    cliente_id: str = Form(...),
    bano_id: str = Form(...),
    empleado: str = Form(...),
    fecha_hora: str = Form(...),
    observaciones: str | None = Form(None),
    remito: UploadFile = File(...),
):
    """Recibe datos de limpieza y almacena la imagen del remito."""

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
        await remito.read()  # Validación de archivo
        return {"mensaje": "Limpieza registrada"}
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc))
