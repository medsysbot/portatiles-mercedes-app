// Archivo: static/js/morosos_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('busquedaMorosos');
  const btnBuscar = document.getElementById('btnBuscarMorosos');
  const mensajeError = document.getElementById('errorMorosos');

  let morososCargados = [];

  const tabla = $('#tablaMorosos').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'id_moroso' },
      { data: 'fecha_facturacion' },
      { data: 'numero_factura' },
      { data: 'dni_cuit_cuil' },
      { data: 'razon_social' },
      { data: 'nombre_cliente' },
      { data: 'monto_adeudado' }
    ]
  });

  async function cargarMorosos() {
    try {
      const resp = await fetch('/admin/api/morosos', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error consultando morosos');
      morososCargados = await resp.json();
      mostrarMorosos(morososCargados);
      mensajeError?.classList.add('d-none');
    } catch (_) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'No se pudo cargar el listado', false, 2500);
      }
    }
  }

  function mostrarMorosos(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  }

  function filtrarMorosos(texto) {
    const q = texto.toLowerCase();
    const filtrados = morososCargados.filter(m =>
      (m.dni_cuit_cuil || '').toLowerCase().includes(q)
    );
    mostrarMorosos(filtrados);
    if (filtrados.length === 0) {
    } else {
    }
  }

  buscador?.addEventListener('input', () => {
    filtrarMorosos(buscador.value.trim());
  });
  btnBuscar?.addEventListener('click', () => {
    filtrarMorosos(buscador.value.trim());
  });

  cargarMorosos();
});
