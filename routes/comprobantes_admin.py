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
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse("comprobantes_pago_admin.html", {"request": request})


@router.get("/admin/comprobantes/nuevo", response_class=HTMLResponse)
async def comprobante_admin_form(request: Request, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return TEMPLATES.TemplateResponse("comprobantes_pago_admin.html", {"request": request})


@router.post("/admin/comprobantes")
async def agregar_comprobante_admin(
    nombre_cliente: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    factura: UploadFile | None = File(None),
    archivo: UploadFile = File(...),
    usuario=Depends(auth_required),
):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    if factura is not None and getattr(factura, "filename", None):
        _validar_extension(factura.filename)
    _validar_extension(archivo.filename)

    fecha = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    ext_factura = (
        os.path.splitext(factura.filename)[1] if factura and getattr(factura, "filename", None) else ""
    )
    ext_comprobante = os.path.splitext(archivo.filename)[1]

    nombre_factura = (
        f"factura_{dni_cuit_cuil}_{fecha}{ext_factura}"
        if factura and getattr(factura, "filename", None)
        else None
    )
    nombre_comprobante = f"comprobante_{dni_cuit_cuil}_{fecha}{ext_comprobante}"

    factura_url = None
    try:
        bucket_facturas = supabase.storage.from_("facturas")
        bucket_comprobantes = supabase.storage.from_("comprobantes-pago")

        factura_data = await factura.read() if factura and getattr(factura, "filename", None) else None
        comprobante_data = await archivo.read()

        if factura_data is not None and nombre_factura:
            bucket_facturas.upload(
                nombre_factura,
                factura_data,
                {"content-type": factura.content_type},
            )

        bucket_comprobantes.upload(
            nombre_comprobante,
            comprobante_data,
            {"content-type": archivo.content_type},
        )

        factura_url = (
            bucket_facturas.get_public_url(nombre_factura)
            if factura_data is not None and nombre_factura
            else None
        )
        comprobante_url = bucket_comprobantes.get_public_url(nombre_comprobante)

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

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"ok": True, "factura_url": factura_url, "comprobante_url": comprobante_url}


@router.get("/admin/api/comprobantes_pago")
async def obtener_comprobantes_admin(usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    try:
        res = supabase.table(TABLA).select(
            "id,nombre_cliente,dni_cuit_cuil,factura_url,comprobante_url,fecha_envio"
        ).order("fecha_envio", desc=True).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/admin/api/comprobantes_pago/{id}")
async def eliminar_comprobante_admin(id: int, usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    try:
        res = supabase.table(TABLA).delete().eq("id", id).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return {"ok": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/admin/api/comprobantes_pago/{id}")
async def editar_comprobante_admin(
    id: int,
    nombre_cliente: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    usuario=Depends(auth_required),
):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    try:
        res = supabase.table(TABLA).update({
            "nombre_cliente": nombre_cliente,
            "dni_cuit_cuil": dni_cuit_cuil,
        }).eq("id", id).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return {"ok": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
