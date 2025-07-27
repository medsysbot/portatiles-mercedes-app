document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const successUrl = form.getAttribute('data-success-url') || '/';
    const action = form.getAttribute('action') || window.location.pathname;
    const method = form.getAttribute('method') || 'post';

    try {
      // ALERTA: Cargando
      await showAlert("info-cargando", "Enviando reporte...", 2600);

      const response = await fetch(action, {
        method: method.toUpperCase(),
        body: formData
      });

      if (response.ok) {
        // ALERTA: Éxito
        await showAlert("reporte-exito", "Éxito al enviar el reporte", 2600);
        window.location.href = successUrl;
      } else {
        // ALERTA: Error
        await showAlert("reporte-error", "Error al enviar el reporte", 2600);
      }
    } catch (error) {
      // ALERTA: Error (con catch)
      await showAlert("reporte-error", "Error inesperado al enviar el reporte", 2600);
    }
  });
});
