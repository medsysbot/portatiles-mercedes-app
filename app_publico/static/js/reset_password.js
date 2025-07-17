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
    try {
      const resp = await fetch('/reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pwd1.value })
      });
      const data = await resp.json();
      if (resp.ok) {
        form.reset();
      } else {
      }
    } catch (_) {
    }
  });
}
