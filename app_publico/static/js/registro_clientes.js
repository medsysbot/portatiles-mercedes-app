/*
Archivo: registro_clientes.js
Descripción: Gestión del registro de clientes
Acceso: Público
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-20
*/
const form = document.getElementById('registroForm');
const msg = document.getElementById('msg');
const password = document.getElementById('password');
const password2 = document.getElementById('password2');
const submitBtn = form.querySelector('button[type="submit"]');
submitBtn.disabled = true;

function validarPasswords() {
    if (password.value && password.value === password2.value) {
        submitBtn.disabled = false;
        msg.textContent = '';
    } else {
        submitBtn.disabled = true;
        if (password2.value) {
            msg.style.color = 'red';
            msg.textContent = 'Las contraseñas no coinciden. Por favor, verifíquelas.';
        } else {
            msg.textContent = '';
        }
    }
}

password.addEventListener('input', validarPasswords);
password2.addEventListener('input', validarPasswords);

// ==== Eventos de UI ==== 
// ==== Envío de datos ====
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    if (password.value !== password2.value) {
        return;
    }
    const datos = new FormData(form);
    try {
        const resp = await fetch('/registrar_cliente', {
            method: 'POST',
            body: datos
        });
        const resultado = await resp.json();
        if (resp.ok) {
            form.reset();
            submitBtn.disabled = true;
        } else {
        }
    } catch (_) {
    }
});

