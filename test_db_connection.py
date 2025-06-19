import os
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# <!-- Actualización de conexión a base Supabase: nueva URL configurada en backend y .env -->

# Obtener la URL de conexión completa
DATABASE_URL = os.getenv("DATABASE_URL")

# Conectar a la base de datos utilizando la URL completa
try:
    connection = psycopg2.connect(DATABASE_URL)
    print("Connection successful!")

    # Crear cursor y ejecutar consulta sencilla
    cursor = connection.cursor()
    cursor.execute("SELECT NOW();")
    result = cursor.fetchone()
    print("Current Time:", result)

    cursor.close()
    connection.close()
    print("Connection closed.")
except Exception as e:
    print(f"Failed to connect: {e}")
# <!-- Pruebas de conexión y registro a Supabase completadas en entorno con acceso a internet habilitado -->
