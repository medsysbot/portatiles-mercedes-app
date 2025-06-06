// Mostrar permanentemente el formulario de alquiler
const form = document.getElementById('formulario-alquiler');
const contBotones = document.getElementById('botones-formulario');

if (form && contBotones) {
  form.style.display = 'flex';
  contBotones.style.display = 'flex';
}
