"""
----------------------------------------------------------
Archivo: main.py
Descripción: Punto de entrada de la aplicación FastAPI
Última modificación: 2025-06-15
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

"""Aplicación principal de Portátiles Mercedes."""

import os

# Instancia de Supabase para registro de errores
supabase_error_log = None
from datetime import datetime
from dotenv import load_dotenv


def diagnostico_deploy():
    print("=== DIAGNÓSTICO DEPLOY PORTÁTILES MERCEDES ===")
    extensiones = ('.py', '.html', '.js')
    for root, _, files in os.walk('.'):
        for f in files:
            if f.endswith(extensiones):
                path = os.path.join(root, f)
                modif = datetime.fromtimestamp(os.path.getmtime(path)).strftime('%Y-%m-%d %H:%M:%S')
                print(f"{path} - {modif}")
    if os.path.isdir('.git'):
        try:
            import subprocess
            commit = subprocess.check_output(['git', 'log', '-1', '--pretty=format:%h %ad', '--date=iso']).decode().strip()
            print(f"Último commit: {commit}")
        except Exception as e:
            print(f"No se pudo obtener commit: {e}")
    print("="*50)


diagnostico_deploy()

load_dotenv()

import sys
import traceback
import logging
import os


def excepthook(type, value, tb):
    print("UNCAUGHT EXCEPTION:")
    traceback.print_exception(type, value, tb)


sys.excepthook = excepthook

# Configuración de logging para imprimir todo por consola
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
    stream=sys.stdout,
)

login_logger = logging.getLogger("login_events")
login_logger.setLevel(logging.INFO)

error_logger = logging.getLogger("errores_backend")
error_logger.setLevel(logging.ERROR)

system_error_logger = logging.getLogger("errores_sistema")
system_error_logger.setLevel(logging.ERROR)

system_error_logger = logging.getLogger("errores_sistema")
system_error_logger.setLevel(logging.ERROR)

# ==== BLOQUE REGISTRO DE ERRORES EN SUPABASE ====
def registrar_error_supabase(endpoint, usuario, rol, detalle_error, mensaje, request_data, ip_cliente):
    """Guarda un error en la tabla logs_errores"""
    if not supabase_error_log:
        print("[LOG] Supabase no configurado para registrar errores")
        return
    try:
        supabase_error_log.table("logs_errores").insert({
            "endpoint": endpoint,
            "usuario": usuario or "N/A",
            "rol": rol or "N/A",
            "detalle_error": detalle_error or "",
            "mensaje": mensaje or "",
            "request_data": request_data or {},
            "ip_cliente": ip_cliente or ""
        }).execute()
    except Exception as exc:
        print("[LOG] Error guardando error en Supabase:", exc)
# ==== FIN BLOQUE ====

from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, JSONResponse

# Imports actualizados según la nueva estructura
from routes.router import router
from routes.ventas import router as ventas_router
from routes.limpieza import router as limpieza_router
from routes.login import router as login_router, supabase as supabase_client
from routes.admin_panel import router as admin_router
from routes.empleado_panel import router as empleado_router
from routes.cliente_panel import router as cliente_router
from routes.datos_personales import router as datos_personales_router
from routes.alquileres import router as alquileres_router
from routes.reportes import router as reportes_router
from routes.facturas_pendientes import router as facturas_pendientes_router
from routes.morosos import router as morosos_router
from routes.sitemap import router as sitemap_router
from routes.comprobantes_pago import router as comprobantes_router
from routes.comprobantes_admin import router as comprobantes_admin_router
from routes.empleados_datos_personales import router as empleados_datos_personales_router
from routes.empleados_salarios import router as empleados_salarios_router
from routes.empleados_ausencias import router as empleados_ausencias_router
from routes.email_publico import router as email_publico_router
import routes.alquileres as alquileres_module
import routes.inventario_banos as inventario_banos_module
import routes.reportes as reportes_module
import routes.facturas_pendientes as facturas_pendientes_module
import routes.morosos as morosos_module
import routes.emails_admin as emails_admin_module
from routes import admin_panel, empleado_panel, cliente_panel, ventas, limpieza, reportes

from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app = FastAPI()

# Middleware que limita dominios válidos (ajusta tu dominio si lo tenés)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "portatiles-mercedes-app-production.up.railway.app",
        "*.portatilesmercedes.com",
        "localhost",
        "testserver",
    ]
)

# Opcional: forzar HTTPS
# app.add_middleware(HTTPSRedirectMiddleware)
# Registrar manejador de excepciones para capturar tracebacks
# ========================= HANDLERS PARA LOGS DE ERRORES =========================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Registra el traceback y el error en Supabase antes de responder."""
    error_logger.error(
        "Error en %s: %s\n%s",
        request.url.path,
        exc.detail,
        traceback.format_exc(),
    )
    user = request.cookies.get("access_token", "N/A")
    registrar_error_supabase(
        endpoint=request.url.path,
        usuario=user,
        rol=None,
        detalle_error=str(exc.detail),
        mensaje="HTTPException",
        request_data=None,
        ip_cliente=request.client.host if request.client else ""
    )
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Registra cualquier excepción no manejada en Supabase."""
    error_logger.error(
        "Excepción en %s: %s\n%s",
        request.url.path,
        exc,
        traceback.format_exc(),
    )
    user = request.cookies.get("access_token", "N/A")
    registrar_error_supabase(
        endpoint=request.url.path,
        usuario=user,
        rol=None,
        detalle_error=str(exc),
        mensaje="Exception",
        request_data=None,
        ip_cliente=request.client.host if request.client else ""
    )
    return JSONResponse(status_code=500, content={"detail": "Error interno del sistema"})

# Inyectar el cliente de Supabase global en todos los módulos solo si está habilitado
if os.getenv("ENABLE_SUPABASE") == "1":
    admin_panel.supabase = supabase_client
    cliente_panel.supabase = supabase_client
    ventas.supabase = supabase_client
    limpieza.supabase = supabase_client
    alquileres_module.supabase = supabase_client
    inventario_banos_module.supabase = supabase_client
    reportes_module.supabase = supabase_client
    facturas_pendientes_module.supabase = supabase_client
    morosos_module.supabase = supabase_client
    empleado_panel.supabase = supabase_client
    import routes.empleados_datos_personales as edp_module
    import routes.empleados_salarios as es_module
    import routes.empleados_ausencias as ea_module
    edp_module.supabase = supabase_client
    es_module.supabase = supabase_client
    ea_module.supabase = supabase_client
    login_logger.info("Cliente Supabase asignado a modulos")

# Carpeta para servir todos los recursos estáticos
# Directorio de imágenes e íconos de uso general
# Directorio unificado para recursos estáticos públicos
# Carpeta unificada de recursos estáticos
app.mount("/app_publico/static", StaticFiles(directory="app_publico/static"), name="static")
app.mount("/static", StaticFiles(directory="static"), name="static-private")

# Registrar las rutas principales del sistema
app.include_router(router)
app.include_router(ventas_router)
app.include_router(limpieza_router)
app.include_router(login_router)
app.include_router(admin_router)
app.include_router(empleado_router)
app.include_router(cliente_router)
app.include_router(datos_personales_router)
app.include_router(alquileres_router)
app.include_router(reportes_router)
app.include_router(facturas_pendientes_router)
app.include_router(morosos_router)
app.include_router(comprobantes_router)
app.include_router(comprobantes_admin_router)
app.include_router(empleados_datos_personales_router)
app.include_router(empleados_salarios_router)
app.include_router(empleados_ausencias_router)
app.include_router(email_publico_router)
app.include_router(sitemap_router)


@app.get("/logout")
def cerrar_sesion():
    """Elimina el token de autenticación y redirige al login."""
    response = RedirectResponse(url="/login", status_code=302)
    response.delete_cookie("access_token")
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)

