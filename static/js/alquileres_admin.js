document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('busquedaAlquileres');
  const btnBuscar = document.getElementById('btnBuscarAlquiler');
  const modalEl = document.getElementById('modalNuevoAlquiler');
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

  btnNuevo?.addEventListener('click', function () {
    modalEl.style.display = 'block';
  });

  btnGuardar?.addEventListener('click', async function () {
    const numero_bano = document.getElementById('numero_bano').value;
    const cliente = document.getElementById('cliente').value;
    const direccion = document.getElementById('direccion').value;
    const inicio_contrato = document.getElementById('inicio_contrato').value;
    const fin_contrato = document.getElementById('fin_contrato').value;
    const observaciones = document.getElementById('observaciones').value;

    if (!numero_bano || !cliente || !inicio_contrato) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    const datos = {
      numero_bano,
      cliente,
      direccion,
      inicio_contrato,
      fin_contrato,
      observaciones
    };

    const respuesta = await fetch('/admin/alquileres/nuevo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();

    if (resultado.ok) {
      alert('Alquiler guardado correctamente');
      cerrarModal();
      location.reload();
    } else {
      alert('Error al guardar: ' + resultado.error);
    }
  });

  cargarAlquileres();
});

function cerrarModal() {
  document.getElementById('modalNuevoAlquiler').style.display = 'none';
}
