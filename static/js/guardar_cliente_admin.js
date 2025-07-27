// Archivo: static/js/guardar_cliente_admin.js
// Exclusivo para formulario de creación/edición de cliente (panel admin)
// No usa lógica genérica. Solo registra cliente y alerta correctamente.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[data-success-url]');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = new FormData(form);

    try {
      if (typeof showAlert === 'function') {
        await showAlert('registrando-usuario', 'Registrando...', 2600);
      }

      const resp = await fetch(form.getAttribute('action') || window.location.pathname, {
        method: 'POST',
        body: datos
      });

      if (resp.ok) {
        if (typeof showAlert === 'function') {
          await showAlert('exito-registro', 'Cliente registrado', 2600);
        }

        setTimeout(() => {
          window.location.href = form.dataset.successUrl || '/admin/clientes';
        }, 2600);
      } else {
        if (typeof showAlert === 'function') {
          await showAlert('error-registro', 'Error al registrar cliente', 2600);
        }
      }
    } catch (err) {
      if (typeof showAlert === 'function') {
        await showAlert('error-registro', 'Error al registrar cliente', 2600);
      }
    }
  });
});
