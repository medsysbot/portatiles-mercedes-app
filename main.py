"""Aplicación principal de Portátiles Mercedes."""

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

