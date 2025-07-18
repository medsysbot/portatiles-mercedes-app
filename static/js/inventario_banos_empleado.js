// Archivo: static/js/inventario_banos_empleado.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('campoBuscar');
  const btnBuscar = document.getElementById('btnBuscar');
  const mensajeError = document.getElementById('errorInventario');

  let banosCargados = [];

  const tabla = $('#tablaInventario').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'numero_bano' },
      { data: 'condicion' },
      { data: 'ultima_reparacion' },
      { data: 'ultimo_mantenimiento' },
      { data: 'estado' },
      { data: 'observaciones' }
    ]
  });

  async function cargarInventario() {
    try {
      const resp = await fetch('/empleado/api/inventario_banos', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error al consultar inventario');
      banosCargados = await resp.json();
      mostrar(banosCargados);
      mensajeError?.classList.add('d-none');
    } catch (err) {
      console.error('Error cargando inventario:', err);
      mensajeError?.classList.remove('d-none');
    }
  }

  function mostrar(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrar(texto) {
    const q = texto.toLowerCase();
    const filtrados = banosCargados.filter(b =>
      (b.numero_bano || '').toLowerCase().includes(q) ||
      (b.condicion || '').toLowerCase().includes(q) ||
      (b.estado || '').toLowerCase().includes(q)
    );
    mostrar(filtrados);
  }

  buscador?.addEventListener('input', () => filtrar(buscador.value.trim()));
  btnBuscar?.addEventListener('click', () => filtrar(buscador.value.trim()));

  cargarInventario();
});
