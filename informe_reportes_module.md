# Módulo de reportes

Este documento explica cómo se cargan los datos desde Supabase y se muestran en la vista de administración de reportes. Se tomó como referencia la lógica utilizada en el módulo de **alquileres**, adaptándola a la tabla `reportes`.

## Funcionalidades principales

- Listado de reportes en una tabla ordenable mediante DataTables.
- Búsqueda por nombre de la persona o asunto del reporte.
- Formulario de alta de reportes desde el panel de administración.
- Registro de datos en la tabla `reportes` de Supabase.

## Rutas y plantillas

| Método | Ruta | Descripción |
|-------|------|-------------|
| GET | `/admin/reportes` | Vista con la tabla de reportes (`reportes_admin.html`) |
| GET | `/admin/reportes/nuevo` | Formulario de alta (`reporte_form.html`) |
| POST | `/admin/reportes/nuevo` | Creación de reporte |
| GET | `/admin/api/reportes` | Listado en formato JSON |

## Lógica de carga y visualización

1. **Consulta a Supabase**
   - En `routes/reportes.py` se define el endpoint `/admin/api/reportes`.
   - Este endpoint realiza `supabase.table("reportes").select("*").execute()` y normaliza los campos para enviarlos como JSON.

2. **Script del frontend**
   - `static/js/reportes_admin.js` se ejecuta al cargar la plantilla `reportes_admin.html`.
   - Inicializa un DataTable sobre la tabla `#tablaReportes` y deshabilita la búsqueda interna para utilizar un filtro personalizado.
   - La función `cargarReportes()` hace `fetch('/admin/api/reportes')` enviando el token desde `localStorage`.
   - Al recibir los datos, se llaman `mostrarReportes()` y `mostrarMensaje()` para actualizar la tabla o notificar si no existen registros.
   - Se permite filtrar escribiendo en el campo `#busquedaReportes` o presionando el botón "Buscar".

3. **Formulario de alta**
   - El template `reporte_form.html` contiene campos para fecha, nombre de la persona, asunto y contenido.
   - Al enviar el formulario se envía un `POST` a `/admin/reportes/nuevo`, donde se valida la estructura con el modelo `ReporteNuevo`.
   - Si todo es correcto se inserta el registro en la tabla y se redirige nuevamente al listado.

## Próximos pasos

- Incorporar edición y eliminación de reportes desde el panel.
- Mejorar la paginación y agregar filtros por rango de fechas.
