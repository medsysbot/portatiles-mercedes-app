"""
----------------------------------------------------------
Archivo: routes/router.py
Descripción: Rutas principales de la aplicación
Última modificación: 2025-06-15
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

"""Rutas principales de la aplicación."""

from pathlib import Path
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates

from routes.alquileres import router as alquileres_router
from routes.ventas import router as ventas_router
from routes.debito import router as debito_router
from routes.cliente_panel import router as cliente_router
from routes.admin_panel import router as admin_router
from routes.login import router as login_router
from routes.archivos import router as archivos_router

# Directorios base de las plantillas y archivos estáticos
# Luego de reubicar `routes/` en la raíz del repositorio, la carpeta
# `app_publico` se encuentra al mismo nivel que este módulo. Por eso
# la raíz del proyecto se obtiene con `parent.parent`.
ROOT_DIR = Path(__file__).resolve().parent.parent
BASE_DIR = ROOT_DIR / "app_publico"
TEMPLATES_DIR = BASE_DIR / "templates"
# Los scripts públicos se encuentran en `app_publico/static`.
# Los scripts privados, como los del panel administrativo o de clientes,
# se ubican en la carpeta `static` de la raíz del proyecto.
PUBLIC_STATIC_DIR = BASE_DIR / "static"
PRIVATE_STATIC_DIR = ROOT_DIR / "static"

router = APIRouter()
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

# Incluir las rutas del módulo de alquileres
router.include_router(alquileres_router)
# Incluir las rutas del módulo de ventas
router.include_router(ventas_router)
# Incluir las rutas del módulo de débito automático
router.include_router(debito_router)
# Rutas específicas del panel del cliente
router.include_router(cliente_router)
router.include_router(admin_router)
router.include_router(login_router)
router.include_router(archivos_router)

@router.get("/", response_class=HTMLResponse)
async def mostrar_index():
    """Devuelve la página principal."""
    html_path = TEMPLATES_DIR / "index.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)

@router.get("/login.js")
async def obtener_login_js():
    """Script de la página de login."""
    js_path = PUBLIC_STATIC_DIR / "js" / "login.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/cliente_panel.js")
async def obtener_cliente_js():
    """Script del panel del cliente."""
    js_path = PRIVATE_STATIC_DIR / "js" / "cliente_panel.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/admin/panel.js")
async def obtener_admin_js():
    """Script del panel administrativo."""
    js_path = PRIVATE_STATIC_DIR / "js" / "admin_panel.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/registro_clientes.js")
async def obtener_registro_js():
    """Script del formulario de registro de clientes."""
    js_path = PUBLIC_STATIC_DIR / "js" / "registro_clientes.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/alquiler", response_class=HTMLResponse)
async def mostrar_formulario_alquiler():
    """Devuelve la página de registro de alquiler."""
    html_path = TEMPLATES_DIR / "alquiler.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)

@router.get("/alquiler_form", response_class=HTMLResponse)
async def mostrar_alquiler_form():
    """Formulario de alquiler en ventana separada."""
    html_path = TEMPLATES_DIR / "alquiler_form.html"
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


@router.get("/galeria", response_class=HTMLResponse)
async def mostrar_galeria():
    """Galería simple de imágenes."""
    html_path = TEMPLATES_DIR / "galeria.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/registro_clientes", response_class=HTMLResponse)
async def mostrar_registro_clientes():
    """Página para registrar nuevos clientes."""
    html_path = TEMPLATES_DIR / "registro_clientes.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/login", response_class=HTMLResponse)
async def mostrar_login(request: Request):
    """Página de inicio de sesión."""
    return templates.TemplateResponse("login.html", {"request": request})


@router.get("/admin_splash", response_class=HTMLResponse)
async def mostrar_admin_splash():
    """Pantalla de bienvenida para administradores."""
    html_path = TEMPLATES_DIR / "admin_splash.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/cliente_panel.html", response_class=HTMLResponse)
async def mostrar_panel_cliente():
    """Panel privado para clientes."""
    html_path = TEMPLATES_DIR / "cliente_panel.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)

@router.get("/informacion-banos.html", response_class=HTMLResponse)
async def mostrar_informacion_banos():
    """Información y funcionamiento de los baños químicos."""
    html_path = TEMPLATES_DIR / "informacion-banos.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)
