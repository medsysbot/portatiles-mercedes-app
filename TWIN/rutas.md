# Rutas - Módulo de Alquileres

Este documento resume los endpoints principales para la gestión de alquileres en Portátiles Mercedes.

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/alquileres` | Vista de gestión de alquileres (`alquileres_admin.html`). | Sí |
| POST | `/admin/alquileres/nuevo` | Crea un alquiler verificando número de baño único. | Sí |
| GET | `/admin/api/alquileres` | Devuelve la lista completa de alquileres desde la base. | Sí |

Mantener esta lista actualizada facilita el seguimiento de cambios en el backend.

## Rutas - Inventario de Baños

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/inventario` | Vista principal del inventario (`inventario_banos_admin.html`). | Sí |
| GET | `/inventario_bano_form` | Formulario modal para cargar un baño nuevo (`inventario_bano_form.html`). | Sí |
| GET | `/admin/api/inventario_banos` | Devuelve la lista completa de baños desde la base. | Sí |
| POST | `/admin/inventario_banos/nuevo` | Crea un registro de baño en la tabla `inventario_banos`. | Sí |
