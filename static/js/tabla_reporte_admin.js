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
      await showAlert("/static/iconos/enviando-reporte.png", "Enviando reporte...");

      const response = await fetch(action, {
        method: method.toUpperCase(),
        body: formData
      });

      if (response.ok) {
        // ALERTA: Éxito
        await showAlert("/static/iconos/reporte-exito.png", "Éxito al enviar el reporte");
        window.location.href = successUrl;
      } else {
        // ALERTA: Error
        await showAlert("/static/iconos/reporte-error.png", "Error al enviar el reporte");
      }
    } catch (error) {
      // ALERTA: Error (con catch)
      await showAlert("/static/iconos/reporte-error.png", "Error inesperado al enviar el reporte");
    }
  });
});
