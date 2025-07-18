// Archivo: static/js/limpieza_form_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const btnBuscar = document.getElementById('btnBuscarClienteLimpieza');
  const btnAgregar = document.getElementById('btnAgregarClienteLimpieza');
  const filtro = document.getElementById('filtroClientesLimpieza');

  let clientes = [];

  const tabla = $('#tablaClientesLimpieza').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'dni_cuit_cuil', render: d => `<input type="checkbox" class="seleccion-cliente" value="${d}">`, orderable: false },
      { data: 'dni_cuit_cuil' },
      { data: 'nombre' },
      { data: 'razon_social' }
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
    $('#modalClientesLimpieza').modal('show');
    cargarClientes('');
  });

  filtro?.addEventListener('input', () => {
    cargarClientes(filtro.value.trim());
  });

  $('#tablaClientesLimpieza tbody').on('change', '.seleccion-cliente', function() {
    $('#tablaClientesLimpieza tbody .seleccion-cliente').not(this).prop('checked', false);
    if (btnAgregar) btnAgregar.disabled = !this.checked;
  });

  btnAgregar?.addEventListener('click', () => {
    const seleccionado = document.querySelector('#tablaClientesLimpieza tbody .seleccion-cliente:checked');
    if (!seleccionado) return;
    const cliente = clientes.find(c => c.dni_cuit_cuil == seleccionado.value);
      if (cliente) {
        document.querySelector('input[name="dni_cuit_cuil"]').value = cliente.dni_cuit_cuil;
        document.querySelector('input[name="nombre_cliente"]').value = cliente.nombre;
        document.querySelector('input[name="razon_social"]').value = cliente.razon_social;
        document.querySelector('input[name="direccion"]').value = cliente.direccion || '';
      }
    $('#modalClientesLimpieza').modal('hide');
    seleccionado.checked = false;
    if (btnAgregar) btnAgregar.disabled = true;
  });
});
