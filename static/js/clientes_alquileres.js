// Archivo: static/js/alquileres_cliente.js
// Proyecto: Portátiles Mercedes – Panel Clientes

document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('busquedaAlquileres');
  const btnBuscar = document.getElementById('btnBuscarAlquiler');
  const mensajeError = document.getElementById('errorAlquileres');

  window.pmAlquileresClienteData = window.pmAlquileresClienteData || [];
  let tablaAlquileres = null;

  function inicializarTabla() {
    if (tablaAlquileres) return;
    tablaAlquileres = $('#tablaAlquileres').DataTable({
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
  }

  async function obtenerDatos() {
    try {
      const resp = await fetch('/clientes/api/alquileres', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error consultando alquileres');
      const data = await resp.json();
      window.pmAlquileresClienteData = data || [];
      mostrarDatos(window.pmAlquileresClienteData);
      mensajeError?.classList.add('d-none');
    } catch (err) {
      console.error('Error al cargar alquileres:', err);
      if (!window.pmAlquileresClienteData.length) tablaAlquileres?.clear().draw();
    }
  }

  function mostrarDatos(lista) {
    tablaAlquileres.clear();
    tablaAlquileres.rows.add(lista).draw();
  }

  function filtrarDatos(texto) {
    const q = texto.toLowerCase();
    const filtrados = window.pmAlquileresClienteData.filter(a =>
      (a.numero_bano || '').toLowerCase().includes(q) ||
      (a.cliente_nombre || '').toLowerCase().includes(q) ||
      (a.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (a.direccion || '').toLowerCase().includes(q)
    );
    mostrarDatos(filtrados);
  }

  buscador?.addEventListener('input', () => filtrarDatos(buscador.value.trim()));
  btnBuscar?.addEventListener('click', () => filtrarDatos(buscador.value.trim()));

  inicializarTabla();
  if (window.pmAlquileresClienteData.length === 0) {
    obtenerDatos();
  } else {
    mostrarDatos(window.pmAlquileresClienteData);
  }
});
