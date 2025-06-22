"""
----------------------------------------------------------
Archivo: main.py
Descripción: Punto de entrada de la aplicación FastAPI
Última modificación: 2025-06-15
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

"""Aplicación principal de Portátiles Mercedes."""

import sys
import traceback
import logging
import os
from pathlib import Path


def excepthook(type, value, tb):
    print("UNCAUGHT EXCEPTION:")
    traceback.print_exception(type, value, tb)


sys.excepthook = excepthook

# Configuración de logging para eventos de login
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "login_events.log"

login_logger = logging.getLogger("login_events")
login_logger.setLevel(logging.INFO)
if not login_logger.handlers:
    file_handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    file_handler.setFormatter(formatter)
    login_logger.addHandler(file_handler)
    login_logger.propagate = False

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

# Imports actualizados según la nueva estructura
from routes.router import router
from routes.ventas import router as ventas_router
from routes.limpieza import router as limpieza_router
from routes.alertas import router as alertas_router
from routes.login import router as login_router, supabase as supabase_client
from routes.admin_panel import router as admin_router
from routes.cliente_panel import router as cliente_router
from routes.datos_personales import router as datos_personales_router
from routes.alquileres import router as alquileres_router
import routes.alquileres as alquileres_module
import routes.inventario_banos as inventario_banos_module
from routes import admin_panel, cliente_panel, ventas, limpieza, debito

app = FastAPI()

# Inyectar el cliente de Supabase global en todos los módulos solo si está habilitado
if os.getenv("ENABLE_SUPABASE") == "1":
    admin_panel.supabase = supabase_client
    cliente_panel.supabase = supabase_client
    ventas.supabase = supabase_client
    limpieza.supabase = supabase_client
    debito.supabase = supabase_client
    alquileres_module.supabase = supabase_client
    inventario_banos_module.supabase = supabase_client
    login_logger.info("Cliente Supabase asignado a modulos")

# Carpeta para servir todos los recursos estáticos
# Directorio de imágenes e íconos de uso general
# Directorio unificado para recursos estáticos públicos
# Carpeta unificada de recursos estáticos
app.mount("/app_publico/static", StaticFiles(directory="app_publico/static"), name="static")
app.mount("/static", StaticFiles(directory="static"), name="static-private")

# Registrar las rutas definidas en el módulo router, incluido el formulario de limpieza
app.include_router(router)
app.include_router(ventas_router)
app.include_router(limpieza_router)
app.include_router(alertas_router)
app.include_router(login_router)
app.include_router(admin_router)
app.include_router(cliente_router)
app.include_router(datos_personales_router)
app.include_router(alquileres_router)


@app.get("/logout")
def cerrar_sesion():
    """Elimina el token de autenticación y redirige al login."""
    response = RedirectResponse(url="/login", status_code=302)
    response.delete_cookie("access_token")
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)

