from fastapi import APIRouter, HTTPException
from supabase import create_client
import os

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
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
        response = supabase.table("clientes").select("*").execute()
        print("\u2705 Clientes obtenidos:", response.data)
        return response.data
    except Exception as e:
        print("\u274c ERROR AL OBTENER CLIENTES:", e)
        raise HTTPException(status_code=500, detail="Error al obtener clientes.")
