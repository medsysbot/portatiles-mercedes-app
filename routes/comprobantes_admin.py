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
TEMPLATES.env.globals["gmail_user"] = os.getenv("EMAIL_ORIGEN")


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
    numero_de_factura: str = Form(...),
    razon_social: str | None = Form(None),
    archivo: UploadFile = File(...),
    usuario=Depends(auth_required),
):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    comprobante_data = await archivo.read()
    mime_comprobante = obtener_tipo_archivo(comprobante_data)
    if mime_comprobante not in {"application/pdf", "image/png", "image/jpeg"}:
        raise HTTPException(status_code=400, detail="Formato no permitido")
    ext_comprobante = ".pdf" if mime_comprobante == "application/pdf" else (".png" if mime_comprobante == "image/png" else ".jpg")

    fecha = datetime.utcnow().strftime("%Y%m%d%H%M%S")

    nombre_comprobante = f"comprobante_{dni_cuit_cuil}_{fecha}{ext_comprobante}"

    try:
        bucket_comprobantes = supabase.storage.from_(BUCKET)
        bucket_comprobantes.upload(
            nombre_comprobante,
            comprobante_data,
            {"content-type": mime_comprobante},
        )
        comprobante_url = bucket_comprobantes.get_public_url(nombre_comprobante)

        registro = {
            "nombre_cliente": nombre_cliente,
            "dni_cuit_cuil": dni_cuit_cuil,
            "razon_social": razon_social,
            "numero_de_factura": numero_de_factura,
            "comprobante_url": comprobante_url,
            "fecha_envio": datetime.utcnow().isoformat(),
        }

        res = supabase.table(TABLA).insert(registro).execute()
        if getattr(res, "error", None):
            raise Exception(res.error.message)

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"ok": True, "comprobante_url": comprobante_url}


@router.get("/admin/api/comprobantes_pago")
async def obtener_comprobantes_admin(usuario=Depends(auth_required)):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    try:
        res = (
            supabase.table(TABLA)
            .select(
                "id,nombre_cliente,dni_cuit_cuil,razon_social,numero_de_factura,comprobante_url,fecha_envio"
            )
            .order("fecha_envio", desc=True)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return res.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/admin/api/comprobantes_pago/{id}")
async def eliminar_comprobante_admin(id: int, usuario=Depends(auth_required)):
    """Elimina un comprobante y sus archivos asociados."""
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")

    try:
        res = (
            supabase.table(TABLA)
            .select("comprobante_url")
            .eq("id", id)
            .single()
            .execute()
        )
        datos = res.data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if not datos:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    bucket_comprobantes = supabase.storage.from_(BUCKET)
    try:
        if datos.get("comprobante_url"):
            bucket_comprobantes.remove(os.path.basename(datos["comprobante_url"]))
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
    numero_de_factura: str = Form(...),
    razon_social: str | None = Form(None),
    archivo: UploadFile | None = File(None),
    usuario=Depends(auth_required),
):
    if usuario.get("rol") != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    try:
        res = (
            supabase.table(TABLA)
            .select("numero_de_factura,comprobante_url")
            .eq("id", id)
            .single()
            .execute()
        )
        existente = res.data or {}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    comprobante_url = existente.get("comprobante_url") or ""
    bucket_comprobantes = supabase.storage.from_(BUCKET)
    fecha = datetime.utcnow().strftime("%Y%m%d%H%M%S")

    if archivo is not None and getattr(archivo, "filename", None):
        datos = await archivo.read()
        mime = obtener_tipo_archivo(datos)
        if mime not in {"application/pdf", "image/png", "image/jpeg"}:
            raise HTTPException(status_code=400, detail="Formato no permitido")
        ext = ".pdf" if mime == "application/pdf" else (".png" if mime == "image/png" else ".jpg")
        nombre_comp = f"comprobante_{dni_cuit_cuil}_{fecha}{ext}"
        bucket_comprobantes.upload(nombre_comp, datos, {"content-type": mime})
        if comprobante_url:
            try:
                bucket_comprobantes.remove(os.path.basename(comprobante_url))
            except Exception:
                pass
        comprobante_url = bucket_comprobantes.get_public_url(nombre_comp)

    try:
        res = (
                supabase.table(TABLA)
                .update({
                    "nombre_cliente": nombre_cliente,
                    "dni_cuit_cuil": dni_cuit_cuil,
                    "razon_social": razon_social,
                    "numero_de_factura": numero_de_factura,
                    "comprobante_url": comprobante_url,
                })
            .eq("id", id)
            .execute()
        )
        if getattr(res, "error", None):
            raise Exception(res.error.message)
        return {"ok": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
