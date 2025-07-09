document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('busquedaAlquileres');
  const btnBuscar = document.getElementById('btnBuscarAlquiler');
  const mensajeError = document.getElementById('errorAlquileres');

  let alquileresCargados = [];

  const tabla = $('#tablaAlquileres').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'numero_bano', render: data => `<input type="checkbox" class="fila-check" data-id="${data}">`, orderable: false },
      { data: 'numero_bano' },
      { data: 'cliente_nombre' },
      { data: 'dni_cuit_cuil' },
      { data: 'direccion' },
      { data: 'fecha_inicio' },
      { data: 'fecha_fin' },
      { data: 'observaciones' }
    ]
  });

  const btnEliminar = document.getElementById('btnEliminarSeleccionados');

  function actualizarBoton() {
    const marcados = document.querySelectorAll('#tablaAlquileres tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = marcados.length === 0;
  }

  $('#tablaAlquileres tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar?.addEventListener('click', async () => {
    const seleccionados = Array.from(document.querySelectorAll('#tablaAlquileres tbody .fila-check:checked')).map(cb => cb.dataset.id);
    if (!seleccionados.length) return;
    try {
      const resp = await fetch('/admin/api/alquileres/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids: seleccionados })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await cargarAlquileres();
    } catch (err) {
      console.error('Error eliminando alquileres:', err);
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function cargarAlquileres() {
    try {
      const resp = await fetch('/admin/api/alquileres', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error consultando alquileres');
      alquileresCargados = await resp.json();
      mostrarAlquileres(alquileresCargados);
      mensajeError?.classList.add('d-none');
      if (alquileresCargados.length === 0) {
      } else {
      }
    } catch (err) {
      console.error('Error al cargar alquileres:', err);
      if (mensajeError) {
        mensajeError.textContent = 'No se pudieron cargar los alquileres.';
        mensajeError.classList.remove('d-none');
      }
    }
  }

  function mostrarAlquileres(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  }

  function filtrarAlquileres(texto) {
    const q = texto.toLowerCase();
    const filtrados = alquileresCargados.filter(a =>
      (a.cliente_nombre || '').toLowerCase().includes(q) ||
      (a.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (a.numero_bano || '').toLowerCase().includes(q)
    );
    mostrarAlquileres(filtrados);
    if (filtrados.length === 0) {
    } else {
    }
  }

  buscador?.addEventListener('input', () => {
    filtrarAlquileres(buscador.value.trim());
  });
  btnBuscar?.addEventListener('click', () => {
    filtrarAlquileres(buscador.value.trim());
  });

  cargarAlquileres();
});
