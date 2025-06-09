// Controla la visibilidad del formulario de alquiler
const form = document.getElementById('formulario-alquiler');
const verFormularioBtn = document.getElementById('toggleFormulario');
const linkInicio = document.getElementById('linkInicio');
const linkGaleria = document.getElementById('linkGaleria');

if (form) {
  // Mantener oculto al cargar
  form.style.display = 'none';
}

if (verFormularioBtn) {
  verFormularioBtn.addEventListener('click', () => {
    if (form) {
      form.style.display = 'flex';
    }
  });
}

function ocultarYRedirigir(destino) {
  if (form) {
    form.style.display = 'none';
  }
  window.location.href = destino;
}

if (linkInicio) {
  linkInicio.addEventListener('click', (e) => {
    e.preventDefault();
    ocultarYRedirigir('/');
  });
}

if (linkGaleria) {
  linkGaleria.addEventListener('click', (e) => {
    e.preventDefault();
    ocultarYRedirigir('/galeria');
  });
}
