// Archivo: static/js/clientes_comprobantes.js
// Proyecto: Portátiles Mercedes
// Versión adaptada con alertas visuales y await controlado

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formComprobante');

  if (!form) return;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const datos = new FormData(form);

    // Validación manual
    for (const [_, v] of datos.entries()) {
      if (!v) {
        if (typeof showAlert === 'function') {
          await showAlert('error-reporte', 'Complete todos los campos', 2500);
        }
        return;
      }
    }

    try {
      if (typeof showAlert === 'function') {
        await showAlert('enviando-reporte', 'Enviando comprobante...', 2200);
      }

      const resp = await fetch('/api/comprobantes_pago', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') },
        body: datos
      });

      const res = await resp.json();
      if (resp.ok && res.ok) {
        if (typeof showAlert === 'function') {
          await showAlert('exito-reporte', 'Comprobante enviado con éxito', 2200);
        }
        setTimeout(() => {
          location.href = '/clientes/comprobantes';
        }, 2000);
      } else {
        if (typeof showAlert === 'function') {
          await showAlert('error-reporte', res.detail || 'Error al subir comprobante', 2500);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      if (typeof showAlert === 'function') {
        await showAlert('error-reporte', 'Error al subir comprobante', 2500);
      }
    }
  });
});
