// Archivo: static/js/emails_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaEmailsAdmin').DataTable({
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json',
      emptyTable: 'No emails en la bandeja'
    },
    paging: true,
    searching: false,
    ordering: true,
    order: [[1, 'desc']],
    columns: [
      { data: 'uid', orderable: false, render: uid => `<input type="checkbox" class="fila-email" value="${uid}">` },
      { data: 'fecha', render: f => {
          if (!f) return '';
          const d = new Date(f);
          return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'});
        }
      },
      { data: 'email_origen' },
      { data: 'asunto' },
      { data: 'mensaje', render: d => d && d.length > 40 ? d.slice(0,40) + '...' : d }
    ],
    createdRow: function(row, data) {
      const cb = row.querySelector('.fila-email');
      if (cb) cb.dataset.mailbox = data.mailbox;
    }
  });

  // === SOLO NO LEÍDOS ===
  async function cargarEmailsNoLeidos() {
    try {
      // Importante: solo trae los no leídos gracias al parámetro solo_noleidos=1
      const resp = await fetch('/admin/api/emails?solo_noleidos=1');
      if (!resp.ok) throw new Error('Error');
      const datos = await resp.json();
      datos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      tabla.clear();
      tabla.rows.add(datos).draw();
    } catch (err) {
      tabla.clear().draw();
      console.error('Error cargando emails no leídos', err);
    }
  }

  // Inicial y refresco automático
  cargarEmailsNoLeidos();
  setInterval(cargarEmailsNoLeidos, 60000);

  const form = document.getElementById('formEmailAdmin');
  const btnAbrir = document.getElementById('btnAbrirEmail');
  const btnEliminar = document.getElementById('btnEliminarEmails');
  const buscador = document.getElementById('busquedaEmails');
  const btnBuscar = document.getElementById('btnBuscarEmails');

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const fd = new FormData(form);

    if (typeof showAlert === 'function') {
      await showAlert('email-envio', 'Enviando email', 1800);
    }

    try {
      const resp = await fetch('/admin/emails/enviar', { method: 'POST', body: fd });
      const res = await resp.json();
      if (!resp.ok || !res.ok) throw new Error(res.detail || 'Error');

      form.reset();
      await showAlert('email-exito', 'E-mail enviado', 2200);
      cargarEmailsNoLeidos();
    } catch (err) {
      console.error('Error enviando email', err);
      if (typeof showAlert === 'function') {
        await showAlert('email-incorrecto', 'E-mail no enviado', 2500);
      }
    }
  });

  $('#tablaEmailsAdmin tbody').on('change', '.fila-email', function() {
    const seleccionadas = $('#tablaEmailsAdmin tbody .fila-email:checked');
    if (btnAbrir) btnAbrir.disabled = seleccionadas.length !== 1;
    if (btnEliminar) btnEliminar.disabled = seleccionadas.length === 0;
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
        link.href = `/admin/api/emails/${encodeURIComponent(mailbox)}/${encodeURIComponent(uid)}/adjunto/${idx}`;
        link.textContent = a;
        link.target = '_blank';
        cont.appendChild(link);
        cont.appendChild(document.createElement('br'));
      });
      $('#modalEmail').modal('show');
      // Opcional: actualizar la lista tras abrir un correo (puede marcarse como leído en backend)
      setTimeout(cargarEmailsNoLeidos, 1000);
    } catch (err) {
      console.error('Error obteniendo email', err);
    }
  });

  btnEliminar?.addEventListener('click', async () => {
    const seleccionados = Array.from(document.querySelectorAll('#tablaEmailsAdmin tbody .fila-email:checked'));
    if (!seleccionados.length) return;
    if (!confirm('¿Eliminar emails seleccionados?')) return;

    for (const cb of seleccionados) {
      const uid = cb.value;
      const mailbox = cb.dataset.mailbox;
      try {
        const resp = await fetch(`/admin/api/emails/${encodeURIComponent(mailbox)}/${uid}`, {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
        });
        if (resp.ok) {
          tabla.row($(cb).closest('tr')).remove().draw(false);
        }
      } catch (err) {
        console.error('Error eliminando email', err);
      }
    }

    if (btnAbrir) btnAbrir.disabled = true;
    if (btnEliminar) btnEliminar.disabled = true;
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
