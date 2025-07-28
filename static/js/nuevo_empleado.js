// Archivo: static/js/empleado_nuevo.js
// JS para formulario "Nuevo Empleado" con alertas visuales y redirección controlada

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[data-success-url]');
  if (!form) return;

  let redirTimeout = null;

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

      // Éxito: alerta y espera 4 segundos antes de redirigir
      await showAlert('exito-registro', 'Registrado con éxito');
      const url = form.getAttribute('data-success-url');
      redirTimeout = setTimeout(() => {
        window.location.href = url;
      }, 4000); // 4 segundos de espera
    } catch (err) {
      await showAlert('error-registro', 'Error al registrar');
    }
  });

  // Si el usuario presiona "Volver", cancelar la redirección automática
  const volverBtn = document.querySelector('.btn.btn-secondary[href]');
  if (volverBtn) {
    volverBtn.addEventListener('click', () => {
      if (redirTimeout) {
        clearTimeout(redirTimeout);
        redirTimeout = null;
      }
      // Dejar que el enlace funcione normalmente
    });
  }

  // Alternar visibilidad de contraseña
  const toggle = document.getElementById('togglePass');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const pwd = document.getElementById('password');
      pwd.type = pwd.type === 'password' ? 'text' : 'password';
    });
  }
});
