// Archivo: static/js/clientes_comprobantes_form.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formComprobante');


  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const datos = new FormData(form);
    try {
      const resp = await fetch('/api/comprobantes_pago', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') },
        body: datos
      });
      const res = await resp.json();
      if (resp.ok && res.ok) {
        form.reset();
      } else {
        throw new Error(res.detail || 'Error al subir');
      }
    } catch (err) {
    }
  });
});
