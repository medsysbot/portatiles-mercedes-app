"""
----------------------------------------------------------
Archivo: routes/clientes.py
Descripción: Endpoints para consultas de clientes
Última modificación: 2025-06-20
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from supabase import create_client
import os

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.get("/clientes")
async def obtener_clientes():
    try:
        response = supabase.table("datos_personales_clientes").select("*").execute()
        clientes = response.data or []

        # 🔒 Reemplazar caracteres inválidos para evitar error de codificación
        for c in clientes:
            for key in c:
                if isinstance(c[key], str):
                    c[key] = c[key].encode("utf-8", "replace").decode("utf-8")

        return JSONResponse(content=clientes)

    except Exception as e:
        return JSONResponse(content={"detail": "Error al obtener clientes."}, status_code=500)
