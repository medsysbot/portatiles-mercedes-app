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
from routes.comprobantes_pago import supabase, BUCKET, TABLA
from utils.file_utils import obtener_tipo_archivo

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

    factura_data = None
    factura_ext = ""
    if factura is not None and getattr(factura, "filename", None):
        factura_data = await factura.read()
        mime_factura = obtener_tipo_archivo(factura_data)
        if mime_factura not in {"application/pdf", "image/png", "image/jpeg"}:
            raise HTTPException(status_code=400, detail="Formato no permitido")
        factura_ext = ".pdf" if mime_factura == "application/pdf" else (".png" if mime_factura == "image/png" else ".jpg")

    comprobante_data = await archivo.read()
    mime_comprobante = obtener_tipo_archivo(comprobante_data)
    if mime_comprobante not in {"application/pdf", "image/png", "image/jpeg"}:
        raise HTTPException(status_code=400, detail="Formato no permitido")
    ext_comprobante = ".pdf" if mime_comprobante == "application/pdf" else (".png" if mime_comprobante == "image/png" else ".jpg")

    fecha = datetime.utcnow().strftime("%Y%m%d%H%M%S")

    nombre_factura = (
        f"factura_{dni_cuit_cuil}_{fecha}{factura_ext}"
        if factura_data is not None
        else None
    )
    nombre_comprobante = f"comprobante_{dni_cuit_cuil}_{fecha}{ext_comprobante}"

    factura_url = None
    try:
        bucket_facturas = supabase.storage.from_("facturas")
        bucket_comprobantes = supabase.storage.from_("comprobantes-pago")

        if factura_data is not None and nombre_factura:
            bucket_facturas.upload(
                nombre_factura,
                factura_data,
                {"content-type": mime_factura},
            )

        bucket_comprobantes.upload(
            nombre_comprobante,
            comprobante_data,
            {"content-type": mime_comprobante},
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
