// Archivo: static/js/alquileres_form_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const btnBuscar = document.getElementById('btnBuscarClienteAlquiler');
  const btnAgregar = document.getElementById('btnAgregarClienteAlquiler');
  const filtro = document.getElementById('filtroClientesAlquiler');
  const form = document.querySelector('form[data-success-url]');

  let clientes = [];

  // === DataTable Modal Clientes ===
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

  // --- Carga clientes en el modal ---
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
      // Llena correctamente TODOS los campos
      const inputDni = document.querySelector('input[name="dni_cuit_cuil"]');
      const inputNombre = document.querySelector('input[name="cliente_nombre"]') || document.querySelector('input[name="nombre_cliente"]');
      const inputRazon = document.querySelector('input[name="razon_social"]');
      const inputDir = document.querySelector('input[name="direccion"]');
      if (inputDni) inputDni.value = cliente.dni_cuit_cuil || '';
      if (inputNombre) inputNombre.value = cliente.nombre || cliente.cliente_nombre || '';
      if (inputRazon) inputRazon.value = cliente.razon_social || '';
      if (inputDir) inputDir.value = cliente.direccion || '';
    }
    $('#modalClientesAlquiler').modal('hide');
    seleccionado.checked = false;
    if (btnAgregar) btnAgregar.disabled = true;
  });

  // ===== ALERTAS VISUALES EN GUARDADO DE FORMULARIO (Sólo aquí) =====
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await showAlert('guardando-datos', 'Guardando datos...');

      const formData = new FormData(form);
      let exito = false;
      let msgError = "Error al guardar los datos";

      try {
        const resp = await fetch(form.action || window.location.pathname, {
          method: 'POST',
          body: formData
        });
        if (resp.ok) {
          exito = true;
        } else {
          try {
            const data = await resp.json();
            if (data && data.detail) msgError = data.detail;
            if (data && data.error) msgError = data.error;
          } catch {}
        }
      } catch {
        exito = false;
      }

      if (exito) {
        await showAlert('exito-datos', 'Formulario enviado correctamente');
        setTimeout(() => {
          window.location.href = form.getAttribute('data-success-url') || "/admin/alquileres";
        }, 2300);
      } else {
        await showAlert('error-datos', msgError);
      }
    });
  }
});
