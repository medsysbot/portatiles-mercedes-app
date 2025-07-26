// Archivo: static/js/clientes_email.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formEmailCliente');

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const datos = new FormData(form);

    if (typeof showAlert === 'function') {
      await showAlert('email-envio', 'Enviando email', 2200);
    }

    try {
      const resp = await fetch('/admin/emails/enviar', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '')
        },
        body: datos
      });

      const res = await resp.json();

      if (!resp.ok || !res.ok) {
        throw new Error(res.detail || 'Error al enviar');
      }

      if (typeof showAlert === 'function') {
        await showAlert('email-exito', 'E-mail enviado', 2200);
      }

      form.reset();
    } catch (err) {
      console.error('Error al enviar email', err);
      if (typeof showAlert === 'function') {
        await showAlert('email-incorrecto', 'E-mail no enviado', 2500);
      }
    }
  });
});
