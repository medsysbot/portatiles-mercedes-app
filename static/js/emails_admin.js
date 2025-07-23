// Archivo: static/js/emails_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaEmailsAdmin').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'uid', orderable: false, render: uid => `<input type="checkbox" class="fila-email" value="${uid}">` },
      { data: 'fecha', render: f => {
          if (!f) return '';
          const d = new Date(f);
          return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'});
        }
      },
      { data: 'email_origen' },
      { data: 'email_destino' },
      { data: 'asunto' },
      { data: 'mensaje', render: d => d && d.length > 40 ? d.slice(0,40) + '...' : d }
    ],
    createdRow: function(row, data) {
      const cb = row.querySelector('.fila-email');
      if (cb) cb.dataset.mailbox = data.mailbox;
    }
  });

  async function cargarEmails() {
    try {
      const resp = await fetch('/admin/api/emails');
      if (!resp.ok) throw new Error('Error');
      const datos = await resp.json();
      tabla.clear();
      tabla.rows.add(datos).draw();
    } catch (err) {
      console.error('Error cargando emails', err);
    }
  }

  cargarEmails();

  const form = document.getElementById('formEmailAdmin');
  const btnAbrir = document.getElementById('btnAbrirEmail');
  const buscador = document.getElementById('busquedaEmails');
  const btnBuscar = document.getElementById('btnBuscarEmails');

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const fd = new FormData(form);
    try {
      const resp = await fetch('/admin/emails/enviar', { method: 'POST', body: fd });
      const res = await resp.json();
      if (!resp.ok || !res.ok) throw new Error(res.detail || 'Error');
      form.reset();
      cargarEmails();
    } catch (err) {
      console.error('Error enviando email', err);
    }
  });

  $('#tablaEmailsAdmin tbody').on('change', '.fila-email', function() {
    $('#tablaEmailsAdmin tbody .fila-email').not(this).prop('checked', false);
    if (btnAbrir) btnAbrir.disabled = !this.checked;
  });

  btnAbrir?.addEventListener('click', async () => {
    const seleccionado = document.querySelector('#tablaEmailsAdmin tbody .fila-email:checked');
    if (!seleccionado) return;
    const uid = seleccionado.value;
    const mailbox = seleccionado.dataset.mailbox;
    try {
      const resp = await fetch(`/admin/api/emails/${encodeURIComponent(mailbox)}/${uid}`);
      if (!resp.ok) throw new Error('Error');
      const data = await resp.json();
      document.getElementById('modalEmailInfo').textContent = `De: ${data.email_origen} - Para: ${data.email_destino} - Fecha: ${new Date(data.fecha).toLocaleString('es-AR')}`;
      document.getElementById('modalEmailCuerpo').textContent = data.cuerpo || '';
      const cont = document.getElementById('modalEmailAdjuntos');
      cont.innerHTML = '';
      (data.adjuntos || []).forEach((a, idx) => {
        const link = document.createElement('a');
        link.href = `/admin/api/emails/${encodeURIComponent(mailbox)}/${uid}/adjunto/${idx}`;
        link.textContent = a;
        link.target = '_blank';
        cont.appendChild(link);
        cont.appendChild(document.createElement('br'));
      });
      $('#modalEmail').modal('show');
    } catch (err) {
      console.error('Error obteniendo email', err);
    }
  });

  function filtrar(texto) {
    tabla.search(texto).draw();
  }

  buscador?.addEventListener('input', () => {
    filtrar(buscador.value.trim());
  });

  btnBuscar?.addEventListener('click', () => {
    filtrar(buscador.value.trim());
  });
});
