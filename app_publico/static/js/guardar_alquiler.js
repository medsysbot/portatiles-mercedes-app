/*
Archivo: guardar_alquiler.js
Descripción: Envía los datos del formulario de alquiler
Acceso: Público
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-15
*/
// Obtenemos el formulario principal del módulo de alquiler
const form = document.getElementById('formulario-alquiler');

// ==== Eventos de UI ==== 
// ==== Envío de datos ====
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(form));

  if (typeof showAlert === 'function') {
    showAlert('guardando-datos', 'Registrando alquiler...', false, 1600);
  }

  let ok = false;
  try {
    const resp = await fetch('/admin/alquileres/nuevo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const resJson = await resp.json();
    ok = resp.ok && resJson.ok;
    if (ok) {
      if (typeof showAlert === 'function') {
        showAlert('exito-datos', 'Alquiler registrado', false, 2600);
      }
    } else {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', resJson.detail || 'Error al registrar', false, 2600);
      }
    }
  } catch (_) {
    if (typeof showAlert === 'function') {
      showAlert('error-datos', 'Error de conexión', false, 2600);
    }
  }

  setTimeout(() => {
    if (window.opener) {
      window.opener.location.href = '/alquiler';
      window.opener.focus();
    }
    window.close();
  }, 2600);
});
