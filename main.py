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

from routes.router import router
from routes.ventas import router as ventas_router
from routes.limpieza import router as limpieza_router
from routes.alertas import router as alertas_router
from app.backend.routes import auth
from app.backend.routes import admin
from app.backend.routes import cliente

app = FastAPI()

# Carpeta para servir todos los recursos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

# Registrar las rutas definidas en el módulo router, incluido el formulario de limpieza
app.include_router(router)
app.include_router(ventas_router)
app.include_router(limpieza_router)
app.include_router(alertas_router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(cliente.router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

