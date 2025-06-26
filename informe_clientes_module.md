# Módulo de gestión de clientes

Este informe resume las vistas y endpoints implementados para administrar clientes desde el panel de control.

## Funcionalidades principales

- Listado de clientes con búsqueda por nombre, email y estado.
- Paginación automática para volúmenes grandes de datos.
- Formularios de alta y edición con validación de campos.
- Eliminación protegida con confirmación.
- Acceso restringido a usuarios con rol **Administrador**.

## Rutas y plantillas

| Método | Ruta | Descripción |
|-------|------|-------------|
| GET | `/admin/clientes` | Tabla de clientes (`clientes_admin.html`) |
| GET | `/admin/clientes/nuevo` | Formulario de alta (`cliente_form.html`) |
| POST | `/admin/clientes/nuevo` | Creación de cliente |
| GET | `/admin/clientes/{dni_cuit_cuil}/editar` | Formulario de edición |
| POST | `/admin/clientes/{dni_cuit_cuil}/editar` | Actualización de datos |
| POST | `/admin/clientes/{dni_cuit_cuil}/eliminar` | Borrado de cliente |

Estos cambios permiten gestionar de manera integral la base de clientes sin salir del panel administrativo.
