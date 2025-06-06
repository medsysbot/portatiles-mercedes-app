const form = document.getElementById('registroForm');
const msg = document.getElementById('msg');

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

