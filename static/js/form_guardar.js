// Archivo: static/js/form_guardar.js
// Proyecto: Portátiles Mercedes
// Manejo estandarizado de formularios con botón Guardar

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[data-success-url]').forEach(form => {
    form.addEventListener('submit', async ev => {
      if (!form.checkValidity()) {
        return; // el navegador mostrará los mensajes de validación
      }
      ev.preventDefault();
      if (typeof showAlert === 'function') {
        showAlert('guardando-datos', 'Guardando datos...', false);
      }
      try {
        const url = form.getAttribute('action') || window.location.pathname;
        const resp = await fetch(url, { method: 'POST', body: new FormData(form) });
        if (resp.ok) {
          if (typeof showAlertAndRedirect === 'function') {
            showAlertAndRedirect('exito-registro', form.dataset.successUrl);
          } else {
            window.location.href = form.dataset.successUrl;
          }
        } else {
          if (typeof showAlert === 'function') {
            showAlert('error-datos', 'Error al guardar datos');
          }
        }
      } catch (err) {
        console.error('Error enviando formulario', err);
        if (typeof showAlert === 'function') {
          showAlert('error-datos', 'Error al guardar datos');
        }
      }
    });
  });
});
