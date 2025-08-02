// Archivo: login.js
// Descripción: Manejo unificado de login y registro de clientes
// Acceso: Público
// Proyecto: Portátiles Mercedes

const loginForm = document.getElementById('loginForm');
const registroForm = document.getElementById('registroForm');
const divLogin = document.getElementById('div_login');
const divRegistro = document.getElementById('div_registro');
const btnAcceder = document.getElementById('btnAcceder');
const btnIngresar = document.getElementById('btnIngresar');
const btnRegistrarse = document.getElementById('btnRegistrarse');
const campoRol = document.getElementById('campo-rol');

function mostrarLoginInicial() {
    campoRol.style.display = 'none';
    btnIngresar.style.display = 'none';
    btnAcceder.style.display = 'block';
    divRegistro.style.display = 'none';
    divLogin.style.display = 'flex';
}

function mostrarLoginConRol() {
    campoRol.style.display = 'flex';
    btnAcceder.style.display = 'none';
    btnIngresar.style.display = 'block';
    divRegistro.style.display = 'none';
    divLogin.style.display = 'flex';
}

function mostrarRegistro() {
    divRegistro.style.display = 'flex';
    divLogin.style.display = 'none';
    campoRol.style.display = 'none';
    btnAcceder.style.display = 'none';
    btnIngresar.style.display = 'none';
}

btnAcceder.addEventListener('click', mostrarLoginConRol);
btnRegistrarse.addEventListener('click', mostrarRegistro);

if (location.search.includes('registrarse') || location.hash === '#registro') {
    mostrarRegistro();
} else {
    mostrarLoginInicial();
}

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const rol = document.getElementById('rol').value.trim();

    if (!email || !password) {
        if (typeof showAlert === 'function') {
            showAlert('error-secion', 'Complete todos los campos', false, 2600);
        }
        return;
    }
    if (!rol) {
        if (typeof showAlert === 'function') {
            showAlert('seleccionar-rol', 'Seleccione un rol válido', false, 2600);
        }
        return;
    }

    const start = Date.now();
    if (typeof showAlert === 'function') {
        showAlert('inicio-sesion', 'Iniciando sesión...', false, 'infinito');
    }

    try {
        const res = await fetch('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, rol }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        const delay = Math.max(0, 1600 - (Date.now() - start));
        if (res.ok && data.access_token) {
            setTimeout(() => {
                if (typeof showAlert === 'function') {
                    showAlert('exito-sesion', 'Inicio de sesión exitoso', false, 2600);
                }
                localStorage.setItem('access_token', data.access_token);
                const finalizar = (url) => setTimeout(() => { window.location.href = url; }, 2600);
                if (data.usuario && data.usuario.dni_cuit_cuil) {
                    localStorage.setItem('usuario_obj', JSON.stringify({
                        dni_cuit_cuil: data.usuario.dni_cuit_cuil,
                        email: data.usuario.email,
                        nombre: data.usuario.nombre
                    }));
                    localStorage.setItem('dni_cuit_cuil', data.usuario.dni_cuit_cuil);
                    finalizar('/splash_cliente');
                    return;
                }
                if (data.rol && (data.rol === 'empleado' || data.rol === 'Empleado' || data.rol === 'Administrador')) {
                    localStorage.setItem('usuario_obj', JSON.stringify({
                        email: data.email || email,
                        nombre: data.nombre || '',
                        rol: data.rol,
                        id: data.id || ''
                    }));
                    finalizar(data.rol === 'Administrador' ? '/splash' : '/splash_empleado');
                    return;
                }
                fetch(`/clientes/datos_personales_api?email=${encodeURIComponent(email)}`, {
                    headers: { 'Authorization': 'Bearer ' + data.access_token }
                })
                .then(r2 => r2.json())
                .then(datos => {
                    if (datos.dni_cuit_cuil) {
                        localStorage.setItem('usuario_obj', JSON.stringify({
                            dni_cuit_cuil: datos.dni_cuit_cuil,
                            email: datos.email,
                            nombre: datos.nombre
                        }));
                        localStorage.setItem('dni_cuit_cuil', datos.dni_cuit_cuil);
                    } else {
                        localStorage.setItem('usuario_obj', JSON.stringify({ email: email, nombre: datos.nombre || '' }));
                    }
                    finalizar('/splash_cliente');
                })
                .catch(() => {
                    localStorage.setItem('usuario_obj', JSON.stringify({ email: email, nombre: data.nombre || '' }));
                    finalizar('/splash_cliente');
                });
            }, delay);
        } else {
            setTimeout(() => {
                if (typeof showAlert === 'function') {
                    const msg = (data.detail || '').toLowerCase();
                    if (msg.includes('credenciales')) {
                        showAlert('password-error', 'Usuario o contraseña incorrectos', false, 2600);
                    } else {
                        showAlert('error-sesion', 'Error en la sesión', false, 2600);
                    }
                }
            }, delay);
        }
    } catch (_) {
        const delay = Math.max(0, 1600 - (Date.now() - start));
        setTimeout(() => {
            if (typeof showAlert === 'function') {
                showAlert('error-conexion', 'Error de conexión', false, 2600);
            }
        }, delay);
    }
});

