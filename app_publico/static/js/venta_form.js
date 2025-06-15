// Abre el formulario de venta en una pestaña nueva
const verFormularioBtn = document.getElementById('toggleFormulario');

if (verFormularioBtn) {
  verFormularioBtn.addEventListener('click', () => {
    window.open('/venta', '_blank');
  });
}
