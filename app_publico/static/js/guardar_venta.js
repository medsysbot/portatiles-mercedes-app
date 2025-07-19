/*
Archivo: guardar_venta.js
Descripción: Envía los datos del formulario de venta
Acceso: Público
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-15
*/
const form = document.getElementById('formVenta');

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
    const resp = await fetch('/registrar_venta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    ok = resp.ok;
    if (ok) {
      if (typeof showAlert === 'function') {
        showAlert('exito-datos', 'Formulario enviado correctamente', false);
      }
    } else {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al enviar el formulario', false);
      }
    }
  } catch (_) {
    if (typeof showAlert === 'function') {
      showAlert('error-datos', 'Error al enviar el formulario', false);
    }
  }

  setTimeout(() => {
    if (window.opener) {
      window.opener.location.href = '/ventas';
      window.opener.focus();
    }
    window.close();
  }, 2600);
});
