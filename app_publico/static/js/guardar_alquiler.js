/*
Archivo: guardar_alquiler.js
Descripción: Envía los datos del formulario de alquiler
Acceso: Público
Proyecto: Portátiles Mercedes
Versión final con alertas visuales y await controlado
*/

const form = document.getElementById('formulario-alquiler');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(form));

  // Validación manual
  for (const valor of Object.values(datos)) {
    if (!valor.trim()) {
      if (typeof showAlert === 'function') {
        await showAlert('error-validacion', 'Complete todos los campos', 2500);
      }
      return;
    }
  }

  if (typeof showAlert === 'function') {
    await showAlert('enviando-reporte', 'Enviando datos...', 2500);
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
        await showAlert('reporte-exito', 'Formulario enviado correctamente', 2500);
      }

      setTimeout(() => {
        if (window.opener) {
          window.opener.location.href = '/alquiler';
          window.opener.focus();
        }
        window.close();
      }, 2400);

    } else {
      if (typeof showAlert === 'function') {
        await showAlert('reporte-error', resJson.detail || 'Error al enviar el formulario', 2500);
      }
    }
  } catch (_) {
    if (typeof showAlert === 'function') {
      await showAlert('reporte-error', 'Error al enviar el formulario', 2500);
    }
  }
});
