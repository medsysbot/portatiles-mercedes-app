// Archivo: static/js/emails_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = document.querySelector('#tablaEmails tbody');
  const errorDiv = document.getElementById('errorEmails');
  const mensajeDiv = document.getElementById('mensajeEmails');
  const form = document.getElementById('formEnviarEmail');
  const btnNuevo = document.getElementById('btnMostrarForm');
  const contTabla = document.getElementById('contenedorTabla');
  const btnCancelar = document.getElementById('btnCancelarForm');

  form.style.display = 'none';

  btnNuevo.addEventListener('click', () => {
    form.style.display = 'block';
    contTabla.style.display = 'none';
    btnNuevo.style.display = 'none';
  });

  btnCancelar.addEventListener('click', () => {
    form.style.display = 'none';
    contTabla.style.display = 'block';
    btnNuevo.style.display = 'inline-block';
  });

  async function cargarEmails() {
    try {
      const resp = await fetch('/admin/api/emails', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error al consultar emails');
      const datos = await resp.json();
      tabla.innerHTML = '';
      datos.forEach(e => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
          <td>${e.fecha}</td>
          <td>${e.remitente}</td>
          <td>${e.asunto}</td>
          <td>${(e.cuerpo || '').slice(0, 100)}</td>
        `;
        tabla.appendChild(fila);
      });
      errorDiv.classList.add('d-none');
    } catch (err) {
      console.error('Error cargando emails:', err);
      errorDiv.textContent = 'No se pudieron cargar los emails.';
      errorDiv.classList.remove('d-none');
    }
  }

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const datos = new FormData(form);
    try {
      const resp = await fetch('/admin/emails/enviar', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: datos
      });
      const res = await resp.json();
      if (!resp.ok || !res.ok) throw new Error(res.detail || 'Error al enviar');
      mensajeDiv.textContent = 'Correo enviado correctamente';
      mensajeDiv.className = 'alert alert-success';
      mensajeDiv.style.display = 'block';
      form.reset();
      cargarEmails();
      btnCancelar.click();
    } catch (err) {
      mensajeDiv.textContent = err.message;
      mensajeDiv.className = 'alert alert-danger';
      mensajeDiv.style.display = 'block';
    }
  });

  cargarEmails();
});
