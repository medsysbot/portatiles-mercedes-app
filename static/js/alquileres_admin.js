document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('buscar-alquiler');
  const btnNuevo = document.getElementById('btn-nuevo-alquiler');
  const modalEl = document.getElementById('modalNuevoAlquiler');
  const form = document.getElementById('form-alquiler');
  const btnGuardar = document.getElementById('btnGuardarAlquiler');

  let alquileresCargados = [];

  const tabla = $('#tabla-alquileres').DataTable({
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
    } catch (err) {
      console.error('Error al cargar alquileres:', err);
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

  btnNuevo?.addEventListener('click', () => {
    modalEl.style.display = 'block';
  });

  btnGuardar?.addEventListener('click', async function (e) {
    e.preventDefault();

    const datos = {
      numero_bano: document.getElementById('numero_bano').value,
      cliente: document.getElementById('cliente').value,
      direccion: document.getElementById('direccion').value,
      inicio_contrato: document.getElementById('inicio_contrato').value,
      fin_contrato: document.getElementById('fin_contrato').value,
      observaciones: document.getElementById('observaciones').value
    };

    if (!datos.numero_bano || !datos.cliente || !datos.inicio_contrato) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    const respuesta = await fetch('/admin/alquileres/nuevo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();

    if (resultado.ok) {
      alert('Alquiler guardado correctamente');
      cerrarModal();
      cargarAlquileres();
    } else {
      alert('Error al guardar: ' + resultado.error);
    }
  });

  cargarAlquileres();
});

function cerrarModal() {
  document.getElementById('modalNuevoAlquiler').style.display = 'none';
}
