// Archivo: static/js/facturas_pendientes_form.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const btnBuscar = document.getElementById('btnBuscarCliente');
  const btnAgregar = document.getElementById('btnAgregarCliente');
  const filtro = document.getElementById('filtroClientes');

  let clientes = [];

  const tabla = $('#tablaClientesBusqueda').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'dni_cuit_cuil', render: d => `<input type="checkbox" class="seleccion-cliente" value="${d}">`, orderable: false },
      { data: 'dni_cuit_cuil' },
      { data: 'nombre' },
      { data: 'razon_social' },
      { data: 'direccion' }
    ]
  });

  async function cargarClientes(texto = '') {
    try {
      const resp = await fetch(`/admin/api/clientes/busqueda?q=${encodeURIComponent(texto)}`);
      if (!resp.ok) throw new Error('Error');
      const data = await resp.json();
      clientes = data.clientes || [];
      tabla.clear();
      tabla.rows.add(clientes).draw();
    } catch (err) {
      console.error('Error al buscar clientes', err);
    }
  }

  btnBuscar?.addEventListener('click', () => {
    $('#modalClientes').modal('show');
    cargarClientes('');
  });

  filtro?.addEventListener('input', () => {
    cargarClientes(filtro.value.trim());
  });

  $('#tablaClientesBusqueda tbody').on('change', '.seleccion-cliente', function() {
    $('#tablaClientesBusqueda tbody .seleccion-cliente').not(this).prop('checked', false);
    if (btnAgregar) btnAgregar.disabled = !this.checked;
  });

  btnAgregar?.addEventListener('click', () => {
    const seleccionado = document.querySelector('#tablaClientesBusqueda tbody .seleccion-cliente:checked');
    if (!seleccionado) return;
    const cliente = clientes.find(c => c.dni_cuit_cuil == seleccionado.value);
    if (cliente) {
      document.querySelector('input[name="dni_cuit_cuil"]').value = cliente.dni_cuit_cuil;
      document.querySelector('input[name="nombre_cliente"]').value = cliente.nombre;
      document.querySelector('input[name="razon_social"]').value = cliente.razon_social;
      const inputDir = document.querySelector('input[name="direccion"]');
      if (inputDir) inputDir.value = cliente.direccion || '';
    }
    $('#modalClientes').modal('hide');
    seleccionado.checked = false;
    if (btnAgregar) btnAgregar.disabled = true;
  });
});
