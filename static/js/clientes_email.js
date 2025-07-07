// Archivo: static/js/clientes_email.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formEmailCliente');
  const feedback = document.getElementById('feedbackEmail');

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    feedback.textContent = '';
    feedback.className = '';
    const datos = new FormData(form);
    try {
      const resp = await fetch('/admin/emails/enviar', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') },
        body: datos
      });
      const res = await resp.json();
      if (!resp.ok || !res.ok) throw new Error(res.detail || 'Error al enviar');
      feedback.textContent = 'Correo enviado correctamente';
      feedback.className = 'alert alert-success';
      form.reset();
    } catch (err) {
      feedback.textContent = err.message;
      feedback.className = 'alert alert-danger';
    }
  });
});
