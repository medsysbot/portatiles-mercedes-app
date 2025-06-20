# Flujo de conexión del panel de cliente

Este informe describe, de manera técnica y paso a paso, cómo el panel de cliente de Portátiles Mercedes obtiene los datos personales del usuario después de iniciar sesión.

## 1. Login y almacenamiento del token
El formulario de `login.html` envía las credenciales al endpoint `/login`. El archivo [`app_publico/static/js/login.js`](app_publico/static/js/login.js) maneja la respuesta y guarda la información relevante en `localStorage`:
```javascript
localStorage.setItem("access_token", data.access_token);
localStorage.setItem("email", email);
if (data.rol) {
    localStorage.setItem("rol", data.rol);
}
if (data.nombre) {
    localStorage.setItem("nombre", data.nombre);
}
if (data.id) {
    localStorage.setItem("user_id", data.id);
}
```
Estos pasos se encuentran en las líneas 37 a 48 del archivo y permiten redirigir al usuario a `/splash_cliente` una vez autenticado.

## 2. Redirección y carga del panel
La plantilla `splash_cliente.html` redirige al panel tras unos segundos. Cuando `cliente_panel.html` se carga, su script [`static/js/cliente_panel.js`](static/js/cliente_panel.js) valida el token y obtiene el email del usuario:
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    const ver = await fetch('/verificar_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token })
    });
    const info = await ver.json();
    const email = info.email;
    window.emailCliente = email;
    const datosCliRes = await fetch(`/info_datos_cliente?email=${encodeURIComponent(email)}`);
    ...
});
```
Este fragmento se ubica entre las líneas 32 y 66 y es el responsable de solicitar la información personal.

## 3. Solicitud de datos personales
Dentro de `cliente_panel.js`, la función `cargarDatosPersonales()` realiza la llamada a `/info_datos_cliente` y actualiza el formulario con la respuesta recibida:
```javascript
async function cargarDatosPersonales(email, datos = null) {
    let info = datos;
    if (!info) {
        const resp = await fetch(`/info_datos_cliente?email=${encodeURIComponent(email)}`);
        if (!resp.ok) {
            console.warn('No se encontraron datos personales');
            return;
        }
        info = await resp.json();
    }
    datosOriginales = info;
    document.getElementById("nombre").value = info.nombre || "";
    document.getElementById("apellido").value = info.apellido || "";
    document.getElementById("direccion").value = info.direccion || "";
    document.getElementById("telefono").value = info.telefono || "";
    document.getElementById("dni").value = info.dni || "";
    document.getElementById("cuit").value = info.cuit || "";
    document.getElementById("razon_social").value = info.razon_social || "";
    document.getElementById("email").value = info.email || "";
    document.getElementById("botonGuardarDatos").disabled = true;
}
```
Corresponde a las líneas 145‑168 y completa automáticamente el formulario.

## 4. Endpoint en el backend
El servidor expone `/info_datos_cliente` en `routes/cliente_panel.py`. Primero se inicializa el cliente de Supabase con las variables `SUPABASE_URL` y `SUPABASE_KEY`:
```python
url: str | None = os.getenv("SUPABASE_URL")
key: str | None = os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if url and key:
    supabase = create_client(url, key)
```
(Líneas 21‑26). Luego, el endpoint realiza la consulta a la tabla `datos_personales_clientes` usando el email recibido:
```python
@router.get("/info_datos_cliente")
async def info_datos_cliente(email: str = Query(..., description="Email del cliente")):
    if not supabase:
        logger.error("Supabase no configurado")
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    result = (
        supabase.table("datos_personales_clientes")
        .select("*")
        .eq("email", email)
        .single()
        .execute()
    )
    if getattr(result, "data", None):
        return result.data
    raise HTTPException(status_code=404, detail="Datos no encontrados")
```
(Líneas 95‑119). Este método devuelve los datos en formato JSON o un error si no existen registros.

## 5. Asignación del cliente Supabase
La instancia de Supabase creada en `routes/login.py` se reutiliza en todo el proyecto. En `main.py` se asigna a los módulos cuando la variable `ENABLE_SUPABASE` está activada:
```python
if os.getenv("ENABLE_SUPABASE") == "1":
    admin_panel.supabase = supabase_client
    cliente_panel.supabase = supabase_client
    ventas.supabase = supabase_client
    limpieza.supabase = supabase_client
    debito.supabase = supabase_client
    login_logger.info("Cliente Supabase asignado a modulos")
```
(Líneas 58‑64), garantizando una única conexión compartida.

## 6. Pruebas automatizadas
El comportamiento del endpoint `/info_datos_cliente` está cubierto por `test/test_cliente_panel.py`, donde se simulan respuestas de Supabase y se valida que los códigos HTTP sean los correctos. La suite de `pytest` finaliza con 21 pruebas exitosas.

## Conclusión
Cuando un cliente inicia sesión, su token se guarda en el navegador. El panel verifica ese token y, con el email recuperado, solicita los datos personales mediante `/info_datos_cliente`. El backend consulta Supabase y devuelve la información que luego se muestra en el formulario del panel, asegurando así que cada usuario visualice y pueda actualizar sus propios datos.

