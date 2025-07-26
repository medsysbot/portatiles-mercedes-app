// Archivo: static/js/form_guardar.js
// Proyecto: Portátiles Mercedes
// Adaptación oficial según plantilla validada (limpieza_form_empleado.js)

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[data-success-url]');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = new FormData(form);

    if (typeof showAlert === 'function') {
      await showAlert('info-cargando', 'Enviando reporte...', 2200);
    }

    try {
      const resp = await fetch(form.getAttribute('action') || window.location.pathname, {
        method: 'POST',
        body: datos
      });

      if (resp.ok) {
        if (typeof showAlert === 'function') {
          await showAlert('reporte-exito', 'Reporte enviado', 2200);
        }
        setTimeout(() => {
          window.location.href = form.dataset.successUrl || '/';
        }, 2000);
      } else {
        if (typeof showAlert === 'function') {
          await showAlert('reporte-error', 'Error al enviar reporte', 2400);
        }
      }
    } catch (_) {
      if (typeof showAlert === 'function') {
        await showAlert('reporte-error', 'Error al enviar reporte', 2400);
      }
    }
  });
});
