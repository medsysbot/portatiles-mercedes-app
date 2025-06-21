"""
----------------------------------------------------------
Archivo: routes/clientes.py
Descripción: Endpoints para consultas de clientes
Última modificación: 2025-06-20
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from fastapi import APIRouter, HTTPException
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
    if not supabase:
        print("\u274c Supabase no configurado")
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        print("\ud83d\udd0d Solicitando clientes desde Supabase...")
        response = supabase.table("datos_personales_clientes").select("*").execute()
        clientes = response.data or []
        for c in clientes:
            for key in c:
                if isinstance(c[key], str):
                    c[key] = c[key].encode("utf-8", "replace").decode("utf-8")
        print("\u2705 Clientes obtenidos:", clientes)
        return clientes
    except Exception as e:
        print("\u274c ERROR AL OBTENER CLIENTES:", e)
        return JSONResponse(status_code=500, content={"detail": "Error al obtener clientes."})
