# RUTAS END-TO-END PORTÁTILES MERCEDES

## FRONTEND (HTML / Navegación de usuario)

| Método | Ruta | Descripción | Template/Response | Requiere Auth |
|--------|------|-------------|------------------|---------------|
| GET | / | Página de inicio / landing | index.html | No |
| GET | /login | Formulario de login | login.html | No |
| GET | /admin_splash | Splash de bienvenida de administrador | admin_splash.html | Sí |
| GET | /admin_panel | Panel de administración moderno | admin_panel.html | Sí |
| GET | /panel_viejo | [OBSOLETA] Panel anterior | panel_viejo.html | Sí |
| GET | /cliente_panel | Panel de clientes | cliente_panel.html | Sí |
| GET | /alquiler | Página para registrar alquileres | alquiler.html | Sí |
| GET | /alquiler_form | Formulario de alquiler en nueva ventana | alquiler_form.html | Sí |
| GET | /limpieza | Registro de limpiezas | limpieza.html | Sí |
| GET | /ventas | Vista de registro de ventas | ventas.html | Sí |
| GET | /venta | Formulario de venta de baños | venta.html | Sí |
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
| GET | /info_cliente | Datos básicos del cliente por DNI | JSON | Sí |
| GET | /alquileres_cliente | Alquileres asociados al cliente | JSON | Sí |
| GET | /pagos_cliente | Pagos realizados por el cliente | JSON | Sí |
| GET | /limpiezas_cliente | Limpiezas registradas para el cliente | JSON | Sí |
| POST | /registrar_alquiler | Guarda un alquiler de baño | JSON | Sí |
| POST | /registrar_venta | Registra una venta de baños | JSON (URL PDF) | Sí |
| POST | /registrar_limpieza | Guarda los datos de limpieza y sube remito | JSON | Sí |
| POST | /activar_debito | Activa débitos automáticos para un cliente | JSON | Sí |
| GET | /admin/clientes | Lista de clientes con filtros | JSON | Sí |
| GET | /admin/alquileres | Consulta de alquileres | JSON | Sí |
| GET | /admin/ventas | Consulta de ventas | JSON | Sí |
| GET | /admin/limpiezas | Consulta de limpiezas | JSON | Sí |
| GET | /ver_archivo | Devuelve el contenido de un archivo del proyecto | Texto plano | Sí |
| POST | /ejecutar_alertas | Ejecuta manualmente las alertas programadas | JSON | Sí |
| GET | /test_echo | [SOLO TESTING] Devuelve eco de pruebas | JSON | No |
| POST | /test_env | [SOLO TESTING] Devuelve variables de entorno | JSON | No |

## SUPABASE

Ejemplo de tabla principal: **usuarios**

- `id`
- `email`
- `password_hash`
- `nombre`
- `rol`
- `activo`
- `creado_en`
- `actualizado_en`

Mantener este archivo actualizado para soporte y desarrollo.

### Historial reciente

- 2025-06-13: migración total al panel administrativo moderno (`/admin_panel`). Ruta anterior `/panel_viejo` declarada obsoleta.
