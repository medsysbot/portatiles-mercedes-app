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
      await showAlert('enviando-informe', 'Enviando informe...', 2200);
    }

    try {
      const resp = await fetch(form.getAttribute('action') || window.location.pathname, {
        method: 'POST',
        body: datos
      });

      if (resp.ok) {
        if (typeof showAlert === 'function') {
          await showAlert('informe-enviado', 'Informe enviado', 2200);
        }
        setTimeout(() => {
          window.location.href = form.dataset.successUrl || '/';
        }, 2000);
      } else {
        if (typeof showAlert === 'function') {
          await showAlert('error-informe', 'Error al enviar informe', 2400);
        }
      }
    } catch (_) {
      if (typeof showAlert === 'function') {
        await showAlert('error-informe', 'Error al enviar informe', 2400);
      }
    }
  });
});
