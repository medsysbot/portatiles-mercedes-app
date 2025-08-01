// Archivo: static/js/inventario_banos_form.js
// Controla el formulario de alta de baño en inventario (panel admin)

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[data-success-url]');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // === VALIDACIÓN MANUAL ===
    const numero = form.numero_bano.value.trim();
    const condicion = form.condicion.value.trim();
    const estado = form.estado.value.trim();

    if (!numero || !condicion || !estado) {
      if (window.showAlert) await showAlert('error-datos', 'Complete todos los campos obligatorios.');
      return;
    }

    if (window.showAlert) await showAlert('cargando-datos', 'Cargando datos...');

    const datos = new FormData(form);

    try {
      const resp = await fetch(form.action || window.location.pathname, {
        method: 'POST',
        body: datos
      });

      if (resp.redirected) {
        if (window.showAlert) await showAlert('exito-datos', 'Datos cargados con éxito');
        window.location.href = form.dataset.successUrl || '/admin/inventario_banos';
        return;
      }

      const data = await resp.json();
      if (data.ok) {
        if (window.showAlert) await showAlert('exito-datos', 'Datos cargados con éxito');
        window.location.href = form.dataset.successUrl || '/admin/inventario_banos';
      } else {
        if (window.showAlert) await showAlert('error-datos', data.error || 'Error al cargar los datos.');
      }
    } catch (err) {
      if (window.showAlert) await showAlert('error-datos', 'Error de conexión');
    }
  });
});
