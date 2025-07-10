// Archivo: static/js/clientes_comprobantes_form.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formComprobante');


  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const datos = new FormData(form);
    if (typeof showAlert === 'function') {
      showAlert('guardando-datos', 'Subiendo comprobante...', false, 1600);
    }
    try {
      const resp = await fetch('/api/comprobantes_pago', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') },
        body: datos
      });
      const res = await resp.json();
      if (resp.ok && res.ok) {
        form.reset();
        if (typeof showAlert === 'function') {
          showAlert('exito-datos', 'Comprobante subido', false, 2600);
        }
      } else {
        throw new Error(res.detail || 'Error al subir');
      }
    } catch (err) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al subir comprobante', false, 2600);
      }
    }
  });
});
