// Script para manejar el formulario de limpieza de baños
const form = document.getElementById('formLimpieza');
const fechaHoraInput = document.getElementById('fechaHora');

// Establecer fecha y hora actuales al cargar la página
fechaHoraInput.value = new Date().toISOString().slice(0, 16);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = new FormData(form);

  try {
    const resp = await fetch('/registrar_limpieza', {
      method: 'POST',
      body: datos
    });
    const resultado = await resp.json();
    if (resp.ok) {
      alert('Limpieza registrada con éxito');
      form.reset();
      fechaHoraInput.value = new Date().toISOString().slice(0, 16);
    } else {
      alert('Error: ' + (resultado.detail || 'No se pudo guardar'));
    }
  } catch (_) {
    alert('Error de conexión');
  }
});
