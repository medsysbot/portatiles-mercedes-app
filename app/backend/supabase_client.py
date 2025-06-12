from dotenv import load_dotenv
import os
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("\u274c SUPABASE_URL o SUPABASE_KEY no est\u00e1n definidos en el entorno")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
