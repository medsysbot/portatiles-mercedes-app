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
   ```bash
   git clone https://github.com/tu-usuario/portatiles-mercedes-app.git
   cd portatiles-mercedes-app
   ```
2. **Instalá las dependencias:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Configurá las variables de entorno:**
   Asegurate de definir `SUPABASE_URL`, `SUPABASE_KEY` y `JWT_SECRET` en un
   archivo `.env`. El valor recomendado de `SUPABASE_KEY` es el mismo que
   `SUPABASE_ROLE_KEY` en tu panel de Supabase. Si querés habilitar el envío de
   correos desde el módulo de emails agregá también `EMAIL_ORIGEN`,
   `EMAIL_PASSWORD`, `SMTP_SERVER` y `SMTP_PORT`.
   Para que los enlaces de recuperación de contraseña apunten al dominio correcto,
   seteá `APP_URL` con la URL pública del proyecto (por ejemplo
   `https://mercedes-app-production.up.railway.app`).
   Recordá que para habilitar la conexión con Supabase tenés que poner
   `ENABLE_SUPABASE=1`.

## 📝 Buenas prácticas de archivos

- Utilizá imagenes e íconos solo en formato `.png`.
- Evitá espacios o caracteres especiales en los nombres.
- No subas archivos de texto ni logs dentro de `app_publico/static/icons`.

## AdminLTE/CoreUI

Por el momento el proyecto no incorpora los archivos de AdminLTE ni CoreUI. Las
plantillas hacen referencia a la carpeta `/app_publico/static/adminlte`, que deberá crearse
solo si se decide incluir el tema. Actualmente los estilos y scripts de
AdminLTE se cargan desde CDN para simplificar la configuración inicial.

Para agregarlos o actualizarlos en el futuro:

1. Copiá dentro de `app_publico/static/adminlte` únicamente los CSS y JS que utiliza
   `base_adminlte.html` (layout principal y plugins en uso, como DataTables o
   Chart.js).
2. Eliminá demos, temas de ejemplo y plugins que no se utilicen para mantener el
   repositorio liviano.
3. Registrá en este README la versión utilizada y cualquier ajuste necesario.

### Assets recientes

- **login.js**: maneja el inicio de sesión y almacena el token en `localStorage`.
- **registro_clientes.js**: envía el formulario de registro de clientes de forma asíncrona.
- **AdminLTE 3.2**: cargado desde CDN junto con jQuery 3.6 y Bootstrap 4.6.
- **Flujo de administración**: tras el inicio de sesión, se muestra un splash (`/splash`) durante unos segundos y luego se redirige automáticamente al tablero en `/admin/panel`.
- Se eliminó el panel administrativo antiguo y su hoja de estilos, consolidando todo en la plantilla moderna AdminLTE.
- Todo el flujo posterior al splash ahora se muestra exclusivamente con esta plantilla basada en AdminLTE.
- **fondo-panel.png**: se usa como imagen de fondo fija para todo el panel administrativo.

### Migración 2025-06-13

- Ruta vieja: `/admin_panel` servía un panel estático con `styles.css`.
- Ruta nueva: `/admin/panel` ahora responde con `admin_panel.html` basado en AdminLTE.
- Los endpoints privados requieren token JWT por `Authorization: Bearer`.
- Desde esta migración, **AdminLTE** queda establecido como la plantilla oficial para todo el panel administrativo. El panel anterior se eliminó por completo.

### Limpieza 2025-06-15

- Se eliminaron las plantillas obsoletas `admin_bash.html`, `admin_facturacion.html`, `admin_revisos.html` y `panel_admin.html`.
- Solo permanecen las plantillas vigentes en `/templates` y los assets actuales en `/static` y `app_publico/static`.

### Panel administrativo modular 2025-06-17

`panel_admin.html` actúa como layout del dashboard y cada módulo cuenta con su propia vista.
Principales rutas disponibles:

- `/admin/clientes` → `clientes_admin.html`
  - Alta: `/admin/clientes/nuevo`
  - Edición: `/admin/clientes/{dni_cuit_cuil}/editar`
- `/admin/alquileres` → `alquileres_admin.html`
- `/admin/ventas` → `ventas_admin.html`
- `/admin/limpiezas` → `limpiezas_admin.html`
- `/admin/reportes` → `reportes_admin.html`
- `/admin/facturacion` → `facturacion_admin.html`
- `/admin/morosos` → `morosos_admin.html`
- `/admin/api/morosos/eliminar` → elimina registros seleccionados
- `/admin/emails` → `emails_admin.html`
- `/admin/ia-respuestas` → `ia_respuestas_admin.html`
- `/admin/bash-generator` → `bash_generator_admin.html`
- `/admin/mercadopago` → `mercadopago_admin.html`

