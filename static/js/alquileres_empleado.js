// Archivo: static/js/alquileres_empleado.js
// Proyecto: Portátiles Mercedes

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
      { data: 'numero_bano' },
      { data: 'cliente_nombre' },
      { data: 'dni_cuit_cuil' },
      { data: 'direccion' },
      { data: 'fecha_inicio' },
      { data: 'fecha_fin' },
      { data: 'observaciones' }
    ]
  });

  async function cargar() {
    const inicio = startDataLoad();
    await dataLoadDelay();
    try {
      const resp = await fetch('/empleado/api/alquileres', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error consultando alquileres');
      alquileresCargados = await resp.json();
      mostrar(alquileresCargados);
      mensajeError?.classList.add('d-none');
      endDataLoad(inicio, true);
    } catch (err) {
      endDataLoad(inicio, false);
      console.error('Error al cargar alquileres:', err);
    }
  }

  function mostrar(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrarAlquileres(texto) {
    const q = texto.toLowerCase();
    const filtrados = alquileresCargados.filter(a =>
      (a.cliente_nombre || '').toLowerCase().includes(q) ||
      (a.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (a.numero_bano || '').toLowerCase().includes(q)
    );
    mostrar(filtrados);
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

  cargar();
});
