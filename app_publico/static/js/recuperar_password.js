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
    if (typeof showAlert === 'function') {
      showAlert('enviando-mensaje', 'Enviando email...', false, 1600);
    }
    const email = document.getElementById('email').value;
    try {
      const resp = await fetch('/recuperar_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await resp.json();
      if (resp.ok) {
        form.reset();
        if (typeof showAlert === 'function') {
          showAlert('exito-mensaje', data.mensaje || 'Correo enviado', false, 2600);
        }
      } else {
        if (typeof showAlert === 'function') {
          showAlert('error-datos', data.detail || 'Error al enviar', false, 2600);
        }
      }
    } catch (_) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error de conexión', false, 2600);
      }
    }
  });
}
