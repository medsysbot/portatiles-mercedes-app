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

  if (typeof showAlert === 'function') {
    showAlert('enviando-informe', 'Enviando datos...', false, 1600);
  }

  try {
    const resp = await fetch('/registrar_limpieza', {
      method: 'POST',
      body: datos
    });
    const resultado = await resp.json();
    if (resp.ok) {
      form.reset();
      fechaHoraInput.value = new Date().toISOString().slice(0, 16);
      if (typeof showAlert === 'function') {
        showAlert('exito-informe', resultado.mensaje || 'Limpieza registrada', false, 2600);
      }
    } else {
      if (typeof showAlert === 'function') {
        showAlert('error-informe-limpieza', resultado.detail || 'Error al registrar', false, 2600);
      }
    }
  } catch (_) {
    if (typeof showAlert === 'function') {
      showAlert('error-datos', 'Error de conexión', false, 2600);
    }
  }
});
