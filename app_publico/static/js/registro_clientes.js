/*
Archivo: registro_clientes.js
Descripción: Gestión del registro de clientes
Acceso: Público
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-20
*/
const form = document.getElementById('registroForm');
const password = document.getElementById('password');
const password2 = document.getElementById('password2');
const submitBtn = form.querySelector('button[type="submit"]');

// ==== Eventos de UI ==== 
// ==== Envío de datos ====
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    for (const campo of form.querySelectorAll('input')) {
        if (!campo.value.trim()) {
            if (typeof showAlert === 'function') {
                showAlert('error-validacion', 'Complete todos los campos', false);
            }
            return;
        }
    }

    if (password.value !== password2.value) {
        if (typeof showAlert === 'function') {
            showAlert('error-validacion', 'Verifique contraseñas', false);
        }
        return;
    }

    const datos = new FormData(form);
    if (typeof showAlert === 'function') {
        showAlert('cargando-datos', 'Enviando datos...', false);
    }
    try {
        const resp = await fetch('/registrar_cliente', {
            method: 'POST',
            body: datos
        });
        const resultado = await resp.json();
        if (resp.ok) {
            form.reset();
            submitBtn.disabled = true;
            if (typeof showAlert === 'function') {
                showAlert('exito-datos', 'Formulario enviado correctamente', false);
            }
            setTimeout(() => location.href = '/login', 1500);
        } else {
            if (typeof showAlert === 'function') {
                showAlert('error-datos', resultado.detail || 'Error al enviar el formulario', false);
            }
        }
    } catch (_) {
        if (typeof showAlert === 'function') {
            showAlert('error-datos', 'Error al enviar el formulario', false);
        }
    }
});

