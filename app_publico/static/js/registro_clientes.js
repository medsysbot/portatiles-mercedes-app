/*
Archivo: registro_clientes.js
Descripción: Gestión del registro de clientes
Acceso: Público
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-15
*/
const form = document.getElementById('registroForm');
const msg = document.getElementById('msg');
const password = document.getElementById('password');
const password2 = document.getElementById('password2');

// ==== Eventos de UI ==== 
// ==== Envío de datos ====
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    if (password.value !== password2.value) {
        msg.style.color = 'red';
        msg.textContent = 'Las contraseñas no coinciden';
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
            msg.style.color = 'green';
            msg.textContent = 'Cuenta creada con éxito. Ya podés iniciar sesión.';
            form.reset();
        } else {
            msg.style.color = 'red';
            msg.textContent = resultado.detail || 'Error al registrar';
        }
    } catch (_) {
        msg.style.color = 'red';
        msg.textContent = 'Error de conexión';
    }
});

