// Archivo: static/js/clientes_comprobantes_form.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formComprobante');
  const msg = document.getElementById('msgComprobante');

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    msg.classList.add('d-none');
    const datos = new FormData(form);
    try {
      const resp = await fetch('/api/comprobantes_pago', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') },
        body: datos
      });
      const res = await resp.json();
      if (resp.ok && res.ok) {
        msg.textContent = 'Comprobante cargado correctamente';
        msg.className = 'alert alert-success';
        form.reset();
      } else {
        throw new Error(res.detail || 'Error al subir');
      }
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'alert alert-danger';
    }
    msg.classList.remove('d-none');
  });
});
