// Archivo: static/js/ventas_admin_form.js
// Controla el envío del formulario de Nueva Venta en panel administrativo

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[data-success-url]');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // === VALIDACIÓN MANUAL ===
    const fecha = form.fecha_operacion.value.trim();
    const tipoBano = form.tipo_bano.value.trim();
    const dni = form.dni_cuit_cuil.value.trim();
    const nombre = form.nombre_cliente.value.trim();
    const formaPago = form.forma_pago.value.trim();

    if (!fecha || !tipoBano || !dni || !nombre || !formaPago) {
      if (window.showAlert) await showAlert('error-validacion', 'Complete todos los campos obligatorios');
      return;
    }

    if (window.showAlert) await showAlert('cargando-datos', 'Enviando datos...');

    // Armar datos a enviar
    const datos = new FormData(form);

    try {
      const resp = await fetch(form.action || window.location.pathname, {
        method: 'POST',
        body: datos
      });

      if (resp.redirected) {
        // Si responde con redirección (como debe hacerlo tu backend)
        if (window.showAlert) await showAlert('exito-datos', 'Venta registrada');
        window.location.href = form.dataset.successUrl || '/admin/ventas';
        return;
      }

      // Si responde JSON, revisa éxito o error
      const data = await resp.json();
      if (data.ok) {
        if (window.showAlert) await showAlert('exito-datos', 'Venta registrada');
        window.location.href = form.dataset.successUrl || '/admin/ventas';
      } else {
        if (window.showAlert) await showAlert('error-datos', data.error || 'Error al registrar venta');
      }
    } catch (err) {
      if (window.showAlert) await showAlert('error-datos', 'Error de conexión');
    }
  });
});
