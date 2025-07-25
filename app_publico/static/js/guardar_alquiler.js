/*
Archivo: guardar_alquiler.js
Descripción: Envía los datos del formulario de alquiler
Acceso: Público
Proyecto: Portátiles Mercedes
Versión final con alertas visuales y control de espera
*/

const form = document.getElementById('formulario-alquiler');

// ==== Eventos de UI ==== 
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const datos = Object.fromEntries(new FormData(form));

  for (const valor of Object.values(datos)) {
    if (!valor.trim()) {
      if (typeof showAlert === 'function') {
        await showAlert('formulario-error', 'Debe completar todos los campos', false);
      }
      return;
    }
  }

  if (typeof showAlert === 'function') {
    await showAlert('cargando-datos', 'Enviando formulario...', false);
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
        await showAlert('exito-datos', 'Formulario enviado correctamente', false);
      }

      // Redirige después de mostrar alerta verde
      setTimeout(() => {
        if (window.opener) {
          window.opener.focus();
        }
        window.close();
      }, 100);
    } else {
      if (typeof showAlert === 'function') {
        await showAlert('error-datos', resJson.detail || 'Error al enviar el formulario', false);
      }
    }
  } catch (_) {
    if (typeof showAlert === 'function') {
      await showAlert('error-datos', 'Error al enviar el formulario', false);
    }
  }
});
