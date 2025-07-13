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
    factura: UploadFile = File(...),
    archivo: UploadFile = File(...),
    usuario=Depends(auth_required),
):
    """Carga manual de un comprobante de pago."""
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    # Validaciones de extensión
    _validar_extension(factura.filename)
    _validar_extension(archivo.filename)

    # Fechas para nombre de archivo
    fecha = datetime.utcnow().strftime("%Y%m%d%H%M%S")

    # Nombre archivos
    ext_factura = os.path.splitext(factura.filename)[1]
    nombre_factura = f"factura_{dni_cuit_cuil}_{fecha}{ext_factura}"

    ext_comprobante = os.path.splitext(archivo.filename)[1]
    nombre_comprobante = f"comprobante_{dni_cuit_cuil}_{fecha}{ext_comprobante}"

    # Subir archivos
    try:
        bucket_facturas = supabase.storage.from_("facturas")
        bucket_comprobantes = supabase.storage.from_("comprobantes-pago")

        # Subir factura
        factura_data = await factura.read()
        bucket_facturas.upload(nombre_factura, factura_data, {"content-type": factura.content_type})
        factura_url = bucket_facturas.get_public_url(nombre_factura)

        # Subir comprobante
        comprobante_data = await archivo.read()
        bucket_comprobantes.upload(nombre_comprobante, comprobante_data, {"content-type": archivo.content_type})
        comprobante_url = bucket_comprobantes.get_public_url(nombre_comprobante)

        # Guardar en Supabase
        registro = {
            "nombre_cliente": nombre_cliente,
            "dni_cuit_cuil": dni_cuit_cuil,
            "factura_url": factura_url,
            "comprobante_url": comprobante_url,
            "fecha_envio": datetime.utcnow().isoformat(),
        }

        res = supabase.table(TABLA).insert(registro).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)

    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc))

    return {"ok": True, "factura_url": factura_url, "comprobante_url": comprobante_url}
