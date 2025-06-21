# Módulo de alquileres

Este informe describe las vistas y endpoints implementados para gestionar alquileres de baños químicos en el sistema.

## Funcionalidades principales

- Listado de alquileres en el panel administrativo con tabla ordenable.
- Búsqueda instantánea por número de baño o cliente.
- Formulario dedicado para alta de alquileres desde el panel.
- Formulario público independiente que se abre en una nueva pestaña.
- Registro de datos en la tabla `alquileres` de Supabase.

## Rutas y plantillas

| Método | Ruta | Descripción |
|-------|------|-------------|
| GET | `/admin/alquileres` | Vista con la tabla de alquileres (`alquileres_admin.html`) |
| GET | `/admin/alquileres/nuevo` | Formulario de alta (`alquiler_form_admin.html`) |
| POST | `/admin/alquileres/nuevo` | Creación de alquiler |
| GET | `/admin/api/alquileres` | Listado en formato JSON |
| GET | `/alquiler` | Página informativa pública |
| GET | `/alquiler_form` | Formulario de solicitud de alquiler |

Estas herramientas permiten registrar nuevos contratos de forma ágil y mantener un historial básico de alquileres.

## Próximos pasos

1. Incorporar edición y eliminación de alquileres desde el panel.
2. Validar fechas y datos obligatorios en el backend.
3. Añadir filtros por rango de fechas y estado del contrato.
