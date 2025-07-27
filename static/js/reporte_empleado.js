// Archivo: static/js/reporte_empleado.js
// Módulo exclusivo: formulario de nuevo reporte en panel de empleados

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[data-success-url]');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = new FormData(form);

    try {
      if (typeof showAlert === 'function') {
        await showAlert('enviando-reporte', 'Enviando reporte...', 2600);
      }

      const resp = await fetch(form.getAttribute('action') || window.location.pathname, {
        method: 'POST',
        body: datos
      });

      if (resp.ok) {
        if (typeof showAlert === 'function') {
          await showAlert('reporte-exito', 'Reporte enviado', 2600);
        }
        setTimeout(() => {
          window.location.href = form.dataset.successUrl || '/';
        }, 2600);
      } else {
        if (typeof showAlert === 'function') {
          await showAlert('reporte-error', 'Error al enviar reporte', 2600);
        }
      }
    } catch (_) {
      if (typeof showAlert === 'function') {
        await showAlert('reporte-error', 'Error al enviar reporte', 2600);
      }
    }
  });
});
