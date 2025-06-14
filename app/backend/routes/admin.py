from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.backend.utils.auth_utils import auth_required

router = APIRouter()
templates = Jinja2Templates(directory="app_publico/templates")


@router.get("/admin_panel", response_class=HTMLResponse)
def admin_panel(request: Request):
    return templates.TemplateResponse("admin_panel.html", {"request": request})


@router.get("/cliente_panel")
def cliente_panel(user=Depends(auth_required)):
    if user["rol"] != "cliente":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Acceso solo para clientes")
    return {"msg": f"Bienvenido {user['email']}, rol: {user['rol']}"}
