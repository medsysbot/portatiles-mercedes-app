/*
Archivo: guardar_venta.js
Descripción: Envía los datos del formulario de venta
Acceso: Público
Proyecto: Portátiles Mercedes
Última modificación: 2025-07-25
*/

const form = document.getElementById('formVenta');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(form));

  // Validación manual de campos vacíos
  for (const valor of Object.values(datos)) {
    if (!valor.trim()) {
      if (typeof showAlert === 'function') {
        await showAlert('formulario-error', 'Complete todos los campos', false, 2400);
      }
      return;
    }
  }

  // Alerta de envío
  if (typeof showAlert === 'function') {
    await showAlert('cargando-datos', 'Enviando datos...', false, 1600);
  }

  let ok = false;
  try {
    const resp = await fetch('/registrar_venta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    ok = resp.ok;
    if (ok) {
      if (typeof showAlert === 'function') {
        await showAlert('exito-datos', 'Formulario enviado correctamente', false, 2000);
      }
    } else {
      if (typeof showAlert === 'function') {
        await showAlert('error-datos', 'Error al enviar el formulario', false, 2600);
      }
    }
  } catch (_) {
    if (typeof showAlert === 'function') {
      await showAlert('error-datos', 'Error al enviar el formulario', false, 2600);
    }
  }

  if (ok) {
    setTimeout(() => {
      if (window.opener) {
        window.opener.location.href = '/ventas';
        window.opener.focus();
      }
      window.close();
    }, 300);
  }
});
