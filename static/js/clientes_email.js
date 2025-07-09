// Archivo: static/js/clientes_email.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formEmailCliente');
  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const datos = new FormData(form);
    try {
      const resp = await fetch('/admin/emails/enviar', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') },
        body: datos
      });
      const res = await resp.json();
      if (!resp.ok || !res.ok) throw new Error(res.detail || 'Error al enviar');
      mostrarAlertaPersonalizada('exito-datos', 'Correo enviado correctamente');
      form.reset();
    } catch (err) {
      mostrarAlertaPersonalizada('error-datos', err.message);
    }
  });
});
