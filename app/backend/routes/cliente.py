from fastapi import APIRouter, Depends
from app.backend.utils.auth_utils import auth_required

router = APIRouter()


@router.get("/cliente_panel")
def cliente_panel(user=Depends(auth_required)):
    if user["rol"] != "cliente":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Acceso solo para clientes")
    return {"msg": f"Bienvenido {user['email']}, rol: {user['rol']}"}
