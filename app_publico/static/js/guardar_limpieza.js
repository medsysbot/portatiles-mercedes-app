/*
Archivo: guardar_limpieza.js
Descripción: Maneja el registro de limpieza de baños
Acceso: Público
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-15
*/
const form = document.getElementById('formLimpieza');
const fechaHoraInput = document.getElementById('fechaHora');

// Establecer fecha y hora actuales al cargar la página
fechaHoraInput.value = new Date().toISOString().slice(0, 16);

// ==== Eventos de UI ==== 
// ==== Envío de datos ====
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
      form.reset();
      fechaHoraInput.value = new Date().toISOString().slice(0, 16);
    } else {
    }
  } catch (_) {
  }
});
