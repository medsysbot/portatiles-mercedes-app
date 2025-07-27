// Archivo: login.js
// Login y registro centralizado, usando alertas globales

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
        await showAlert('error-sesion', 'Complete todos los campos', false, 2600);
        return;
    }
    if (!rol) {
        await showAlert('seleccionar-rol', 'Seleccione un rol válido', false, 2600);
        return;
    }

    const start = Date.now();
    await showAlert('inicio-sesion', 'Iniciando sesión...', false, 'infinito');

    try {
        const res = await fetch('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, rol }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        const delay = Math.max(0, 1600 - (Date.now() - start));
        if (res.ok && data.access_token) {
            setTimeout(async () => {
                await showAlert('exito-sesion', 'Inicio de sesión exitoso', false, 2600);
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
            setTimeout(async () => {
                const msg = (data.detail || '').toLowerCase();
                if (msg.includes('credenciales')) {
                    await showAlert('password-error', 'Usuario o contraseña incorrectos', false, 2600);
                } else {
                    await showAlert('error-sesion', 'Error en la sesión', false, 2600);
                }
            }, delay);
        }
    } catch (_) {
        const delay = Math.max(0, 1600 - (Date.now() - start));
        setTimeout(async () => {
            await showAlert('error-conexion', 'Error de conexión', false, 2600);
        }, delay);
    }
});

registroForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('reg_nombre').value.trim();
    const email = document.getElementById('reg_email').value.trim();
    const pass1 = document.getElementById('reg_password').value.trim();
    const pass2 = document.getElementById('reg_password2').value.trim();

    if (!nombre || !email || !pass1 || !pass2) {
        await showAlert('error-validacion', 'Complete todos los campos', false);
        return;
    }
    if (pass1 !== pass2) {
        await showAlert('error-validacion', 'Verifique contraseñas', false);
        return;
    }

    await showAlert('cargando-datos', 'Enviando datos...', false);
    try {
        const resp = await fetch('/registrar_cliente', {
            method: 'POST',
            body: new FormData(registroForm)
        });
        const resultado = await resp.json();
        if (resp.ok) {
            registroForm.reset();
            loginForm.reset();
            await showAlert('exito-datos', 'Cuenta creada', false);
            mostrarLoginInicial();
        } else {
            await showAlert('error-datos', resultado.detail || 'Error al enviar el formulario', false);
        }
    } catch (_) {
        await showAlert('error-datos', 'Error al enviar el formulario', false);
    }
});
