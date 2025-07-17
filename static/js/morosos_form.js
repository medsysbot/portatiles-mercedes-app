// Archivo: static/js/morosos_form.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const btnBuscar = document.getElementById('btnBuscarClienteMoroso');
  let clientes = [];
  let tabla = null;

  async function cargarClientes(texto = '') {
    const inicio = startDataLoad();
    await dataLoadDelay();
    try {
      const resp = await fetch(`/admin/api/clientes/busqueda?q=${encodeURIComponent(texto)}`);
      if (!resp.ok) throw new Error('Error');
      const data = await resp.json();
      clientes = data.clientes || [];
      tabla.clear();
      tabla.rows.add(clientes).draw();
      endDataLoad(inicio, true);
    } catch (err) {
      endDataLoad(inicio, false);
      console.error('Error al buscar clientes', err);
    }
  }

  function abrirModal() {
    const modal = document.getElementById('modalClientesMoroso');
    const btnAgregar = document.getElementById('btnAgregarClienteMoroso');
    const filtro = document.getElementById('filtroClientesMoroso');
    tabla = $('#tablaClientesMoroso').DataTable({
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

    cargarClientes('');

    filtro?.addEventListener('input', () => {
      cargarClientes(filtro.value.trim());
    });

    $('#tablaClientesMoroso tbody').on('change', '.seleccion-cliente', function() {
      $('#tablaClientesMoroso tbody .seleccion-cliente').not(this).prop('checked', false);
      if (btnAgregar) btnAgregar.disabled = !this.checked;
    });

    btnAgregar?.addEventListener('click', () => {
      const seleccionado = document.querySelector('#tablaClientesMoroso tbody .seleccion-cliente:checked');
      if (!seleccionado) return;
      const cliente = clientes.find(c => c.dni_cuit_cuil == seleccionado.value);
      if (cliente) {
        document.querySelector('input[name="dni_cuit_cuil"]').value = cliente.dni_cuit_cuil;
        document.querySelector('input[name="nombre_cliente"]').value = cliente.nombre;
        document.querySelector('input[name="razon_social"]').value = cliente.razon_social;
      }
      $('#modalClientesMoroso').modal('hide');
      seleccionado.checked = false;
      if (btnAgregar) btnAgregar.disabled = true;
    });

    $('#modalClientesMoroso').on('hidden.bs.modal', function() {
      $('#tablaClientesMoroso').DataTable().destroy();
      this.remove();
    });

    $('#modalClientesMoroso').modal('show');
  }

  btnBuscar?.addEventListener('click', abrirModal);
});
