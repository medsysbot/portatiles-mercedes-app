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
| GET | `/admin/inventario_banos` | Vista principal del inventario (`inventario_banos_admin.html`). | Sí |
| GET | `/admin/api/inventario_banos` | Devuelve la lista completa de baños desde la base. | Sí |
| POST | `/admin/inventario_banos/nuevo` | Crea un registro de baño en la tabla `inventario_banos`. | Sí |

## Rutas - Ventas

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/ventas` | Vista de administración de ventas (`ventas_admin.html`). | Sí |
| GET | `/admin/ventas/nueva` | Formulario de alta de venta. | Sí |
| POST | `/admin/ventas/nueva` | Crea una venta en la tabla `ventas`. | Sí |
| GET | `/admin/api/ventas` | Devuelve el listado de ventas. | Sí |

## Rutas - Servicios de limpieza

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/limpieza` | Vista principal del módulo (`limpieza_admin.html`). | Sí |
| GET | `/admin/limpieza/nuevo` | Formulario para crear un servicio. | Sí |
| POST | `/admin/limpieza/nuevo` | Guarda un servicio en `servicios_limpieza`. | Sí |
| GET | `/admin/api/servicios_limpieza` | Lista completa de servicios de limpieza. | Sí |

## Rutas - Reportes

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/reportes` | Vista de administración de reportes (`reportes_admin.html`). | Sí |
| GET | `/admin/reportes/nuevo` | Formulario para crear un reporte. | Sí |
| POST | `/admin/reportes/nuevo` | Crea un reporte en la tabla `reportes`. | Sí |
| GET | `/admin/api/reportes` | Devuelve el listado de reportes. | Sí |

## Rutas - Facturas pendientes

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/facturas_pendientes` | Vista de facturas pendientes (`facturas_pendientes.html`). | Sí |
| GET | `/admin/facturas_pendientes/nueva` | Formulario para crear una factura pendiente. | Sí |
| POST | `/admin/facturas_pendientes/nueva` | Crea una factura en la tabla `facturas_pendientes`. | Sí |
| GET | `/admin/api/facturas_pendientes` | Devuelve el listado de facturas pendientes. | Sí |
