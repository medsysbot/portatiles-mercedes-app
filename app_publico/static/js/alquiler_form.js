/*
Archivo: alquiler_form.js
Descripción: Abre el formulario de alquiler en una nueva pestaña
Acceso: Público
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-15
*/
const verFormularioBtn = document.getElementById('toggleFormulario');
// ==== Referencias de elementos ====

if (verFormularioBtn) {
  // ==== Eventos de UI ====
  verFormularioBtn.addEventListener('click', () => {
    if (typeof showAlert === 'function') {
      showAlert('enviando-mensaje', 'Abriendo formulario...', false, 1600);
    }
    setTimeout(() => {
      window.open('/alquiler_form', '_blank');
      if (typeof showAlert === 'function') {
        showAlert('exito-datos', 'Formulario abierto', false, 2600);
      }
    }, 1600);
  });
}
