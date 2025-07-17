// Archivo: static/js/emails_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  window.pmEmailsAdminData = window.pmEmailsAdminData || [];
  const tabla = $('#tablaEmails').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'fecha' },
      { data: 'remitente' },
      { data: 'asunto' },
      { data: 'cuerpo', render: c => (c || '').slice(0, 100) }
    ]
  });
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

  function mostrarDatos(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  async function obtenerDatos() {
    try {
      const resp = await fetch('/admin/api/emails', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error al consultar emails');
      window.pmEmailsAdminData = await resp.json();
      mostrarDatos(window.pmEmailsAdminData);
    } catch (err) {
      console.error('Error cargando emails:', err);
    }
  }

  function filtrarEmails() {
    const q = (buscador?.value || '').toLowerCase();
    const filtrados = window.pmEmailsAdminData.filter(e =>
      (e.remitente || '').toLowerCase().includes(q) ||
      (e.asunto || '').toLowerCase().includes(q)
    );
      mostrarDatos(filtrados);
  }

  buscador?.addEventListener('input', filtrarEmails);
  btnBuscar?.addEventListener('click', filtrarEmails);

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
      obtenerDatos();
      btnCancelar.click();
    } catch (err) {
    }
  });

  if (window.pmEmailsAdminData.length === 0) {
    obtenerDatos();
  } else {
    mostrarDatos(window.pmEmailsAdminData);
  }
});
