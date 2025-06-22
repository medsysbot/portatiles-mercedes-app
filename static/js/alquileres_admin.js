document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('busquedaAlquileres');
  const mensajeError = document.getElementById('errorAlquileres');
  const mensajeInfo = document.getElementById('mensajeAlquileres');

  let alquileresCargados = [];

  const tabla = $('#tablaAlquileres').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'numero_bano' },
      { data: 'cliente_nombre' },
      { data: 'cliente_dni' },
      { data: 'direccion' },
      { data: 'fecha_inicio' },
      { data: 'fecha_fin' },
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
      if (alquileresCargados.length === 0) {
        mostrarMensaje('No hay alquileres registrados', '');
      } else {
        mostrarMensaje('', '');
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

  function mostrarMensaje(texto, tipo) {
    if (!mensajeInfo) return;
    if (!texto) {
      mensajeInfo.style.display = 'none';
      mensajeInfo.textContent = '';
      mensajeInfo.classList.remove('alert-danger');
      return;
    }
    mensajeInfo.textContent = texto;
    mensajeInfo.classList.toggle('alert-danger', tipo === 'danger');
    mensajeInfo.style.display = 'block';
  }

  buscador?.addEventListener('input', () => {
    const texto = (buscador.value || '').toLowerCase();
    const filtrados = alquileresCargados.filter(a =>
      (a.cliente_nombre || '').toLowerCase().includes(texto) ||
      (a.cliente_dni || '').toLowerCase().includes(texto) ||
      (a.numero_bano || '').toLowerCase().includes(texto)
    );
    mostrarAlquileres(filtrados);
    if (filtrados.length === 0) {
      mostrarMensaje('No hay alquileres registrados', '');
    } else {
      mostrarMensaje('', '');
    }
  });

  cargarAlquileres();
});
