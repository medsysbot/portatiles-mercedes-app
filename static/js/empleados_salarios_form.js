// Archivo: static/js/empleados_salarios_form.js
// Control de formulario "Nuevo salario" en el panel admin Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[data-success-url]');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // === VALIDACIÓN MANUAL (campos obligatorios) ===
    const nombre = form.nombre_empleado.value.trim();
    const dni = form.dni_cuit_cuil.value.trim();
    const salario = form.salario.value.trim();

    if (!nombre || !dni || !salario) {
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
        window.location.href = form.dataset.successUrl || '/admin/empleados_salarios';
        return;
      }

      const data = await resp.json();
      if (data.ok) {
        if (window.showAlert) await showAlert('exito-datos', 'Datos cargados con éxito');
        window.location.href = form.dataset.successUrl || '/admin/empleados_salarios';
      } else {
        if (window.showAlert) await showAlert('error-datos', data.error || 'Error al cargar los datos.');
      }
    } catch (err) {
      if (window.showAlert) await showAlert('error-datos', 'Error de conexión');
    }
  });
});
