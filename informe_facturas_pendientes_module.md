# Módulo de facturas pendientes

Este documento resume las pantallas y endpoints implementados para registrar facturas con saldo a cobrar.

## Funcionalidades principales

- Vista con tabla ordenable y buscador por DNI/CUIT.
- Formulario de alta simple para cargar cada factura.
- Almacenamiento de registros en la tabla `facturas_pendientes` de Supabase.

## Rutas y plantillas

| Método | Ruta | Descripción |
|-------|------|-------------|
| GET | `/admin/facturas_pendientes` | Tabla de facturas pendientes (`facturas_pendientes.html`) |
| GET | `/admin/facturas_pendientes/nueva` | Formulario de alta (`facturas_pendientes_form.html`) |
| POST | `/admin/facturas_pendientes/nueva` | Creación de factura |
| GET | `/admin/api/facturas_pendientes` | Listado en formato JSON |

Este módulo permite llevar un control básico de las facturas que aún no fueron canceladas.
