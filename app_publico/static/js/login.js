// Archivo: login.js
// Login y registro centralizado, usando alertas globales CONTROLADAS

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

// ======= BLOQUE DE LOGIN CONTROLADO Y CON ALERTAS =======
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const rol = document.getElementById('rol').value.trim();

    // 🚩 Campos vacíos
    if (!email || !password) {
        await showAlert('error-validacion', 'Complete todos los campos', false, 2600);
        return;
    }
    // 🚩 Rol no seleccionado
    if (!rol) {
        await showAlert('seleccionar-rol', 'Seleccione un rol válido', false, 2600);
        return;
    }

    // 🚩 Mostrar alerta "Iniciando sesión..." (amarillo) al menos 900ms aunque el backend responda rápido
    const esperaMinima = 900; // milisegundos
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

    // Esperar que la alerta amarilla se vea por lo menos esperaMinima ms
    const elapsed = Date.now() - t0;
    if (elapsed < esperaMinima) {
        await new Promise(resolve => setTimeout(resolve, esperaMinima - elapsed));
    }

    // Ocultar cartel amarillo
    if (typeof ocultarAlert === 'function') ocultarAlert();

    // Ahora mostrar el resultado (verde, rojo, etc.)
    if (errorConexion) {
        await showAlert('error-conexion', 'Error de conexión', false, 2600);
        return;
    }

    // 🚩 LOGIN OK
    if (resultado && resultado.ok && data && data.access_token) {
        await showAlert('exito-sesion', 'Inicio de sesión exitoso', false, 2600);
        localStorage.setItem('access_token', data.access_token);

        // Redirección según rol o datos
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

    // 🚩 Usuario o contraseña incorrectos (mensaje del backend debe incluir "credencial")
    if (data && data.detail && data.detail.toLowerCase().includes('credencial')) {
        await showAlert('password-error', 'Usuario o contraseña incorrectos', false, 2600);
        return;
    }

    // 🚩 Otro error de sesión (problemas extra)
    await showAlert('password-error', 'Password o usuario incorrecto', false, 2600);
});

// ======= BLOQUE DE REGISTRO (SIN CAMBIOS, YA FUNCIONAL) =======
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
        await showAlert('error-validacion', 'Verifique contraseñas', false, 2600);
        return;
    }

    await showAlert('cargando-datos', 'Enviando datos...', false, 2600);
    try {
        const resp = await fetch('/registrar_cliente', {
            method: 'POST',
            body: new FormData(registroForm)
        });
        const resultado = await resp.json();
        if (resp.ok) {
            registroForm.reset();
            loginForm.reset();
            await showAlert('exito-datos', 'Cuenta creada', false, 2600);
            mostrarLoginInicial();
        } else {
            await showAlert('error-datos', resultado.detail || 'Error al enviar el formulario', false, 2600);
        }
    } catch (_) {
        await showAlert('error-datos', 'Error al enviar el formulario', false, 2600);
    }
});
