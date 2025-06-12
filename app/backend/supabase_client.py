from dotenv import load_dotenv
import os
from supabase import create_client, Client

load_dotenv(override=True)

# Debug de variables de entorno para verificar configuración en Railway
print("DEBUG SUPABASE_URL:", os.getenv("SUPABASE_URL"))
print("DEBUG SUPABASE_ROLE_KEY:", os.getenv("SUPABASE_ROLE_KEY"))
print("DEBUG JWT_SECRET:", os.getenv("JWT_SECRET"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("\u274c SUPABASE_URL o SUPABASE_ROLE_KEY no est\u00e1n definidos en el entorno")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
