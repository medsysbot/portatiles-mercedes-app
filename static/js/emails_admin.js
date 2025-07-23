// Archivo: static/js/emails_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaEmailsAdmin').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'fecha', render: f => {
          if (!f) return '';
          const d = new Date(f);
          return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'});
        }
      },
      { data: 'email_origen' },
      { data: 'asunto' },
      { data: 'mensaje', render: d => d && d.length > 40 ? d.slice(0,40) + '...' : d },
      { data: 'id', orderable: false, render: id => `<button class="btn btn-sm btn-primary ver-email" data-id="${id}">Abrir</button>` }
    ]
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

  $('#tablaEmailsAdmin').on('click', '.ver-email', async function() {
    const id = this.dataset.id;
    try {
      const resp = await fetch(`/admin/api/emails/${id}`);
      if (!resp.ok) throw new Error('Error');
      const data = await resp.json();
      document.getElementById('modalEmailInfo').textContent = `De: ${data.email_origen} - Para: ${data.email_destino} - Fecha: ${new Date(data.fecha).toLocaleString('es-AR')}`;
      document.getElementById('modalEmailCuerpo').textContent = data.mensaje || '';
      const cont = document.getElementById('modalEmailAdjuntos');
      cont.innerHTML = '';
      (data.adjuntos || []).forEach(a => {
        const link = document.createElement('a');
        link.href = a.url;
        link.textContent = a.nombre;
        link.target = '_blank';
        cont.appendChild(link);
        cont.appendChild(document.createElement('br'));
      });
      $('#modalEmail').modal('show');
    } catch (err) {
      console.error('Error obteniendo email', err);
    }
  });
});
