// Archivo: static/js/empleados_datos_personales_guardar.js
// Proyecto: Portátiles Mercedes - Recursos Humanos (formulario alta)
// Manejo de alertas visuales y redirección tras alta de empleado

cument.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[data-success-url]');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Mostrar alerta "registrando-usuario"
    await showAlert("registrando-usuario", "Registrando empleado...");

    const formData = new FormData(form);

    try {
      const resp = await fetch(form.action || window.location.pathname, {
        method: "POST",
        body: formData
      });

      if (resp.ok) {
        await showAlert("exito-registro", "Éxito al registrar el empleado");
        // Redirigir tras 2.3 segundos
        setTimeout(() => {
          window.location.href = form.getAttribute('data-success-url') || "/admin/empleados_datos_personales";
        }, 2300);
      } else {
        let msg = "Error al registrar el empleado";
        try {
          const data = await resp.json();
          if (data && data.detail) msg = data.detail;
        } catch {}
        await showAlert("error-registro", msg);
      }
    } catch (err) {
      await showAlert("error-registro", "Error al registrar el empleado");
    }
  });
});
