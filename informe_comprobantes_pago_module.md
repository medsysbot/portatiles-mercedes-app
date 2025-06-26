# Módulo de comprobantes de pago

Este documento resume las nuevas rutas y plantillas para manejar los comprobantes de pago subidos por los clientes.

## Funcionalidades

- Formulario en el panel del cliente para cargar comprobantes en formato JPG o PNG.
- Almacenamiento de las imágenes en el bucket `comprobantes-pago` de Supabase.
- Registro en la tabla `comprobantes_pago` con enlace al archivo y fecha de envío.
- Listado de comprobantes en el panel del cliente con opción de eliminar múltiples registros a la vez.
- Vista de solo lectura en el panel de administración.

## Rutas nuevas destacadas

| Método | Ruta | Descripción |
|-------|------|-------------|
| POST | `/api/comprobantes_pago` | Carga un comprobante y guarda la URL |
| GET | `/api/comprobantes_pago` | Lista los comprobantes del cliente |
| DELETE | `/api/comprobantes_pago/{id}` | Borra un comprobante del cliente (la interfaz permite seleccionar varios) |
| GET | `/admin/api/comprobantes_pago` | Listado completo para administración |

Con estas incorporaciones los usuarios pueden enviar sus comprobantes de manera segura y la administración puede revisarlos desde su panel.
