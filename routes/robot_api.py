# Archivo: routes/robot_api.py
# Descripción: API para IA/contexto Portátiles Mercedes
# Acceso: Público (solo lectura y POST preguntas)
# Última modificación: 2025-07-31

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pathlib import Path
import json
import logging
import os

router = APIRouter()

# Configuración de log
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "robot_api.log")
logger = logging.getLogger("robot_api")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

# Ruta fija del contexto
CONTEXT_FILE = Path("static/contexto_publico.json")

# ================== GET CONTEXTO ===================
@router.get("/api/contexto_publico", response_class=JSONResponse)
async def obtener_contexto_publico():
    """
    Devuelve el contexto general y la estructura pública del sistema en formato JSON.
    """
    if not CONTEXT_FILE.exists():
        logger.error("Archivo de contexto no encontrado")
        raise HTTPException(status_code=404, detail="Archivo de contexto no encontrado")
    try:
        with CONTEXT_FILE.open(encoding="utf-8") as f:
            contenido = json.load(f)
        return JSONResponse(content=contenido)
    except Exception as exc:
        logger.error(f"Error al leer contexto: {exc}")
        raise HTTPException(status_code=500, detail=f"Error al leer contexto: {exc}")

# ================== POST PREGUNTA IA ===================
@router.post("/api/robot", response_class=JSONResponse)
async def responder_robot(request: Request):
    """
    Recibe una pregunta y responde usando el contexto general del sistema + IA.
    """
    if not CONTEXT_FILE.exists():
        logger.error("Archivo de contexto no encontrado")
        raise HTTPException(status_code=404, detail="Archivo de contexto no encontrado")
    try:
        datos = await request.json()
        pregunta = datos.get("mensaje", "").strip()
        if not pregunta:
            logger.warning("Mensaje vacío recibido en /api/robot")
            raise HTTPException(status_code=400, detail="Falta mensaje de usuario")
        with CONTEXT_FILE.open(encoding="utf-8") as f:
            contexto = json.load(f)

        # ----------- Aquí se arma el prompt -----------
        prompt = f"{contexto.get('descripcion_general','')}\n\nUsuario: {pregunta}"

        # ---------- Aquí iría la integración real con IA ----------
        # respuesta_ia = llamada_a_tu_ia(prompt)
        respuesta_ia = f"(Simulación IA) {prompt}"

        logger.info(f"Pregunta: {pregunta} | Respuesta: {respuesta_ia[:80]}...")
        return JSONResponse(content={"respuesta": respuesta_ia})

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error procesando pregunta: {exc}")
        raise HTTPException(status_code=500, detail=f"Error al procesar pregunta: {exc}")
