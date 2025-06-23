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
from fastapi import Depends
from utils.auth_utils import verificar_token

from routes.ventas import router as ventas_router
from routes.debito import router as debito_router
from routes.cliente_panel import router as cliente_router
from routes.admin_panel import router as admin_router
from routes.login import router as login_router
from routes.clientes import router as clientes_router
from routes.inventario_banos import router as inventario_router
from routes.facturas_pendientes import router as facturas_pendientes_router
from routes.morosos import router as morosos_router
from routes.emails_admin import router as emails_router

# Directorios base de las plantillas y archivos estáticos
# Luego de reubicar `routes/` en la raíz del repositorio, la carpeta
# `app_publico` se encuentra al mismo nivel que este módulo. Por eso
# la raíz del proyecto se obtiene con `parent.parent`.
ROOT_DIR = Path(__file__).resolve().parent.parent
BASE_DIR = ROOT_DIR / "app_publico"
TEMPLATES_DIR = BASE_DIR / "templates"
# Directorio de plantillas privadas
PRIVATE_TEMPLATES_DIR = ROOT_DIR / "templates"
# Los scripts públicos se encuentran en `app_publico/static`.
# Los scripts privados, como los del panel administrativo o de clientes,
# se ubican en la carpeta `static` de la raíz del proyecto.
PUBLIC_STATIC_DIR = BASE_DIR / "static"
PRIVATE_STATIC_DIR = ROOT_DIR / "static"

router = APIRouter()
# Plantillas públicas ubicadas en `app_publico/templates` (para index, login,
# etc.).
public_templates = Jinja2Templates(directory=str(TEMPLATES_DIR))
# Plantillas privadas del panel administrativo ahora residen en la carpeta
# `templates` de la raíz del proyecto.
templates = Jinja2Templates(directory="templates")

# Incluir las rutas del módulo de ventas
router.include_router(ventas_router)
# Incluir las rutas del módulo de débito automático
router.include_router(debito_router)
# Rutas específicas del panel del cliente
router.include_router(cliente_router)
router.include_router(admin_router)
router.include_router(login_router)
router.include_router(clientes_router)
router.include_router(inventario_router)
router.include_router(facturas_pendientes_router)
router.include_router(morosos_router)
router.include_router(emails_router)

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




@router.get("/clientes_admin.js")
async def obtener_clientes_admin_js():
    """Script para la sección de clientes del panel admin."""
    js_path = PRIVATE_STATIC_DIR / "js" / "clientes_admin.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/alquileres_admin.js")
async def obtener_alquileres_admin_js():
    """Script para la sección de alquileres del panel admin."""
    js_path = PRIVATE_STATIC_DIR / "js" / "alquileres_admin.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/ventas_admin.js")
async def obtener_ventas_admin_js():
    """Script para la sección de ventas del panel admin."""
    js_path = PRIVATE_STATIC_DIR / "js" / "ventas_admin.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/inventario_banos_admin.js")
async def obtener_inventario_banos_admin_js():
    """Script para el inventario de baños."""
    js_path = PRIVATE_STATIC_DIR / "js" / "inventario_banos_admin.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/limpieza_admin.js")
async def obtener_limpieza_admin_js():
    """Script para el módulo de servicios de limpieza."""
    js_path = PRIVATE_STATIC_DIR / "js" / "limpieza_admin.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/limpieza_empleado.js")
async def obtener_limpieza_empleado_js():
    """Script para el módulo de limpieza del panel de empleados."""
    js_path = PRIVATE_STATIC_DIR / "js" / "limpieza_empleado.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/reportes_admin.js")
async def obtener_reportes_admin_js():
    """Script para el módulo de reportes del panel admin."""
    js_path = PRIVATE_STATIC_DIR / "js" / "reportes_admin.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/reportes_empleado.js")
async def obtener_reportes_empleado_js():
    """Script para el módulo de reportes del panel de empleados."""
    js_path = PRIVATE_STATIC_DIR / "js" / "reportes_empleado.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/facturas_pendientes.js")
async def obtener_facturas_pendientes_js():
    """Script para el módulo de facturas pendientes."""
    js_path = PRIVATE_STATIC_DIR / "js" / "facturas_pendientes.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/morosos_admin.js")
async def obtener_morosos_admin_js():
    """Script para el módulo de morosos."""
    js_path = PRIVATE_STATIC_DIR / "js" / "morosos_admin.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/emails_admin.js")
async def obtener_emails_admin_js():
    """Script para el módulo de emails."""
    js_path = PRIVATE_STATIC_DIR / "js" / "emails_admin.js"
    return FileResponse(js_path, media_type="application/javascript")


@router.get("/dashboard_admin.js")
async def obtener_dashboard_admin_js():
    """Script para el dashboard del panel admin."""
    js_path = PRIVATE_STATIC_DIR / "js" / "dashboard_admin.js"
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
    return public_templates.TemplateResponse("login.html", {"request": request})


@router.get("/splash", response_class=HTMLResponse)
async def splash(request: Request, token_data: dict = Depends(verificar_token)):
    """Pantalla transitoria luego del login de administrador."""
    nombre_admin = token_data.get("nombre", "Administrador")
    return templates.TemplateResponse(
        "admin_splash.html",
        {"request": request, "nombre_usuario": nombre_admin},
    )


@router.get("/splash_empleado", response_class=HTMLResponse)
def splash_empleado(request: Request, token_data: dict = Depends(verificar_token)):
    """Pantalla de bienvenida para empleados."""
    nombre_empleado = token_data.get("nombre", "Empleado")
    return templates.TemplateResponse(
        "splash_empleado.html",
        {"request": request, "nombre_usuario": nombre_empleado},
    )


@router.get("/admin_splash", response_class=HTMLResponse)
async def mostrar_admin_splash():
    """Pantalla de bienvenida para administradores."""
    html_path = PRIVATE_TEMPLATES_DIR / "admin_splash.html"
    html_contenido = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_contenido)


@router.get("/splash_cliente", response_class=HTMLResponse)
def splash_cliente(request: Request, token_data: dict = Depends(verificar_token)):
    """Pantalla de bienvenida transitoria para clientes."""
    nombre_usuario = token_data.get("nombre", "Cliente")
    return templates.TemplateResponse(
        "splash_cliente.html",
        {
            "request": request,
            "nombre_usuario": nombre_usuario,
            "cliente_femenino": False,
        },
    )


@router.get("/panel_cliente", response_class=HTMLResponse)
def panel_cliente_view(request: Request, token_data: dict = Depends(verificar_token)):
    """Panel privado para clientes sin extensión HTML."""
    return templates.TemplateResponse("cliente_panel.html", {"request": request})


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
