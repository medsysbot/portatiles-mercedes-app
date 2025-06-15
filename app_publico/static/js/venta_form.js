/*
Archivo: venta_form.js
Descripción: Abre el formulario de venta en una nueva pestaña
Proyecto: Portátiles Mercedes
*/
// Abre el formulario de venta en una pestaña nueva
const verFormularioBtn = document.getElementById('toggleFormulario');

if (verFormularioBtn) {
// ==== Eventos de UI ==== 
  verFormularioBtn.addEventListener('click', () => {
    window.open('/venta', '_blank');
  });
}
