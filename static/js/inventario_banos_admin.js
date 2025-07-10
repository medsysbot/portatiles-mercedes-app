// Archivo: static/js/inventario_banos_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const btnNuevo = document.getElementById('btnNuevoBano');
  const buscador = document.getElementById('busquedaInventario');
  const btnBuscar = document.getElementById('btnBuscarInventario');
  const mensajeError = document.getElementById('errorInventario');

  let banosCargados = [];

  const tabla = $('#tablaInventario').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'numero_bano', render: data => `<input type="checkbox" class="fila-check" data-id="${data}">`, orderable: false },
      { data: 'numero_bano' },
      { data: 'condicion' },
      { data: 'ultima_reparacion' },
      { data: 'ultimo_mantenimiento' },
      { data: 'estado' },
      { data: 'observaciones' }
    ]
  });

  const btnEliminar = document.getElementById('btnEliminarSeleccionados');

  function actualizarBoton() {
    const checks = document.querySelectorAll('#tablaInventario tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = checks.length === 0;
  }

  $('#tablaInventario tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaInventario tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length) return;
    const inicio = Date.now();
    if (typeof showAlert === 'function') {
      showAlert('guardando-datos', 'Eliminando baños...', false, 1600);
    }
    try {
      const resp = await fetch('/admin/api/inventario_banos/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await cargarTabla();
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
        if (typeof showAlert === 'function') {
          showAlert('exito-datos', 'Baños eliminados', false, 2600);
        }
      }, delay);
    } catch (err) {
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
        if (typeof showAlert === 'function') {
          showAlert('error-datos', 'Error al eliminar baños', false, 2600);
        }
      }, delay);
      console.error('Error eliminando baños:', err);
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function cargarTabla() {
    const inicio = Date.now();
    if (typeof showAlert === 'function') {
      showAlert('enviando-reporte', 'Cargando inventario...', false, 1600);
    }
    try {
      const resp = await fetch('/admin/api/inventario_banos', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error al consultar inventario');
      banosCargados = await resp.json();
      mostrarBanos(banosCargados);
      mensajeError?.classList.add('d-none');
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
        if (typeof showAlert === 'function') {
          showAlert('exito-datos', 'Listado actualizado', false, 2600);
        }
      }, delay);
    } catch (err) {
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
        if (typeof showAlert === 'function') {
          showAlert('error-datos', 'No se pudo cargar el inventario', false, 2600);
        }
      }, delay);
      console.error('Error cargando inventario:', err);
    }
  }

  function mostrarBanos(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  }

  // Botón Agregar baño: navega al formulario de alta (NO modal)
  btnNuevo?.addEventListener('click', () => {
    window.location.href = '/admin/inventario_banos/nuevo';
  });

  buscador?.addEventListener('input', () => {
    filtrarBanos(buscador.value.trim());
  });
  btnBuscar?.addEventListener('click', () => {
    filtrarBanos(buscador.value.trim());
  });

  function filtrarBanos(texto) {
    const q = texto.toLowerCase();
    const filtrados = banosCargados.filter(b =>
      (b.numero_bano || '').toLowerCase().includes(q) ||
      (b.condicion || '').toLowerCase().includes(q) ||
      (b.estado || '').toLowerCase().includes(q)
    );
    mostrarBanos(filtrados);
    if (filtrados.length === 0) {
    } else {
    }
  }

  cargarTabla();
});