Las peticiones de datos se sirven ahora en endpoints `/admin/api/*` para separar las vistas HTML del API.

### Actualización módulo de clientes 2025-06-17

Se incorporaron campos de **apellido** y **observaciones** en el CRUD de clientes,
además de búsqueda en tiempo real por nombre, DNI o email. Esta sección ahora es
accesible para usuarios con rol *Administrador* o *Empleado*.

### Unificación visual de tablas 2025-07-05

Se estandarizó el contenedor gris semitransparente en todas las tablas del panel
de clientes, aplicando la misma regla `.card` que ya utilizan los paneles
administrativo y de empleados. De esta manera se eliminan los recuadros blancos y
se mantiene la homogeneidad visual en todo el sistema.

### Ubicación de plantillas públicas

Los archivos HTML visibles para cualquier visitante se almacenan en
`app_publico/templates`. Allí se encuentran, entre otros:

- `index.html` (página de bienvenida o *landing*).
- `login.html`.
- `registro_clientes.html`.
- `informacion-banos.html`.

Esto facilita mantener separadas las plantillas públicas de las privadas y
centraliza la carga de vistas estáticas.

## 🧪 Tests

Para ejecutar los tests desde la raíz del proyecto se debe exponer el paquete
`app` en el `PYTHONPATH`. Ejecutá:

```bash
PYTHONPATH=. pytest
```

De esta manera `pytest` podrá resolver todos los imports de forma correcta.

## Ajuste de la tabla `empleados_salarios`

Para permitir múltiples registros de salario por empleado, se agregó el script
[`sql/remove_unique_empleados_salarios.sql`](sql/remove_unique_empleados_salarios.sql)
que elimina posibles restricciones `UNIQUE` sobre `dni_cuit_cuil` y campos
relacionados. Ejecutá el script desde una terminal con `psql` o mediante el
editor SQL de Supabase:

```bash
psql "$DATABASE_URL" -f sql/remove_unique_empleados_salarios.sql
```

Esto deja solo la clave primaria `id` como identificador único y habilita la
carga de múltiples sueldos para un mismo empleado.

## 🔐 API de Login y Registro

A continuación se describen los principales endpoints para autenticación de usuarios. Todos devuelven y reciben datos en formato JSON salvo que se indique lo contrario.

### POST `/login`
Autentica al usuario según su correo y rol.

**Request**
```json
{
  "email": "admin@portatiles.com",
  "password": "admin123",
  "rol": "Administrador"
}
```

> **Nota:** el campo debe llamarse siempre `password`. Evitá usar variantes con
> ñ o tildes en el nombre de la propiedad.

**Respuesta exitosa**
```json
{
  "access_token": "<jwt>",
  "rol": "Administrador",
  "nombre": "Admin",
  "token_type": "bearer"
}
```

**Errores comunes**
- `401` Usuario o contraseña incorrectos
- `403` Usuario inactivo

### POST `/registrar_cliente`
Registra un nuevo cliente. Los datos se envían como `multipart/form-data`.

**Campos requeridos**
- `nombre`
- `email`
- `password`

**Respuesta exitosa**
```json
{ "mensaje": "Registro exitoso" }
```

En caso de fallar se devuelve `400` con el detalle del error.

### POST `/verificar_token`
Verifica la validez de un token JWT.
Los tokens poseen expiración configurada en el servidor.

**Request**
```json
{ "token": "<jwt>" }
```

**Respuesta exitosa**
```json
{ "status": "ok", "rol": "Administrador", "user_id": "<uuid>", "email": "admin@portatiles.com" }
```

Si el token es inválido, expiró o falta se obtiene `401` con el mensaje correspondiente.

### Consumo desde JavaScript
Ejemplo básico de inicio de sesión con `fetch`:
```js
fetch('/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, rol })
}).then(async r => {
  const data = await r.json();
  if (r.ok && data.access_token) {
    localStorage.setItem('access_token', data.access_token);
  }
});
```
Para verificar el token:
```js
fetch('/verificar_token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: localStorage.getItem('access_token') })
});
```

### Recomendaciones de seguridad
- Evitá imprimir contraseñas o tokens en la consola o archivos de log.
- Guardá el token sólo el tiempo necesario (por ejemplo en `localStorage`) y eliminalo al cerrar sesión.
- Utilizá siempre HTTPS para proteger las credenciales durante la comunicación.
- Mantené las claves secretas (`JWT_SECRET`, etc.) en variables de entorno y fuera del repositorio.

