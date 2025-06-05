"""Rutas principales de la aplicación."""

from pathlib import Path
from fastapi import APIRouter
from fastapi.responses import HTMLResponse, FileResponse

from .alquileres import router as alquileres_router
from .ventas import router as ventas_router
from .debito import router as debito_router
from .cliente_panel import router as cliente_router
from .admin_panel import router as admin_router
from .auth import router as auth_router
from .archivos import router as archivos_router

# Directorios base de las plantillas y archivos estáticos
BASE_DIR = Path(__file__).resolve().parent.parent / "AppPublico"
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"

router = APIRouter()

# Incluir las rutas del módulo de alquileres
router.include_router(alquileres_router)
# Incluir las rutas del módulo de ventas
router.include_router(ventas_router)
# Incluir las rutas del módulo de débito automático
router.include_router(debito_router)
# Rutas específicas del panel del cliente
router.include_router(cliente_router)
router.include_router(admin_router)
router.include_router(auth_router)
router.include_router(archivos_router)

@router.get("/", response_class=HTMLResponse)
async def mostrar_index():
    """Devuelve la página principal."""
    html_path = TEMPLATES_DIR / "index.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)

@router.get("/styles.css")
async def obtener_css():
    """Entrega la hoja de estilos."""
    css_path = STATIC_DIR / "css" / "styles.css"
    return FileResponse(css_path, media_type="text/css")


@router.get("/login.js")
async def obtener_login_js():
    """Script de la página de login."""
    js_path = STATIC_DIR / "js" / "login.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/cliente_panel.js")
async def obtener_cliente_js():
    """Script del panel del cliente."""
    js_path = STATIC_DIR / "js" / "cliente_panel.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/admin_panel.js")
async def obtener_admin_js():
    """Script del panel administrativo."""
    js_path = STATIC_DIR / "js" / "admin_panel.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/registro_clientes.js")
async def obtener_registro_js():
    """Script del formulario de registro de clientes."""
    js_path = STATIC_DIR / "js" / "registro_clientes.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/alquiler", response_class=HTMLResponse)
async def mostrar_formulario_alquiler():
    """Devuelve la página de registro de alquiler."""
    html_path = TEMPLATES_DIR / "alquiler.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/limpieza", response_class=HTMLResponse)
async def mostrar_formulario_limpieza():
    """Devuelve la página de registro de limpieza."""
    html_path = TEMPLATES_DIR / "limpieza.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/ventas", response_class=HTMLResponse)
async def mostrar_formulario_ventas():
    """Devuelve la página de registro de ventas."""
    html_path = TEMPLATES_DIR / "ventas.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/venta", response_class=HTMLResponse)
async def mostrar_formulario_venta():
    """Formulario de venta de baños químicos."""
    html_path = TEMPLATES_DIR / "venta.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/debito", response_class=HTMLResponse)
async def mostrar_formulario_debito():
    """Devuelve la página para activar débitos automáticos."""
    html_path = TEMPLATES_DIR / "debito.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/servicios", response_class=HTMLResponse)
async def mostrar_servicios():
    """Página pública con la descripción de servicios."""
    html_path = TEMPLATES_DIR / "servicios.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/registro_clientes", response_class=HTMLResponse)
async def mostrar_registro_clientes():
    """Página para registrar nuevos clientes."""
    html_path = TEMPLATES_DIR / "registro_clientes.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/login", response_class=HTMLResponse)
async def mostrar_login():
    """Página de inicio de sesión."""
    html_path = TEMPLATES_DIR / "login.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/cliente_panel.html", response_class=HTMLResponse)
async def mostrar_panel_cliente():
    """Panel privado para clientes."""
    html_path = TEMPLATES_DIR / "cliente_panel.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/admin_panel.html", response_class=HTMLResponse)
async def mostrar_panel_admin():
    """Panel privado para la empresa."""
    html_path = TEMPLATES_DIR / "admin_panel.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)
