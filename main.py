"""Aplicación principal de Portátiles Mercedes."""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from routes.router import router
from routes.ventas import router as ventas_router
from routes.limpieza import router as limpieza_router
from routes.alertas import router as alertas_router

app = FastAPI()

# Carpeta para servir imágenes de manera estática
app.mount(
    "/imagenes",
    StaticFiles(directory="AppPublico/static/imagenes"),
    name="imagenes",
)
# Carpeta para scripts y otros recursos estáticos
app.mount("/static", StaticFiles(directory="AppPublico/static"), name="static")

# Registrar las rutas definidas en el módulo router, incluido el formulario de limpieza
app.include_router(router)
app.include_router(ventas_router)
app.include_router(limpieza_router)
app.include_router(alertas_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

