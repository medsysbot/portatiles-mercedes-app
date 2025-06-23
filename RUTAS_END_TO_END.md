# RUTAS END-TO-END PORTÁTILES MERCEDES

## FRONTEND (HTML / Navegación de usuario)

| Método | Ruta | Descripción | Template/Response | Requiere Auth |
|--------|------|-------------|------------------|---------------|
| GET | / | Página de inicio / landing | index.html | No |
| GET | /login | Formulario de login | login.html | No |
| GET | /splash | Splash de bienvenida de administrador | admin_splash.html | Sí |
| GET | /admin/panel | Panel de administración moderno | admin_panel.html | Sí |
| GET | /admin/facturacion | Facturación | facturacion.html | Sí |
| GET | /admin/revisos | Revisos técnicos | revisos.html | Sí |
| GET | /admin/bash-generator | Generador de Bash | bash_generator.html | Sí |
| GET | /admin/mercadopago | Pagos (Mercado Pago) | admin_mercadopago.html | Sí |
| GET | /cliente_panel | Panel de clientes | cliente_panel.html | Sí |
| GET | /alquiler | Página para registrar alquileres | alquiler.html | Sí |
| GET | /alquiler_form | Formulario de alquiler en nueva ventana | alquiler_form.html | Sí |
| GET | /limpieza | Registro de limpiezas | limpieza.html | Sí |
| GET | /ventas | Vista de registro de ventas | ventas.html | Sí |
| GET | /venta | Formulario de venta de baños | venta.html | Sí |
| GET | /admin/inventario_banos | Inventario de baños | inventario_banos_admin.html | Sí |
| GET | /inventario_bano_form | Formulario de nuevo baño (modal) | inventario_bano_form.html | Sí |
| GET | /admin/facturas_pendientes | Listado de facturas por cobrar | facturas_pendientes.html | Sí |
| GET | /admin/facturas_pendientes/nueva | Alta de factura pendiente | facturas_pendientes_form.html | Sí |
| GET | /debito | Activación de débitos automáticos | debito.html | Sí |
| GET | /servicios | Descripción de servicios ofrecidos | servicios.html | No |
| GET    | /galeria   | Galería de imágenes       | galeria.html         | No           |
| GET | /registro_clientes | Registro de nuevos clientes | registro_clientes.html | No |
| GET | /cliente_panel.html | Panel de clientes (versión HTML) | cliente_panel.html | Sí |
| GET | /informacion-banos.html | Información sobre baños químicos | informacion-banos.html | No |
| GET | /logout | Cerrar sesión (opcional) | JSON | Sí |

> **Nota:** el botón para salir de la galería ahora redirige a la página de inicio (`/`).

## BACKEND (API / Rutas de FastAPI)

| Método | Ruta | Descripción | Template/Response | Requiere Auth |
|--------|------|-------------|------------------|---------------|
| POST | /login | Autenticación de usuario, devuelve token | JSON (token, usuario) | No |
| POST | /verificar_token | Verifica un token JWT | JSON | No |
| POST | /registrar_cliente | Registro de usuario cliente | JSON | No |
| GET | /info_cliente | Datos básicos del cliente por email (clave DNI) | JSON | Sí |
| GET | /alquileres_cliente | Alquileres asociados al cliente | JSON | Sí |
| GET | /pagos_cliente | Pagos realizados por el cliente | JSON | Sí |
| GET | /limpiezas_cliente | Limpiezas registradas para el cliente | JSON | Sí |
| POST | /guardar_datos_cliente | Guarda datos personales del cliente | JSON | Sí |
| POST | /registrar_venta | Registra una venta de baños | JSON (URL PDF) | Sí |
| POST | /registrar_limpieza | Guarda los datos de limpieza y sube remito | JSON | Sí |
| POST | /activar_debito | Activa débitos automáticos para un cliente | JSON | Sí |
| GET | /admin/clientes | Vista de clientes | HTML | Sí |
| GET | /admin/clientes/nuevo | Formulario alta de cliente | HTML | Sí |
| POST | /admin/clientes/nuevo | Crear cliente | Redirección | Sí |
| GET | /admin/clientes/{dni}/editar | Formulario edición cliente | HTML | Sí |
| POST | /admin/clientes/{dni}/editar | Actualizar cliente | Redirección | Sí |
| POST | /admin/clientes/{dni}/eliminar | Eliminar cliente | Redirección | Sí |
| GET | /admin/alquileres | Vista de alquileres | alquileres_admin.html | Sí |
| POST | /admin/alquileres/nuevo | Crear nuevo alquiler en la tabla 'alquileres' | JSON | Sí |
| GET  | /admin/api/alquileres  | Listar todos los alquileres desde la tabla 'alquileres' | JSON | Sí |
| GET  | /admin/api/inventario_banos | Listar todos los baños | JSON | Sí |
| POST | /admin/inventario_banos/nuevo | Crear nuevo baño | JSON | Sí |
| GET | /admin/facturas_pendientes | Vista de facturas pendientes | HTML | Sí |
| GET | /admin/facturas_pendientes/nueva | Formulario de factura | HTML | Sí |
| POST | /admin/facturas_pendientes/nueva | Crear factura en la tabla 'facturas_pendientes' | JSON | Sí |
| GET | /admin/api/facturas_pendientes | Listar facturas pendientes | JSON | Sí |
| GET | /admin/ventas | Consulta de ventas | JSON | Sí |
| GET | /admin/limpiezas | Consulta de limpiezas | JSON | Sí |
| POST | /ejecutar_alertas | Ejecuta manualmente las alertas programadas | JSON | Sí |

## SUPABASE

Ejemplo de tabla principal: **usuarios**

- `id`
- `email`
- `password_hash`
- `nombre`
- `rol`
- `activo`
<!-- Eliminado envío y lógica de campos creado_en y actualizado_en porque ya no existen en la tabla usuarios. -->

Mantener este archivo actualizado para soporte y desarrollo.

### Historial reciente

- 2025-06-13: migración total al panel administrativo moderno (`/admin/panel`). Ruta anterior `/panel_viejo` declarada obsoleta.
