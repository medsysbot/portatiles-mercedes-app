# ╔══════════════════════════════════════════════╗
# ║        PORTÁTILES MERCEDES - MAIN APP       ║
# ╚══════════════════════════════════════════════╝

from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <!DOCTYPE html>
    <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Portátiles Mercedes</title>
        </head>
        <body>
            <h1>Bienvenido a Portátiles Mercedes</h1>
            <p>Este es el sistema para alquiler, venta y mantenimiento de baños químicos.</p>
        </body>
    </html>
    """
