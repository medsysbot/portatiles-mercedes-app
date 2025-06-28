# Rutas - Módulo de Alquileres

Este documento resume los endpoints principales para la gestión de alquileres en Portátiles Mercedes.

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/alquileres` | Vista de gestión de alquileres (`alquileres_admin.html`). | Sí |
| POST | `/admin/alquileres/nuevo` | Crea un alquiler verificando número de baño único. | Sí |
| GET | `/admin/api/alquileres` | Devuelve la lista completa de alquileres desde la base. | Sí |
| POST | `/admin/api/alquileres/eliminar` | Elimina varios alquileres por número de baño. | Sí |

Mantener esta lista actualizada facilita el seguimiento de cambios en el backend.

## Rutas - Inventario de Baños

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/inventario_banos` | Vista principal del inventario (`inventario_banos_admin.html`). | Sí |
| GET | `/admin/api/inventario_banos` | Devuelve la lista completa de baños desde la base. | Sí |
| POST | `/admin/inventario_banos/nuevo` | Crea un registro de baño en la tabla `inventario_banos`. | Sí |
| POST | `/admin/api/inventario_banos/eliminar` | Elimina registros seleccionados del inventario. | Sí |

## Rutas - Clientes

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/api/clientes` | Lista de clientes con filtros. | Sí |
| GET | `/admin/api/clientes/todos` | Lista completa sin filtros. | Sí |
| POST | `/admin/api/clientes/eliminar` | Elimina clientes por DNI. | Sí |

## Rutas - Empleados

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/empleados` | Vista de empleados (`empleados_admin.html`). | Sí |
| GET | `/admin/empleados/nuevo` | Formulario para crear un empleado. | Sí |
| POST | `/admin/empleados/nuevo` | Alta de empleados. | Sí |
| POST | `/admin/api/empleados/eliminar` | Elimina empleados por ID. | Sí |

## Rutas - Ventas

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/ventas` | Vista de administración de ventas (`ventas_admin.html`). | Sí |
| GET | `/admin/ventas/nueva` | Formulario de alta de venta. | Sí |
| POST | `/admin/ventas/nueva` | Crea una venta en la tabla `ventas`. | Sí |
| GET | `/admin/api/ventas` | Devuelve el listado de ventas. | Sí |
| POST | `/admin/api/ventas/eliminar` | Elimina ventas por ID. | Sí |

## Rutas - Servicios de limpieza

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/limpieza` | Vista principal del módulo (`limpieza_admin.html`). | Sí |
| GET | `/admin/limpieza/nuevo` | Formulario para crear un servicio. | Sí |
| POST | `/admin/limpieza/nuevo` | Guarda un servicio en `servicios_limpieza`. | Sí |
| GET | `/admin/api/servicios_limpieza` | Lista completa de servicios de limpieza. | Sí |
| POST | `/admin/api/servicios_limpieza/eliminar` | Elimina servicios de limpieza por ID. | Sí |

## Rutas - Limpiezas programadas

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/programacion_limpiezas/view` | Formulario y tabla de limpiezas programadas. | Sí |
| GET | `/admin/api/limpiezas_programadas` | Lista completa de limpiezas programadas. | Sí |
| POST | `/admin/api/limpiezas_programadas/agregar` | Registra una limpieza programada. | Sí |
| POST | `/admin/api/limpiezas_programadas/eliminar` | Elimina limpiezas programadas por ID. | Sí |
| GET | `/empleado/programacion_limpiezas/view` | Tabla de limpiezas programadas para empleados. | Sí |
| GET | `/empleado/api/limpiezas_programadas` | Datos de limpiezas programadas para empleados. | Sí |
| GET | `/cliente/programacion_limpiezas/view` | Tabla de limpiezas programadas para clientes. | Sí |
| GET | `/cliente/api/limpiezas_programadas` | Limpiezas programadas del cliente autenticado. | Sí |

## Rutas - Reportes

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/reportes` | Vista de administración de reportes (`reportes_admin.html`). | Sí |
| GET | `/admin/reportes/nuevo` | Formulario para crear un reporte. | Sí |
| POST | `/admin/reportes/nuevo` | Crea un reporte en la tabla `reportes`. | Sí |
| GET | `/admin/api/reportes` | Devuelve el listado de reportes. | Sí |
| POST | `/admin/api/reportes/eliminar` | Elimina reportes por ID. | Sí |

## Rutas - Facturas pendientes

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/facturas_pendientes` | Vista de facturas pendientes (`facturas_pendientes.html`). | Sí |
| GET | `/admin/facturas_pendientes/nueva` | Formulario para crear una factura pendiente. | Sí |
| POST | `/admin/facturas_pendientes/nueva` | Crea una factura en la tabla `facturas_pendientes`. | Sí |
| GET | `/admin/api/facturas_pendientes` | Devuelve el listado de facturas pendientes. | Sí |
| POST | `/admin/api/facturas_pendientes/eliminar` | Elimina facturas pendientes por ID. | Sí |

## Rutas - Morosos

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/morosos` | Vista de morosos (`morosos_admin.html`). | Sí |
| GET | `/admin/morosos/nuevo` | Formulario para crear un registro de moroso. | Sí |
| POST | `/admin/morosos/nuevo` | Crea un moroso en la tabla `morosos`. | Sí |
| GET | `/admin/api/morosos` | Devuelve el listado de morosos. | Sí |

