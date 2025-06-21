document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('busquedaAlquileres');
  const btnBuscar = document.getElementById('btnBuscarAlquiler');
  const modalEl = document.getElementById('modalNuevoAlquiler');
  const modal = bootstrap.Modal ? new bootstrap.Modal(modalEl) : null;
  const form = document.getElementById('formNuevoAlquiler');
  const btnGuardar = document.getElementById('btnGuardarAlquiler');
  const btnNuevo = document.getElementById('btnNuevoAlquiler');

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
      { data: 'observaciones' },
      { data: null }
    ]
  });

  async function cargarAlquileres() {
    try {
      const resp = await fetch('/admin/api/alquileres');
      if (!resp.ok) throw new Error('Error consultando alquileres');
      alquileresCargados = await resp.json();
      mostrarAlquileres(alquileresCargados);
    } catch (err) {
      console.error('Error al cargar alquileres:', err);
    }
  }

  function mostrarAlquileres(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrar() {
    const texto = (buscador.value || '').toLowerCase();
    const filtrados = alquileresCargados.filter(a =>
      (a.cliente || '').toLowerCase().includes(texto) ||
      (a.numero_bano || '').toLowerCase().includes(texto)
    );
    mostrarAlquileres(filtrados);
  }

  btnBuscar?.addEventListener('click', filtrar);
  buscador?.addEventListener('input', filtrar);

  btnNuevo?.addEventListener('click', () => {
    modal?.show();
  });

  btnGuardar?.addEventListener('click', async () => {
    const datos = {
      numero_bano: document.getElementById('numero_bano').value.trim(),
      cliente: document.getElementById('cliente').value.trim(),
      direccion: document.getElementById('direccion').value.trim(),
      inicio_contrato: document.getElementById('inicio_contrato').value,
      fin_contrato: document.getElementById('fin_contrato').value,
      observaciones: document.getElementById('observaciones').value.trim()
    };
    if (!datos.numero_bano || !datos.cliente || !datos.inicio_contrato) {
      alert('Completá los campos obligatorios');
      return;
    }
    try {
      const resp = await fetch('/admin/alquileres/nuevo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      const result = await resp.json();
      if (!resp.ok || result.error) {
        const msg = result.error || 'Error al guardar';
        throw new Error(msg);
      }
      form.reset();
      modal?.hide();
      await cargarAlquileres();
    } catch (err) {
      console.error('Error guardando alquiler:', err);
      alert(err.message || 'Error al guardar alquiler');
    }
  });

  cargarAlquileres();
});
