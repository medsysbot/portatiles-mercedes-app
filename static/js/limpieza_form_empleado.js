// Archivo: static/js/limpieza_form_empleado.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const btnBuscar = document.getElementById('btnBuscarClienteLimpieza');
  const filtro = document.getElementById('filtroClientesLimpieza');

  let clientes = [];

  const tabla = $('#tablaClientesLimpieza').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'nombre' },
      { data: 'dni_cuit_cuil' },
      { data: 'razon_social' },
      { data: null, defaultContent: '<button class="btn btn-primary btn-sm seleccionar">Seleccionar</button>', orderable: false }
    ]
  });

  async function abrirModalClientes() {
    try {
      const resp = await fetch('/admin/api/clientes');
      if (!resp.ok) throw new Error('Error');
      const data = await resp.json();
      clientes = data.clientes || [];
      tabla.clear();
      tabla.rows.add(clientes).draw();
      $('#modalClientesLimpieza').modal('show');
    } catch (err) {
      console.error('Error al cargar clientes', err);
    }
  }

  function filtrarTabla() {
    const texto = (filtro.value || '').toLowerCase();
    tabla.rows().every(function() {
      const dato = this.data();
      const coincide =
        dato.nombre.toLowerCase().includes(texto) ||
        (dato.dni_cuit_cuil || '').toLowerCase().includes(texto) ||
        (dato.razon_social || '').toLowerCase().includes(texto);
      if (coincide) {
        $(this.node()).show();
      } else {
        $(this.node()).hide();
      }
    });
  }

  function seleccionarCliente(indice) {
    const c = clientes[indice];
    if (!c) return;
    document.querySelector('input[name="dni_cuit_cuil"]').value = c.dni_cuit_cuil;
    document.querySelector('input[name="nombre_cliente"]').value = c.nombre;
    document.querySelector('input[name="razon_social"]').value = c.razon_social || '';
    $('#modalClientesLimpieza').modal('hide');
  }

  $('#tablaClientesLimpieza tbody').on('click', 'button.seleccionar', function() {
    const index = tabla.row($(this).parents('tr')).index();
    seleccionarCliente(index);
  });

  btnBuscar?.addEventListener('click', abrirModalClientes);
  filtro?.addEventListener('input', filtrarTabla);
});
