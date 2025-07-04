/*
Archivo: recuperar_password.js
Descripción: Solicita email para recuperación de contraseña
Acceso: Público
Proyecto: Portátiles Mercedes
*/
const form = document.getElementById('recuperarForm');
const msg = document.getElementById('msg');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const email = document.getElementById('email').value;
    try {
      const resp = await fetch('/recuperar_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await resp.json();
      msg.style.color = resp.ok ? 'green' : 'red';
      msg.textContent = data.mensaje || data.detail || 'Solicitud procesada';
      if (resp.ok) form.reset();
    } catch (_) {
      msg.style.color = 'red';
      msg.textContent = 'Error al procesar la solicitud';
    }
  });
}
