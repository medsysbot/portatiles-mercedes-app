"""Aplicación principal de Portátiles Mercedes."""

import sys
import traceback
import logging
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

# Imports actualizados según la nueva estructura
from routes.router import router
from routes.ventas import router as ventas_router
from routes.limpieza import router as limpieza_router
from routes.alertas import router as alertas_router
from routes.auth import router as auth_router
from routes.admin_panel import router as admin_router
from routes.cliente_panel import router as cliente_router

app = FastAPI()

# Carpeta para servir todos los recursos estáticos
# Directorio de imágenes e íconos de uso general
# Directorio unificado para recursos estáticos públicos
app.mount("/static", StaticFiles(directory="app_publico/static"), name="static")
# Rutas específicas para íconos e imágenes heredadas de la carpeta antigua
app.mount("/static/icons", StaticFiles(directory="static/icons"), name="icons")
app.mount("/static/imagenes", StaticFiles(directory="static/imagenes"), name="imagenes")

# Registrar las rutas definidas en el módulo router, incluido el formulario de limpieza
app.include_router(router)
app.include_router(ventas_router)
app.include_router(limpieza_router)
app.include_router(alertas_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(cliente_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

