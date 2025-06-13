const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';
    const payload = {
        email: form.email.value.trim(),
        password: form.password.value.trim()
    };
    try {
        const resp = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const resultado = await resp.json();
        if (resp.ok) {
            localStorage.setItem('access_token', resultado.access_token);
            localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
            if (resultado.usuario.rol === 'cliente') {
                window.location.href = '/cliente_panel.html';
            } else {
                window.location.href = '/admin_splash';
            }
        } else {
            errorMsg.textContent = resultado.detail || 'Error al iniciar sesión';
        }
    } catch (_) {
        errorMsg.textContent = 'Error de conexión';
    }
});
