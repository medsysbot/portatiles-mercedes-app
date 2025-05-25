"""Rutas principales de la aplicación."""

from pathlib import Path
from fastapi import APIRouter
from fastapi.responses import HTMLResponse, FileResponse

from .alquileres import router as alquileres_router
from .limpieza import router as limpieza_router
from .ventas import router as ventas_router

# Directorio base de los archivos públicos
BASE_DIR = Path(__file__).resolve().parent.parent / "public"

router = APIRouter()

# Incluir las rutas del módulo de alquileres
router.include_router(alquileres_router)
# Incluir las rutas del módulo de limpieza
router.include_router(limpieza_router)
# Incluir las rutas del módulo de ventas
router.include_router(ventas_router)

@router.get("/", response_class=HTMLResponse)
async def mostrar_index():
    """Devuelve la página principal."""
    html_path = BASE_DIR / "index.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)

@router.get("/styles.css")
async def obtener_css():
    """Entrega la hoja de estilos."""
    css_path = BASE_DIR / "styles.css"
    return FileResponse(css_path, media_type="text/css")


@router.get("/alquiler", response_class=HTMLResponse)
async def mostrar_formulario_alquiler():
    """Devuelve la página de registro de alquiler."""
    html_path = BASE_DIR / "alquiler.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/limpieza", response_class=HTMLResponse)
async def mostrar_formulario_limpieza():
    """Devuelve la página de registro de limpieza."""
    html_path = BASE_DIR / "limpieza.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/ventas", response_class=HTMLResponse)
async def mostrar_formulario_ventas():
    """Devuelve la página de registro de ventas."""
    html_path = BASE_DIR / "ventas.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)
