# Mejora de mensajes de error en login

Este documento resume los cambios aplicados al endpoint `/login` para un manejo más claro y seguro de los errores de autenticación.

## Mensajes de error antes y después

| Caso | Antes | Después |
|------|-------|---------|
| Usuario inexistente | `Credenciales inválidas` | `Usuario o contraseña incorrectos` |
| Contraseña incorrecta | `Credenciales inválidas` | `Usuario o contraseña incorrectos` |
| Usuario inactivo | `Usuario inactivo` | `Usuario inactivo` |

En todos los casos se mantiene el código de estado HTTP utilizado previamente.

## Ejemplos de respuestas de error

### Usuario o contraseña incorrectos
```json
{"detail": "Usuario o contraseña incorrectos"}
```

### Usuario inactivo
```json
{"detail": "Usuario inactivo"}
```
