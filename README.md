# Portátiles Mercedes

Sistema integral para la gestión profesional de alquiler, venta y mantenimiento de baños químicos portátiles.

## 🏢 Descripción General

Portátiles Mercedes es una solución SaaS diseñada para empresas de servicios sanitarios móviles. Permite la administración centralizada de clientes, contratos, pagos, logística, inventario, servicios técnicos y reportes de gestión, garantizando control total, eficiencia operativa y experiencia de usuario premium.

## ⚙️ Funcionalidades Principales

- **Gestión de Clientes:** Alta, edición, historial, seguimiento y segmentación de clientes.
- **Contratos y Cobros:** Registro de contratos, renovaciones, vencimientos, pagos y facturación automática.
- **Logística y Rutas:** Asignación de unidades, planificación y visualización de entregas, retiros y recorridos.
- **Servicios Técnicos:** Gestión de órdenes de trabajo, mantenimiento preventivo y correctivo, registro de intervenciones y fotografías.
- **Reportes y Estadísticas:** Dashboard analítico en tiempo real, exportación de informes, KPIs de gestión.
- **Notificaciones y Alertas:** Recordatorios automáticos para pagos, mantenimientos, vencimientos y novedades.
- **Portal de Clientes:** Acceso seguro para visualizar su situación contractual, pagos, solicitudes y documentación.
- **Seguridad:** Roles y permisos granulares, trazabilidad de todas las acciones, encriptado de datos y backups programados.

## 💻 Stack Tecnológico

- **Frontend:** HTML5, CSS3, JavaScript, framework SPA (Vue.js, React o similar), diseño 100% responsivo.
- **Backend:** Python 3, FastAPI, PostgreSQL, integración con Supabase.
- **Almacenamiento:** Supabase Storage, buckets por entidad.
- **Autenticación:** JWT, OAuth2, autenticación robusta para usuarios internos y clientes.
- **Infraestructura:** Deploy escalable en cloud (Docker, CI/CD).

## 🚀 Instalación y Puesta en Marcha

1. **Cloná el repositorio:**

## 📝 Buenas prácticas de archivos

- Utilizá imagenes e íconos solo en formato `.png`.
- Evitá espacios o caracteres especiales en los nombres.
- No subas archivos de texto ni logs dentro de `static/icons`.

## AdminLTE/CoreUI

Por el momento el proyecto no incorpora los archivos de AdminLTE ni CoreUI. Las
plantillas hacen referencia a la carpeta `/static/adminlte`, que deberá crearse
solo si se decide incluir el tema. Actualmente los estilos y scripts de
AdminLTE se cargan desde CDN para simplificar la configuración inicial.

Para agregarlos o actualizarlos en el futuro:

1. Copiá dentro de `static/adminlte` únicamente los CSS y JS que utiliza
   `base_adminlte.html` (layout principal y plugins en uso, como DataTables o
   Chart.js).
2. Eliminá demos, temas de ejemplo y plugins que no se utilicen para mantener el
   repositorio liviano.
3. Registrá en este README la versión utilizada y cualquier ajuste necesario.

### Assets recientes

- **login.js**: maneja el inicio de sesión y almacena el token en `localStorage`.
- **registro_clientes.js**: envía el formulario de registro de clientes de forma asíncrona.
- **AdminLTE 3.2**: cargado desde CDN junto con jQuery 3.6 y Bootstrap 4.6.
- **Flujo de administración**: tras el inicio de sesión, el splash (`/admin_splash`) incluye un botón que dirige únicamente al panel moderno ubicado en `/admin_panel`.
- Se eliminó el panel administrativo antiguo y su hoja de estilos, consolidando todo en la plantilla moderna AdminLTE.
- Todo el flujo posterior al splash ahora se muestra exclusivamente con esta plantilla basada en AdminLTE.

### Migración 2025-06-13

- Ruta vieja: `/admin_panel` servía un panel estático con `styles.css`.
- Ruta nueva: `/admin_panel` ahora responde con `admin_panel.html` basado en AdminLTE.
- Los endpoints privados requieren token JWT por `Authorization: Bearer`.
