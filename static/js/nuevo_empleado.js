// Archivo: static/js/empleado_nuevo.js
// JS para formulario "Nuevo Empleado" con alertas visuales y redirección controlada

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[data-success-url]');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validación manual
    const nombre   = form.nombre.value.trim();
    const email    = form.email.value.trim();
    const password = form.password.value.trim();
    const rol      = form.rol.value;
    const activo   = form.activo.value;

    if (!nombre || !email || !password) {
      await showAlert('error-registro', 'Faltan datos obligatorios');
      return;
    }
    if (password.length < 6) {
      await showAlert('error-registro', 'Contraseña demasiado corta');
      return;
    }

    // Mostrar alerta "registrando"
    await showAlert('registrando-usuario', 'Registrando empleado...');

    try {
      // Envío de datos
      const formData = new FormData(form);
      const resp = await fetch(form.action || window.location.pathname, {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) throw new Error('Error al registrar');

      // Verificar respuesta si fuera necesario (puedes adaptar aquí)
      await showAlert('exito-registro', 'Registrado con éxito');
      // Redirigir a la tabla (controlado por data-success-url)
      const url = form.getAttribute('data-success-url');
      setTimeout(() => { window.location.href = url; }, 700);
    } catch (err) {
      await showAlert('error-registro', 'Error al registrar');
    }
  });

  // Alternar visibilidad de contraseña
  const toggle = document.getElementById('togglePass');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const pwd = document.getElementById('password');
      pwd.type = pwd.type === 'password' ? 'text' : 'password';
    });
  }
});
