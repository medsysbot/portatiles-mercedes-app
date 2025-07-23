"""
Archivo: routes/recursos_humanos.py
Descripción: Router unificado para recursos humanos (datos personales, salarios y ausencias)
Proyecto: Portátiles Mercedes
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import os

from utils.auth_utils import auth_required

from .empleados_datos_personales import router as datos_router
from .empleados_salarios import router as salarios_router
from .empleados_ausencias import router as ausencias_router

router = APIRouter()
TEMPLATES = Jinja2Templates(directory="templates")
TEMPLATES.env.globals["gmail_user"] = os.getenv("EMAIL_ORIGEN")

router.include_router(datos_router)
router.include_router(salarios_router)
router.include_router(ausencias_router)

@router.get("/admin/recursos_humanos", response_class=HTMLResponse)
async def recursos_humanos_admin(request: Request, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse(
        "recursos_humanos.html",
        {"request": request, "panel_template": "panel_admin.html", "is_admin": True},
    )

@router.get("/empleado/recursos_humanos", response_class=HTMLResponse)
async def recursos_humanos_empleado(request: Request, usuario=Depends(auth_required)):
    if usuario.get("rol") not in ("empleado", "Administrador"):
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse(
        "recursos_humanos.html",
        {"request": request, "panel_template": "panel_empleado.html", "is_admin": False},
    )
