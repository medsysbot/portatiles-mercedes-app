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
  let ok = false;
  try {
    const resp = await fetch('/registrar_venta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    ok = resp.ok;
    if (ok) {
    } else {
    }
  } catch (_) {
  }

  setTimeout(() => {
    if (window.opener) {
      window.opener.location.href = '/ventas';
      window.opener.focus();
    }
    window.close();
  }, 2600);
});
