// Abre el formulario de alquiler en una pestaña nueva
const verFormularioBtn = document.getElementById('toggleFormulario');

if (verFormularioBtn) {
  verFormularioBtn.addEventListener('click', () => {
    window.open('/alquiler_form', '_blank');
  });
}
