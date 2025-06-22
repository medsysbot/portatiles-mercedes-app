document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('busquedaAlquileres');
  const mensajeError = document.getElementById('errorAlquileres');

  let alquileresCargados = [];

  const tabla = $('#tablaAlquileres').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'numero_bano' },
      { data: 'cliente' },
      { data: 'direccion' },
      { data: 'inicio_contrato' },
      { data: 'fin_contrato' },
      { data: 'observaciones' }
    ]
  });

  async function cargarAlquileres() {
    try {
      const resp = await fetch('/admin/api/alquileres');
      if (!resp.ok) throw new Error('Error consultando alquileres');
      alquileresCargados = await resp.json();
      mostrarAlquileres(alquileresCargados);
      mensajeError?.classList.add('d-none');
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

  buscador?.addEventListener('input', () => {
    const texto = (buscador.value || '').toLowerCase();
    const filtrados = alquileresCargados.filter(a =>
      (a.cliente || '').toLowerCase().includes(texto) ||
      (a.numero_bano || '').toLowerCase().includes(texto)
    );
    mostrarAlquileres(filtrados);
  });

  cargarAlquileres();
});
