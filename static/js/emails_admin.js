// Archivo: static/js/emails_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = document.querySelector('#tablaEmails tbody');
  const form = document.getElementById('formEnviarEmail');
  const btnNuevo = document.getElementById('btnMostrarForm');
  const contTabla = document.getElementById('contenedorTabla');
  const btnCancelar = document.getElementById('btnCancelarForm');
  const buscador = document.getElementById('busquedaEmail');
  const btnBuscar = document.getElementById('btnBuscarEmail');
  let emailsCargados = [];

  form.classList.add('d-none');

  btnNuevo.addEventListener('click', () => {
    form.classList.remove('d-none');
    contTabla.classList.add('d-none');
    btnNuevo.classList.add('d-none');
  });

  btnCancelar.addEventListener('click', () => {
    form.classList.add('d-none');
    contTabla.classList.remove('d-none');
    btnNuevo.classList.remove('d-none');
  });

  function mostrarEmails(lista) {
    tabla.innerHTML = '';
    lista.forEach(e => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${e.fecha}</td>
        <td>${e.remitente}</td>
        <td>${e.asunto}</td>
        <td>${(e.cuerpo || '').slice(0, 100)}</td>
      `;
      tabla.appendChild(fila);
    });
  }

  async function cargarEmails() {
    try {
      const resp = await fetch('/admin/api/emails', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error al consultar emails');
      emailsCargados = await resp.json();
      mostrarEmails(emailsCargados);
    } catch (err) {
      console.error('Error cargando emails:', err);
    }
  }

  function filtrarEmails() {
    const q = (buscador?.value || '').toLowerCase();
    const filtrados = emailsCargados.filter(e =>
      (e.remitente || '').toLowerCase().includes(q) ||
      (e.asunto || '').toLowerCase().includes(q)
    );
    mostrarEmails(filtrados);
  }

  buscador?.addEventListener('input', filtrarEmails);
  btnBuscar?.addEventListener('click', filtrarEmails);

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
      form.reset();
      cargarEmails();
      btnCancelar.click();
    } catch (err) {
    }
  });

  cargarEmails();
});
