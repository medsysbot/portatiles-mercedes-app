# Informe de Logs de Autenticación

Este documento describe el formato y la ubicación de los registros generados por los eventos de login y registro de usuarios en Portátiles Mercedes.

## Ubicación de los logs

Todos los registros se guardan en `logs/login_events.log`. El directorio `logs/` ya está creado en el repositorio y cuenta con un archivo `.gitkeep` para mantenerse bajo control de versiones sin incluir los archivos `.log`, que están ignorados en `.gitignore`.

## Formato de los registros

Cada línea del archivo sigue la estructura:

```
YYYY-MM-DD HH:MM:SS,mmm [NIVEL] Mensaje
```

- `YYYY-MM-DD HH:MM:SS,mmm` corresponde a la fecha y hora del evento.
- `NIVEL` indica el nivel del log (`INFO`, `WARNING` o `ERROR`).
- `Mensaje` describe la acción realizada, sin incluir contraseñas ni datos sensibles.

## Ejemplos de eventos registrados

### Login exitoso
```
2024-05-20 10:15:32,123 [INFO] Login exitoso: usuario@ejemplo.com
```

### Login fallido
```
2024-05-20 10:18:05,456 [WARNING] Login fallido – contraseña incorrecta: usuario@ejemplo.com
```

### Registro de usuario
```
2024-05-20 10:20:00,789 [INFO] Registro exitoso para nuevo cliente: cliente@ejemplo.com
```

Estos registros ayudan a auditar la actividad sin exponer información sensible de los usuarios.
