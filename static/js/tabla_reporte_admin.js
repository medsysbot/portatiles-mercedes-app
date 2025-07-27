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
      await showAlert('info-cargando');

      const response = await fetch(action, {
        method: method.toUpperCase(),
        body: formData
      });

      if (response.ok) {
        await showAlert('reporte-exito');
        window.location.href = successUrl;
      } else {
        await showAlert('repote-error');
      }
    } catch (error) {
      await showAlert('repote-error');
    }
  });
});
