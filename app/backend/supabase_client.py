from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv(override=True)

print("DEBUG SUPABASE_URL:", os.getenv("SUPABASE_URL"))
print("DEBUG SUPABASE_ROLE_KEY:", os.getenv("SUPABASE_ROLE_KEY"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Supabase no configurado")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
