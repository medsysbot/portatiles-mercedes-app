from supabase import create_client
import os

if __name__ == "__main__":
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")

    supabase = create_client(url, key)
    data = supabase.table("datos_personales_clientes").select("*").limit(1).execute()
    print("Conexión ok:", data)
