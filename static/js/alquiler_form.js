// Script para mostrar y ocultar el formulario de alquiler
const toggleBtn = document.getElementById('toggleFormulario');
const form = document.getElementById('formulario-alquiler');
const contBotones = document.getElementById('botones-formulario');

if (toggleBtn && form && contBotones) {
  toggleBtn.addEventListener('click', () => {
    const visible = form.style.display === 'flex';
    form.style.display = visible ? 'none' : 'flex';
    contBotones.style.display = visible ? 'none' : 'flex';
  });
}
