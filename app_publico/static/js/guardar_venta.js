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
  if (typeof showAlert === 'function') {
    showAlert('guardando-datos', 'Procesando venta...', false, 1600);
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
        showAlert('exito-datos', 'Venta registrada', false, 2600);
      }
    } else {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al registrar venta', false, 2600);
      }
    }
  } catch (_) {
    if (typeof showAlert === 'function') {
      showAlert('error-datos', 'Error de conexión', false, 2600);
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
