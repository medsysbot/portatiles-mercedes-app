"""Aplicación principal de Portátiles Mercedes."""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.router import router

app = FastAPI()

# Carpeta para servir imágenes de manera estática
app.mount("/imagenes", StaticFiles(directory="public/imagenes"), name="imagenes")
# Carpeta para scripts y otros recursos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

# Registrar las rutas definidas en el módulo router, incluido el formulario de limpieza
app.include_router(router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

