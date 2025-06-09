// Archivo: static/js/guardar_alquiler.js
// Maneja el envío del formulario de alquiler
// Obtenemos el formulario principal del módulo de alquiler
const form = document.getElementById('formulario-alquiler');

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
