/*
Archivo: reset_password.js
Descripción: Envía nueva contraseña al backend
Acceso: Público mediante token
Proyecto: Portátiles Mercedes
*/
const form = document.getElementById('resetForm');
const msg = document.getElementById('msg');
const pwd1 = document.getElementById('password');
const pwd2 = document.getElementById('password2');
function validar() {
  if (pwd1.value && pwd1.value === pwd2.value) {
    msg.textContent = '';
    return true;
  }
  msg.style.color = 'red';
  msg.textContent = 'Las contraseñas no coinciden';
  return false;
}
if (form) {
  pwd1.addEventListener('input', validar);
  pwd2.addEventListener('input', validar);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validar()) return;
    const token = document.getElementById('token').value;
    if (typeof showAlert === 'function') {
      showAlert('guardando-datos', 'Actualizando contraseña...', false, 1600);
    }
    try {
      const resp = await fetch('/reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pwd1.value })
      });
      const data = await resp.json();
      if (resp.ok) {
        form.reset();
        if (typeof showAlert === 'function') {
          showAlert('exito-datos', data.mensaje || 'Contraseña actualizada', false, 2600);
        }
      } else {
        if (typeof showAlert === 'function') {
          showAlert('error-datos', data.detail || 'Error al actualizar', false, 2600);
        }
      }
    } catch (_) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error de conexión', false, 2600);
      }
    }
  });
}
