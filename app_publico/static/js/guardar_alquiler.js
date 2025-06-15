/*
Archivo: guardar_alquiler.js
Descripción: Envía los datos del formulario de alquiler
Proyecto: Portátiles Mercedes
*/
// Maneja el envío del formulario de alquiler
// Obtenemos el formulario principal del módulo de alquiler
const form = document.getElementById('formulario-alquiler');

// ==== Eventos de UI ==== 
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(form));

  try {
    await fetch('/registrar_alquiler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
  } catch (_) {
    // Ignorar errores, se cierra igualmente
  }

  if (window.opener) {
    window.opener.location.href = '/alquiler';
    window.opener.focus();
  }
  window.close();
});
