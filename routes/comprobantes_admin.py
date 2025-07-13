"""
----------------------------------------------------------
Archivo: routes/comprobantes_admin.py
Descripción: Vistas para gestionar comprobantes en el panel
administrativo
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from datetime import datetime
import os

from fastapi import APIRouter, Request, Form, File, UploadFile, HTTPException, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from utils.auth_utils import auth_required
from routes.comprobantes_pago import supabase, _validar_extension, BUCKET, TABLA

router = APIRouter()
TEMPLATES = Jinja2Templates(directory="templates")


@router.get("/admin/comprobantes", response_class=HTMLResponse)
async def comprobantes_admin_view(request: Request, usuario=Depends(auth_required)):
    """Muestra el listado de comprobantes de pago."""
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse("comprobantes_pago_admin.html", {"request": request})


@router.get("/admin/comprobantes/nuevo", response_class=HTMLResponse)
async def comprobante_admin_form(request: Request, usuario=Depends(auth_required)):
    """Formulario independiente para cargar comprobantes desde el panel."""
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse("comprobantes_pago_admin.html", {"request": request})


@router.post("/admin/comprobantes")
async def agregar_comprobante_admin(
    nombre_cliente: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    numero_factura: str = Form(...),
    archivo: UploadFile = File(...),
    usuario=Depends(auth_required),
):
    """Carga manual de un comprobante de pago."""
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    _validar_extension(archivo.filename)
    fecha = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    extension = os.path.splitext(archivo.filename)[1]
    nombre_archivo = f"{dni_cuit_cuil}_{fecha}{extension}"

    bucket = supabase.storage.from_(BUCKET)
    try:
        contenido = await archivo.read()
        bucket.upload(nombre_archivo, contenido, {"content-type": archivo.content_type})
        url = bucket.get_public_url(nombre_archivo)
        registro = {
            "nombre_cliente": nombre_cliente,
            "dni_cuit_cuil": dni_cuit_cuil,
            "numero_factura": numero_factura,
            "comprobante_url": url,
            "fecha_envio": datetime.utcnow().isoformat(),
        }
        res = supabase.table(TABLA).insert(registro).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
    except Exception as exc:  # pragma: no cover - errores de conexión
        raise HTTPException(status_code=500, detail=str(exc))

    return {"ok": True, "url": url}
