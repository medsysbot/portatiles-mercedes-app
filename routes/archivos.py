"""Rutas para obtener el contenido de archivos Python del proyecto."""

from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse

# Directorio base del repositorio
BASE_DIR = Path(__file__).resolve().parent.parent

router = APIRouter()


@router.get("/ver_archivo", response_class=PlainTextResponse)
async def ver_archivo(nombre: str = Query(...), ruta: str = Query("")):
    """Devuelve el contenido del archivo Python indicado."""
    archivo = (BASE_DIR / ruta / nombre).resolve()
    if (
        not archivo.is_file()
        or archivo.suffix != ".py"
        or BASE_DIR not in archivo.parents
    ):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return archivo.read_text(encoding="utf-8")
