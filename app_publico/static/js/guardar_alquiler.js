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
    } else {
    }
  } catch (_) {
  }

  setTimeout(() => {
    if (window.opener) {
      window.opener.location.href = '/alquiler';
      window.opener.focus();
    }
    window.close();
  }, 2600);
});
