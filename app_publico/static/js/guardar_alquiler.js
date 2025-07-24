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

  for (const valor of Object.values(datos)) {
    if (!valor.trim()) {
      if (typeof showAlert === 'function') {
        showAlert('error-validacion', 'Complete todos los campos', false);
      }
      return;
    }
  }

  if (typeof showAlert === 'function') {
    showAlert('cargando-datos', 'Enviando datos...', false);
  }

  let ok = false;
  try {
    const resp = await fetch('/api/public/alquiler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const resJson = await resp.json();
    ok = resp.ok && resJson.ok;
    if (ok) {
      if (typeof showAlert === 'function') {
        showAlert('exito-datos', 'Formulario enviado correctamente', false);
      }
    } else {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', resJson.detail || 'Error al enviar el formulario', false);
      }
    }
  } catch (_) {
    if (typeof showAlert === 'function') {
      showAlert('error-datos', 'Error al enviar el formulario', false);
    }
  }

  setTimeout(() => {
    if (window.opener) {
      window.opener.focus();
    }
    window.close();
  }, 2600);
});
