"""
----------------------------------------------------------
Archivo: utils/supabase_client.py
Descripción: Inicializa el cliente de Supabase
Última modificación: 2025-06-15
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from supabase import create_client
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Supabase no configurado")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

