/*
Archivo: alquiler_form.js
Descripción: Abre el formulario de alquiler en una nueva pestaña
Proyecto: Portátiles Mercedes
*/
// Abre el formulario de alquiler en una pestaña nueva
const verFormularioBtn = document.getElementById('toggleFormulario');

if (verFormularioBtn) {
// ==== Eventos de UI ==== 
  verFormularioBtn.addEventListener('click', () => {
    window.open('/alquiler_form', '_blank');
  });
}
