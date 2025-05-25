"""Rutas principales de la aplicación."""

from pathlib import Path
from fastapi import APIRouter
from fastapi.responses import HTMLResponse, FileResponse

from .alquileres import router as alquileres_router
from .limpieza import router as limpieza_router
from .ventas import router as ventas_router
from .debito import router as debito_router
from .cliente_panel import router as cliente_router
from .auth import router as auth_router

# Directorio base de los archivos públicos
BASE_DIR = Path(__file__).resolve().parent.parent / "public"

router = APIRouter()

# Incluir las rutas del módulo de alquileres
router.include_router(alquileres_router)
# Incluir las rutas del módulo de limpieza
router.include_router(limpieza_router)
# Incluir las rutas del módulo de ventas
router.include_router(ventas_router)
# Incluir las rutas del módulo de débito automático
router.include_router(debito_router)
# Rutas específicas del panel del cliente
router.include_router(cliente_router)
router.include_router(auth_router)

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


@router.get("/login.js")
async def obtener_login_js():
    """Script de la página de login."""
    js_path = BASE_DIR / "login.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/cliente_panel.js")
async def obtener_cliente_js():
    """Script del panel del cliente."""
    js_path = BASE_DIR / "cliente_panel.js"
    return FileResponse(js_path, media_type="application/javascript")


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


@router.get("/debito", response_class=HTMLResponse)
async def mostrar_formulario_debito():
    """Devuelve la página para activar débitos automáticos."""
    html_path = BASE_DIR / "debito.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/login", response_class=HTMLResponse)
async def mostrar_login():
    """Página de inicio de sesión."""
    html_path = BASE_DIR / "login.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/cliente_panel.html", response_class=HTMLResponse)
async def mostrar_panel_cliente():
    """Panel privado para clientes."""
    html_path = BASE_DIR / "cliente_panel.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/admin_panel.html", response_class=HTMLResponse)
async def mostrar_panel_admin():
    """Panel privado para la empresa."""
    html_path = BASE_DIR / "admin_panel.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)
