// Archivo: static/js/clientes_email.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formEmailCliente');
  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const datos = new FormData(form);
    if (typeof showAlert === 'function') {
      showAlert('enviando-mensaje', 'Enviando email...', false, 1600);
    }
    try {
      const resp = await fetch('/admin/emails/enviar', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') },
        body: datos
      });
      const res = await resp.json();
      if (!resp.ok || !res.ok) throw new Error(res.detail || 'Error al enviar');
      form.reset();
      if (typeof showAlert === 'function') {
        showAlert('exito-mensaje', res.mensaje || 'Correo enviado', false, 2600);
      }
    } catch (err) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al enviar email', false, 2600);
      }
    }
  });
});
