/*
Archivo: registro_clientes.js
Descripción: Gestión del registro de clientes
Acceso: Público
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-15
*/
const form = document.getElementById('registroForm');
const msg = document.getElementById('msg');
// El formulario solo solicita un campo de contraseña

// ==== Eventos de UI ==== 
// ==== Envío de datos ====
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
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

