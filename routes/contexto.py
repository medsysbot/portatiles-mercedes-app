# Archivo: routes/contexto.py
# Descripción: Endpoint para exponer el contexto general del sistema Portátiles Mercedes
# Acceso: Público (solo lectura)
# Última modificación: 2025-07-31

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path

router = APIRouter()

# Ruta al archivo de contexto
CONTEXT_FILE = Path("static/contexto_publico.json")

@router.get("/api/contexto_publico", response_class=JSONResponse)
async def obtener_contexto_publico():
    """
    Devuelve el contexto general y la estructura pública del sistema en formato JSON.
    Este endpoint puede ser consumido por asistentes, integraciones, o IA.
    """
    if not CONTEXT_FILE.exists():
        raise HTTPException(status_code=404, detail="Archivo de contexto no encontrado")
    try:
        contenido = CONTEXT_FILE.read_text(encoding="utf-8")
        # Si el contenido ya es un JSON bien formado, lo devuelve como respuesta
        return JSONResponse(content=contenido)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al leer contexto: {exc}")
