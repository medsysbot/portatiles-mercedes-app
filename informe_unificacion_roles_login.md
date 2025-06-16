# Unificación de valores de rol en login

Se revisó el flujo de autenticación para asegurar que el formulario y el script de envío manejen el rol de forma idéntica a como está registrado en la base de datos.

## Cambios aplicados

- **login.html**: se confirmaron las opciones del `<select name="rol">` con los valores exactos `Administrador`, `empleado` y `cliente`.
- **login.js**: se simplificó la captura de datos creando variables `email`, `password` y `rol`. Antes de invocar el `fetch` se agregó un `console.log` para mostrar el objeto enviado.

```javascript
console.log("Datos enviados al backend:", { email, password, rol });
```

## Ejemplo validado

Al completar el formulario con `email` `admin@portatiles.com`, contraseña `admin123` y rol `Administrador`, la consola muestra:

```text
Datos enviados al backend: { email: "admin@portatiles.com", password: "admin123", rol: "Administrador" }
```

Con estos valores se obtiene una respuesta exitosa y se almacena el token en `localStorage`.
