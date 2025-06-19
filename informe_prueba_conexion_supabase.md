# Informe de Prueba de Conexión a Supabase

Se verificó que el archivo `.env` contiene la variable de entorno:
- `DATABASE_URL=postgresql://postgres.kccmlqoqhbkaecvetfce:porta1182villa@aws-0-us-west-1.pooler.supabase.com:5432/postgres`

Luego se ejecutó `test_db_connection.py` para probar la conexión utilizando la URL completa.

Resultado obtenido:
```
Failed to connect: connection to server at "aws-0-us-west-1.pooler.supabase.com" (54.177.55.191), port 5432 failed: Network is unreachable
        Is the server running on that host and accepting TCP/IP connections?
connection to server at "aws-0-us-west-1.pooler.supabase.com" (52.8.172.168), port 5432 failed: Network is unreachable
        Is the server running on that host and accepting TCP/IP connections?
```

El error indica que el entorno no puede establecer conexión con el host especificado. Esto puede deberse a restricciones de red en el entorno de ejecución a pesar de que el acceso a internet esté habilitado.

No fue posible realizar consultas de lectura o inserción en la tabla `CLIENTES` debido a la falta de conexión.

