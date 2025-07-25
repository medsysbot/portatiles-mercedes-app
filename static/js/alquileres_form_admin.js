// Archivo: static/js/alquileres_form_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const btnBuscar = document.getElementById('btnBuscarClienteAlquiler');
  const btnAgregar = document.getElementById('btnAgregarClienteAlquiler');
  const filtro = document.getElementById('filtroClientesAlquiler');

  let clientes = [];

  const tabla = $('#tablaClientesAlquiler').DataTable({
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
    $('#modalClientesAlquiler').modal('show');
    cargarClientes('');
  });

  filtro?.addEventListener('input', () => {
    cargarClientes(filtro.value.trim());
  });

  $('#tablaClientesAlquiler tbody').on('change', '.seleccion-cliente', function() {
    $('#tablaClientesAlquiler tbody .seleccion-cliente').not(this).prop('checked', false);
    if (btnAgregar) btnAgregar.disabled = !this.checked;
  });

  btnAgregar?.addEventListener('click', () => {
    const seleccionado = document.querySelector('#tablaClientesAlquiler tbody .seleccion-cliente:checked');
    if (!seleccionado) return;
    const cliente = clientes.find(c => c.dni_cuit_cuil == seleccionado.value);
    if (cliente) {
      document.querySelector('input[name="dni_cuit_cuil"]').value = cliente.dni_cuit_cuil;
      document.querySelector('input[name="nombre_cliente"]').value = cliente.nombre;
      document.querySelector('input[name="razon_social"]').value = cliente.razon_social;
      const inputDir = document.querySelector('input[name="direccion"]');
      if (inputDir) inputDir.value = cliente.direccion || '';
    }
    $('#modalClientesAlquiler').modal('hide');
    seleccionado.checked = false;
    if (btnAgregar) btnAgregar.disabled = true;
  });
});
