// Archivo: static/js/guardar_alquiler.js
// Maneja el envío del formulario de alquiler
// Obtenemos el formulario principal del módulo de alquiler
const form = document.getElementById('formulario-alquiler');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  // Obtener los valores como objeto
  const datos = Object.fromEntries(new FormData(form));

  try {
    const respuesta = await fetch('/registrar_alquiler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();
    if (respuesta.ok) {
      alert('Alquiler guardado con éxito');
      form.reset();
    } else {
      alert('Error: ' + (resultado.detail || 'No se pudo guardar'));
    }
  } catch (err) {
    alert('Error de conexión');
  }
});
