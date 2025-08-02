// Archivo: login.js
// Login y registro centralizado, usando alertas visuales controladas

const loginForm = document.getElementById('loginForm');
const registroForm = document.getElementById('registroForm');
const divLogin = document.getElementById('div_login');
const divRegistro = document.getElementById('div_registro');
const btnAcceder = document.getElementById('btnAcceder');
const btnIngresar = document.getElementById('btnIngresar');
const btnRegistrarse = document.getElementById('btnRegistrarse');
const campoRol = document.getElementById('campo-rol');

// --- Funciones de UI ---
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

// --- Inicializar vista según parámetro ---
if (location.search.includes('registrarse') || location.hash === '#registro') {
    mostrarRegistro();
} else {
    mostrarLoginInicial();
}

// ====================== BLOQUE DE LOGIN ==========================
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const rol = document.getElementById('rol').value.trim();

    if (!email || !password) {
        await showAlert('error-validacion', 'Complete todos los campos', false, 2600);
        return;
    }
    if (!rol) {
        await showAlert('seleccionar-rol', 'Seleccione un rol válido', false, 2600);
        return;
    }

    // --- Mostrar "inicio-sesion" SIEMPRE primero ---
    const esperaMinima = 1000;
    let resultado = null;
    let data = null;
    let errorConexion = false;
    let t0 = Date.now();

    await showAlert('inicio-sesion', 'Iniciando sesión...', false, 'infinito');

    try {
        const res = await fetch('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, rol }),
            headers: { 'Content-Type': 'application/json' }
        });
        data = await res.json();
        resultado = res;
    } catch (_) {
        errorConexion = true;
    }

    // --- Espera mínima real para que la alerta SIEMPRE se vea ---
    const elapsed = Date.now() - t0;
    if (elapsed < esperaMinima) {
        await new Promise(resolve => setTimeout(resolve, esperaMinima - elapsed));
    }

    // --- OCULTAR ALERTA ANTES DE MOSTRAR LA SIGUIENTE ---
    if (typeof ocultarAlert === 'function') ocultarAlert();

    // --- Resultado ---
    if (errorConexion) {
        await showAlert('error-conexion', 'Error de conexión', false, 2600);
        return;
    }

    if (resultado && resultado.ok && data && data.access_token) {
        await showAlert('exito-sesion', 'Inicio de sesión exitoso', false, 2600);
        localStorage.setItem('access_token', data.access_token);

        // Redirección según perfil
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
        return;
    }

    if (data && data.detail && data.detail.toLowerCase().includes('credencial')) {
        await showAlert('password-error', 'Usuario o contraseña incorrectos', false, 2600);
        return;
    }

    await showAlert('error-sesion', 'Error en la sesión', false, 2600);
});

// ====================== BLOQUE DE REGISTRO ======================
registroForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('reg_nombre').value.trim();
    const email = document.getElementById('reg_email').value.trim();
    const pass1 = document.getElementById('reg_password').value.trim();
    const pass2 = document.getElementById('reg_password2').value.trim();

    if (!nombre || !email || !pass1 || !pass2) {
        await showAlert('error-validacion', 'Complete todos los campos', false, 2600);
        return;
    }
    if (pass1 !== pass2) {
        await showAlert('verifique-contrasena', 'Verifique contraseñas', false, 2600);
        return;
    }

    await showAlert('registrando-usuario', 'Registrando usuario...', false, 'infinito');

    let t0 = Date.now();
    let resultado = null;
    let data = null;
    let errorConexion = false;
    const esperaMinima = 1000;

    try {
        const resp = await fetch('/registrar_cliente', {
            method: 'POST',
            body: new FormData(registroForm)
        });
        data = await resp.json();
        resultado = resp;
    } catch (_) {
        errorConexion = true;
    }

    const elapsed = Date.now() - t0;
    if (elapsed < esperaMinima) {
        await new Promise(resolve => setTimeout(resolve, esperaMinima - elapsed));
    }

    if (typeof ocultarAlert === 'function') ocultarAlert();

    if (errorConexion) {
        await showAlert('error-registro', 'Error de conexión', false, 2600);
        return;
    }
    if (resultado && resultado.ok) {
        registroForm.reset();
        loginForm.reset();
        await showAlert('exito-registro', 'Registro exitoso', false, 2600);
        mostrarLoginInicial();
    } else {
        await showAlert('error-registro', (data && data.detail) ? data.detail : 'Error al registrar', false, 2600);
    }
});
