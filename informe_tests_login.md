# Informe de tests de login

Este documento resume las pruebas automatizadas presentes en `test/test_login.py` antes y después de la mejora solicitada.

## Tests antes

- `test_login_exitoso`
- `test_login_rol_incorrecto`

## Tests después

- `test_login_exitoso`
- `test_login_rol_incorrecto`
- `test_login_password_incorrecto`
- `test_login_usuario_inactivo`
- `test_login_usuario_inexistente`

## Resultados

Tras ejecutar `pytest` todos los tests finalizaron correctamente:

```
5 passed
```
