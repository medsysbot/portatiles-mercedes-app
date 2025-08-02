// Archivo: static/js/alquileres_form_admin.js
// Proyecto: Portátiles Mercedes - Alta/edición de alquileres (panel admin)
// Manejo de alertas visuales y funcionamiento modal clientes

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[data-success-url]');
  const btnBuscarCliente = document.getElementById('btnBuscarClienteAlquiler');
  const modalClientes = document.getElementById('modalClientesAlquiler');
  const btnAgregarCliente = document.getElementById('btnAgregarClienteAlquiler');
  const filtroClientes = document.getElementById('filtroClientesAlquiler');
  const tablaClientes = document.getElementById('tablaClientesAlquiler');

  // === ALERTAS EN GUARDADO ===
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

  // === MODAL DE CLIENTES ===
  if (btnBuscarCliente && modalClientes) {
    btnBuscarCliente.addEventListener('click', () => {
      // Bootstrap modal
      if (window.$ && window.$.fn.modal) {
        $(modalClientes).modal('show');
      } else {
        modalClientes.style.display = 'block';
      }
      btnAgregarCliente.disabled = true;
    });
  }

  // Filtro en tabla de clientes del modal
  if (filtroClientes && tablaClientes) {
    filtroClientes.addEventListener('input', () => {
      const q = filtroClientes.value.trim().toLowerCase();
      tablaClientes.querySelectorAll('tbody tr').forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  // Selección de cliente (habilita botón Agregar)
  if (tablaClientes && btnAgregarCliente) {
    tablaClientes.addEventListener('change', (e) => {
      if (e.target && e.target.type === 'radio') {
        btnAgregarCliente.disabled = false;
      }
    });
  }

  // Precargar datos del cliente seleccionado en el form principal
  btnAgregarCliente?.addEventListener('click', () => {
    const seleccionado = tablaClientes.querySelector('tbody input[type="radio"]:checked');
    if (!seleccionado) return;

    const tr = seleccionado.closest('tr');
    if (!tr) return;

    // Asegúrate que las columnas del modal tengan las clases correctas
    form.querySelector('input[name="cliente_nombre"]').value = tr.querySelector('.col-nombre-cliente')?.textContent?.trim() || '';
    form.querySelector('input[name="dni_cuit_cuil"]').value = tr.querySelector('.col-dni')?.textContent?.trim() || '';
    form.querySelector('input[name="razon_social"]').value = tr.querySelector('.col-razon')?.textContent?.trim() || '';
    form.querySelector('input[name="direccion"]').value = tr.querySelector('.col-direccion')?.textContent?.trim() || '';

    // Cerrar modal
    if (window.$ && window.$.fn.modal) {
      $(modalClientes).modal('hide');
    } else {
      modalClientes.style.display = 'none';
    }
    btnAgregarCliente.disabled = true;
  });
});
