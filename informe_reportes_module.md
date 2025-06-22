# Módulo de reportes

Este documento resume las vistas y endpoints implementados para la gestión de reportes dentro del sistema.

## Funcionalidades principales

- Listado de reportes en el panel administrativo con tabla ordenable.
- Búsqueda por nombre de la persona o asunto.
- Formulario dedicado para crear nuevos reportes.
- Registro de datos en la tabla `reportes` de Supabase.

## Rutas y plantillas

| Método | Ruta | Descripción |
|-------|------|-------------|
| GET | `/admin/reportes` | Vista con la tabla de reportes (`reportes_admin.html`) |
| GET | `/admin/reportes/nuevo` | Formulario de alta (`reporte_form.html`) |
| POST | `/admin/reportes/nuevo` | Creación de reporte |
| GET | `/admin/api/reportes` | Listado en formato JSON |

Con estas herramientas el administrador puede revisar y registrar reportes de manera centralizada.
