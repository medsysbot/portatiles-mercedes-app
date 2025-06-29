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
Se aplican las clases `.table`, `.dataTable` y `.table-responsive.bg-light` en los
paneles de clientes y empleados para asegurar la misma visual.
