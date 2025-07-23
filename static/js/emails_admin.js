// Archivo: static/js/emails_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  window.pmEmailsAdminData = window.pmEmailsAdminData || [];
  const tbody = document.querySelector('#tablaEmails tbody');
  const form = document.getElementById('formEnviarEmail');
  const btnNuevo = document.getElementById('btnMostrarForm');
  const btnAbrir = document.getElementById('btnAbrirMensaje');
  const contTabla = document.getElementById('contenedorTabla');
  const btnCancelar = document.getElementById('btnCancelarForm');
  const buscador = document.getElementById('busquedaEmail');
  const btnBuscar = document.getElementById('btnBuscarEmail');

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
    if (!tbody) return;
    tbody.innerHTML = '';
    lista.forEach((e, idx) => {
      const tr = document.createElement('tr');

      const tdCheck = document.createElement('td');
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'pm-check';
      check.dataset.idx = idx;
      tdCheck.appendChild(check);
      tr.appendChild(tdCheck);

      const preview = (e.cuerpo || '').slice(0, 100);
      const texto = e.cuerpo && e.cuerpo.length > 100 ? preview + '...' : preview;

      const cols = [e.fecha, e.remitente, e.asunto, texto];
      cols.forEach(val => {
        const td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
    actualizarBtnAbrir();
  }

  function actualizarBtnAbrir() {
    if (!btnAbrir) return;
    const marcados = document.querySelectorAll('#tablaEmails tbody .pm-check:checked').length;
    btnAbrir.disabled = marcados !== 1;
  }

  function abrirMensaje() {
    const seleccionado = document.querySelector('#tablaEmails tbody .pm-check:checked');
    if (!seleccionado) return;
    const idx = seleccionado.dataset.idx;
    const msg = window.pmEmailsAdminData[idx]?.cuerpo || '';
    const cont = document.getElementById('cuerpoMensajeCompleto');
    if (cont) cont.textContent = msg;
    $('#modalMensajeCompleto').modal('show');
  }

  async function obtenerDatos() {
    try {
      const resp = await fetch('/admin/api/emails', {
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') }
      });
      if (!resp.ok) throw new Error('Error al consultar emails');
      window.pmEmailsAdminData = await resp.json();
      mostrarDatos(window.pmEmailsAdminData);
      actualizarBtnAbrir();
    } catch (err) {
      console.error('Error cargando emails:', err);
      if (!window.pmEmailsAdminData.length && tbody) tbody.innerHTML = '';
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

  document.addEventListener('change', ev => {
    if (ev.target.matches('#tablaEmails tbody .pm-check')) actualizarBtnAbrir();
  });

  btnAbrir?.addEventListener('click', abrirMensaje);

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const datos = new FormData(form);
    try {
      const resp = await fetch('/admin/emails/enviar', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') },
        body: datos
      });
      const res = await resp.json();
      if (!resp.ok || !res.ok) throw new Error(res.detail || 'Error al enviar');
      form.reset();
      obtenerDatos();
      btnCancelar.click();
    } catch (err) {
      console.error('Error enviando email:', err);
    }
  });

  if (window.pmEmailsAdminData.length === 0) {
    obtenerDatos();
  } else {
    mostrarDatos(window.pmEmailsAdminData);
    actualizarBtnAbrir();
  }
});
