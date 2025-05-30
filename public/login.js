const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';
    const datos = new FormData(form);
    try {
        const resp = await fetch('/login', {
            method: 'POST',
            body: datos
        });
        const resultado = await resp.json();
        if (resp.ok) {
            sessionStorage.setItem('token', resultado.token);
            const rol = datos.get('rol');
            if (rol === 'cliente') {
                window.location.href = '/cliente_panel.html';
            } else {
                window.location.href = '/admin_panel.html';
            }
        } else {
            errorMsg.textContent = resultado.detail || 'Error al iniciar sesión';
        }
    } catch (_) {
        errorMsg.textContent = 'Error de conexión';
    }
});
