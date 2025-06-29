# Rutas de recursos estáticos - Portátiles Mercedes

## Estructura
/app_publico/static/imagenes/portada-index.png
/app_publico/static/imagenes/evento-1.png
/app_publico/static/icons/alquiler.png
/app_publico/static/icons/logo-institucional.png

## Uso en HTML
```html
<img src="/app_publico/static/icons/alquiler.png" alt="Alquiler de baño">
<img src="/app_publico/static/imagenes/portada-index.png" alt="Portada">
```

## Uso en CSS
```css
background: url('/app_publico/static/imagenes/portada-index.png');
```


## CSS global de tablas
El archivo `/static/css/style.css` centraliza el estilo de las tablas.
Desde la unificación de julio 2025 se incorporó la clase `.tabla-mercedes`, que
debe añadirse a todas las tablas de los paneles para mantener el mismo fondo
negro semitransparente y líneas blancas internas, sin borde exterior.
Las reglas `.table`, `.dataTable` y `.table-responsive.bg-light` siguen
vigentes, pero cualquier ajuste visual debe realizarse ahora a través de la
clase `.tabla-mercedes` para asegurar la coherencia en todo el sistema.
A partir de la unificación se retiraron todas las hojas de estilo de DataTables
provenientes de CDN y cada panel (administrativo, empleados y clientes) utiliza
exclusivamente `style.css` para las tablas. Esto evita variaciones de estilo y
garantiza que todas las vistas compartan el mismo fondo negro semitransparente
y las líneas blancas definidas.