function showAlert(tipo, texto = '', esperar = false, tiempo = 2800) {
    const contenedor = document.getElementById('alert-manager');
    const icono = document.getElementById('alert-icon');
    const mensaje = document.getElementById('alert-text');

    const ALERT_ICONS = {
        "formulario-error":      { icon: "/static/iconos/formulario-error.png",      msg: "Error al cargar el formulario" },
        "error-conexion":        { icon: "/static/iconos/error-conexion.png",        msg: "Error en la conexion" },
        "formulario-abierto":    { icon: "/static/iconos/formulario-abierto.png",    msg: "Formulario abierto" },
        "abriendo-formulario":   { icon: "/static/iconos/abriendo-formulario.png",   msg: "Abriendo formulario" },
        "error-sesion":          { icon: "/static/iconos/error-sesion.png",          msg: "Error al iniciar sesion" },
        "exito-sesion":          { icon: "/static/iconos/exito-sesion.png",          msg: "Sesion iniciada" },
        "inicio-sesion":         { icon: "/static/iconos/inicio-sesion.png",         msg: "Iniciando sesion" },
        "email-incorrecto":      { icon: "/static/iconos/email-incorrecto.png",      msg: "E-mail incorrecto" },
        "enviando-informe":      { icon: "/static/iconos/enviando-informe.png",      msg: "Enviando informe..." },
        "enviando-mensaje":      { icon: "/static/iconos/enviando-mensaje.png",      msg: "Enviando mensaje..." },
        "enviando-reporte":      { icon: "/static/iconos/enviando-reporte.png",      msg: "Enviando reporte..." },
        "error-mensaje":         { icon: "/static/iconos/error-mensaje.png",         msg: "Error al enviar mensaje" },
        "error-datos":           { icon: "/static/iconos/error-datos.png",           msg: "Error en los datos" },
        "error-validacion":      { icon: "/static/iconos/formulario-error.png",      msg: "Validación incorrecta" },
        "error-informe-limpieza":{ icon: "/static/iconos/error-informe-limpieza.png",msg: "Error al enviar informe de limpieza" },
        "error-registro":        { icon: "/static/iconos/error-registro.png",        msg: "Error en el registro" },
        "exito-datos":           { icon: "/static/iconos/exito-datos.png",           msg: "Datos guardados correctamente" },
        "exito-informe":         { icon: "/static/iconos/exito-informe.png",         msg: "Informe enviado con éxito" },
        "exito-mensaje":         { icon: "/static/iconos/exito-mensaje.png",         msg: "Mensaje enviado correctamente" },
        "exito-registro":        { icon: "/static/iconos/exito-registro.png",        msg: "Registro realizado con éxito" },
        "guardando-datos":       { icon: "/static/iconos/guardando-datos.png",       msg: "Guardando datos..." },
        "password-error":        { icon: "/static/iconos/password-error.png",        msg: "Contraseña incorrecta" },
        "registrando-usuario":   { icon: "/static/iconos/registrando-usuario.png",   msg: "Registrando usuario..." },
        "registro-ok":           { icon: "/static/iconos/registro-ok.png",           msg: "Usuario registrado correctamente" },
        "reporte-error":         { icon: "/static/iconos/reporte-error.png",         msg: "Error al enviar reporte" },
        "reporte-exito":         { icon: "/static/iconos/reporte-exito.png",         msg: "Reporte enviado con éxito" },
        "seleccionar-rol":       { icon: "/static/iconos/seleccionar-rol.png",       msg: "Seleccione un rol para continuar" },
        "borrando":              { icon: "/static/iconos/borrado.png",               msg: "Eliminando registros..." },
        "borrado-exito":         { icon: "/static/iconos/borrado-exito.png",         msg: "Registros eliminados" },
        "borrado-error":         { icon: "/static/iconos/borrado-error.png",         msg: "Error al eliminar" },
        "info-cargando":         { icon: "/static/iconos/enviando-reporte.png",      msg: "Cargando datos..." },
        "cargando-datos":        { icon: "/static/iconos/enviando-reporte.png",      msg: "Cargando datos, por favor espere..." },
        "verifique-contrasena":  { icon: "/static/iconos/verifique-contrasena.png",  msg: "Verifique su contraseña" }
    };

    const config = ALERT_ICONS[tipo] || { icon: '', msg: texto };
    icono.src = config.icon;
    mensaje.textContent = texto || config.msg || "Mensaje";

    contenedor.style.display = 'flex';

    const duracion = (tiempo === 'infinito') ? null : (typeof tiempo === 'number' ? tiempo : 2600);

    if (duracion) {
        setTimeout(() => {
            contenedor.style.display = 'none';
        }, duracion);
    }

    if (esperar && duracion) {
        return new Promise(resolve => setTimeout(resolve, duracion));
    }
}

registroForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('reg_nombre').value.trim();
    const email = document.getElementById('reg_email').value.trim();
    const pass1 = document.getElementById('reg_password').value.trim();
    const pass2 = document.getElementById('reg_password2').value.trim();

    if (!nombre || !email || !pass1 || !pass2) {
        if (typeof showAlert === 'function') {
            showAlert('error-validacion', 'Complete todos los campos', false);
        }
        return;
    }
    if (pass1 !== pass2) {
        if (typeof showAlert === 'function') {
            showAlert('error-validacion', 'Verifique contraseñas', false);
        }
        return;
    }

    if (typeof showAlert === 'function') {
        showAlert('cargando-datos', 'Enviando datos...', false);
    }
    try {
        const resp = await fetch('/registrar_cliente', {
            method: 'POST',
            body: new FormData(registroForm)
        });
        const resultado = await resp.json();
        if (resp.ok) {
            registroForm.reset();
            loginForm.reset();
            if (typeof showAlert === 'function') {
                showAlert('exito-datos', 'Cuenta creada', false);
            }
            mostrarLoginInicial();
        } else if (typeof showAlert === 'function') {
            showAlert('error-datos', resultado.detail || 'Error al enviar el formulario', false);
        }
    } catch (_) {
        if (typeof showAlert === 'function') {
            showAlert('error-datos', 'Error al enviar el formulario', false);
        }
    }
});