## Rutas - Emails

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/emails` | Vista principal de emails (`emails_admin.html`). | Sí |
| GET | `/admin/api/emails` | Devuelve los últimos 10 correos recibidos. | Sí |
| POST | `/admin/emails/enviar` | Envía un correo desde la cuenta configurada. | Sí |

## Rutas - Splash

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/splash_empleado` | Pantalla transitoria para empleados (`splash_empleado.html`). | Sí |

## Rutas - Panel de Empleados

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/empleado/panel` | Vista principal del panel de empleado (`panel_empleado.html`). | Sí |
| GET | `/empleado/reportes` | Listado de reportes (`reportes_empleado.html`). | Sí |
| GET | `/empleado/reportes/nuevo` | Formulario para crear un reporte. | Sí |
| POST | `/empleado/reportes/nuevo` | Guarda un reporte en `reportes`. | Sí |
| GET | `/empleado/api/reportes` | Devuelve la lista de reportes. | Sí |
| GET | `/empleado/limpieza` | Vista de servicios de limpieza (`limpieza_empleado.html`). | Sí |
| GET | `/empleado/limpieza/nuevo` | Formulario para crear un servicio de limpieza. | Sí |
| POST | `/empleado/limpieza/nuevo` | Guarda un servicio en `servicios_limpieza`. | Sí |
| GET | `/empleado/api/servicios_limpieza` | Devuelve la lista de servicios de limpieza. | Sí |
| POST | `/empleado/api/servicios_limpieza/eliminar` | Elimina servicios de limpieza por ID. | Sí |

## Rutas - Dashboard

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/api/dashboard` | Datos mensuales para los gráficos del panel. | Sí |
| GET | `/dashboard_admin.js` | Script para actualizar los gráficos del dashboard. | No |

## Rutas - Gráficos

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/graficos` | Vista para cargar datos manuales y actualizar gráficos. | Sí |

## Rutas - Panel de Clientes

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/alquileres_cliente` | Alquileres filtrados por DNI | Sí |
| GET | `/facturas_pendientes_cliente` | Facturas pendientes del cliente | Sí |
| GET | `/facturas_cliente` | Historial de facturación | Sí |
| GET | `/limpiezas_cliente` | Servicios de limpieza del cliente | Sí |
| GET | `/ventas_cliente` | Ventas asociadas al cliente | Sí |
| POST | `/cliente/reporte` | Envía un reporte desde el panel | Sí |
| POST | `/cliente/email` | Envía un email a la empresa | Sí |

## Rutas - Recuperación de contraseña

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/recuperar_password` | Formulario para solicitar el enlace de recuperación | No |
| POST | `/recuperar_password` | Procesa el envío del email de recuperación | No |
| GET | `/reset_password` | Formulario para ingresar la nueva contraseña | No |
| POST | `/reset_password` | Actualiza la contraseña usando el token recibido | No |

## Rutas - Recursos Humanos

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/admin/recursos_humanos` | Vista unificada de Recursos Humanos | Sí |
| GET | `/empleado/recursos_humanos` | Recursos Humanos para el empleado | Sí |
| GET | `/admin/empleados_datos_personales` | Vista de datos personales de empleados | Sí |
| POST | `/admin/empleados_datos_personales/nuevo` | Alta de dato personal | Sí |
| GET | `/admin/api/empleados_datos_personales` | Lista completa de datos personales | Sí |
| POST | `/admin/api/empleados_datos_personales/eliminar` | Elimina registros por ID | Sí |
| GET | `/empleado/datos_personales` | Vista de datos personales para el empleado | Sí |
| GET | `/empleado/api/datos_personales` | Datos personales del empleado autenticado | Sí |
| GET | `/admin/empleados_salarios` | Vista de salarios de empleados | Sí |
| POST | `/admin/empleados_salarios/nuevo` | Alta de salario | Sí |
| GET | `/admin/api/empleados_salarios` | Lista de salarios | Sí |
| POST | `/admin/api/empleados_salarios/eliminar` | Elimina salarios por ID | Sí |
| GET | `/empleado/empleados_salarios` | Vista de salarios del empleado | Sí |
| GET | `/empleado/api/empleados_salarios` | Salarios del empleado autenticado | Sí |
| GET | `/admin/empleados_ausencias` | Vista de ausencias de empleados | Sí |
| POST | `/admin/empleados_ausencias/nuevo` | Alta de ausencia | Sí |
| GET | `/admin/api/empleados_ausencias` | Lista de ausencias | Sí |
| POST | `/admin/api/empleados_ausencias/eliminar` | Elimina ausencias por ID | Sí |
| GET | `/empleado/empleados_ausencias` | Vista de ausencias del empleado | Sí |
| GET | `/empleado/api/empleados_ausencias` | Ausencias del empleado autenticado | Sí |
