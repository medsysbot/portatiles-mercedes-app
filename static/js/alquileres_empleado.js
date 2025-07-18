// Archivo: static/js/alquileres_empleado.js
// Proyecto: Portátiles Mercedes
// Tabla de solo vista y búsqueda, sin doble inicialización

window.pmAlquileresClienteData = window.pmAlquileresClienteData || [];
let tablaAlquileres = null;

function inicializarTablaAlquileres() {
  if (tablaAlquileres) return;
  tablaAlquileres = $('#tablaAlquileres').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'numero_bano' },
      { data: 'cliente_nombre' },
      { data: 'razon_social' },
      { data: 'dni_cuit_cuil' },
      { data: 'direccion' },
      { data: 'fecha_inicio' },
      { data: 'fecha_fin' },
      { data: 'observaciones' }
    ]
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  inicializarTablaAlquileres();
  const tabla = tablaAlquileres;

  async function obtenerAlquileres() {
    try {
      const resp = await fetch('/empleado/api/alquileres', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error consultando alquileres');
      window.pmAlquileresClienteData = await resp.json();
      mostrarAlquileres(window.pmAlquileresClienteData);
    } catch (err) {
      console.error('Error al cargar alquileres:', err);
      if (tabla) tabla.clear().draw();
    }
  }

  function mostrarAlquileres(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrarAlquileres(texto) {
    const q = texto.toLowerCase();
    const filtrados = window.pmAlquileresClienteData.filter(a =>
      (a.cliente_nombre || '').toLowerCase().includes(q) ||
      (a.razon_social || '').toLowerCase().includes(q) ||
      (a.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (a.numero_bano || '').toLowerCase().includes(q)
    );
    mostrarAlquileres(filtrados);
  }

  // --- Eventos de búsqueda ---
  const buscador = document.getElementById('busquedaAlquileres');
  const btnBuscar = document.getElementById('btnBuscarAlquiler');
  if (buscador) buscador.addEventListener('input', () => filtrarAlquileres(buscador.value.trim()));
  if (btnBuscar) btnBuscar.addEventListener('click', () => filtrarAlquileres(buscador.value.trim()));

  if (window.pmAlquileresClienteData.length === 0) {
    await obtenerAlquileres();
  } else {
    mostrarAlquileres(window.pmAlquileresClienteData);
  }
});
