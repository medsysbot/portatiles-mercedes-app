// Archivo: static/js/programacion_limpiezas_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaProgramacion').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'id', render: d => `<input type="checkbox" class="fila-check" data-id="${d}">`, orderable: false },
      { data: 'fecha_limpieza' },
      { data: 'hora_aprox' },
      { data: 'numero_bano' },
      { data: 'nombre_cliente' },
      { data: 'dni_cuit_cuil' },
      { data: 'direccion' }
    ]
  });

  const form = document.getElementById('formProgramacion');
  const btnEliminar = document.getElementById('btnEliminarSeleccionados');
  const btnNuevo = document.getElementById('btnMostrarForm');
  const contTabla = document.getElementById('contenedorTabla');
  const btnCancelar = document.getElementById('btnCancelarForm');

  form.style.display = 'none';

  btnNuevo.addEventListener('click', () => {
    form.style.display = 'block';
    contTabla.style.display = 'none';
    btnNuevo.style.display = 'none';
  });

  btnCancelar.addEventListener('click', () => {
    form.style.display = 'none';
    contTabla.style.display = 'block';
    btnNuevo.style.display = 'inline-block';
  });
  let registros = [];

  async function cargarDatos() {
    try {
      const resp = await fetch('/admin/api/limpiezas_programadas', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      registros = await resp.json();
      tabla.clear();
      tabla.rows.add(registros).draw();
      actualizarBoton();
    } catch (_) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al cargar datos', false, 2500);
      }
    }
  }

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (typeof showAlert === 'function') {
      showAlert('enviando-mensaje', 'Enviando datos...', false, 2500);
    }
    await new Promise(r => setTimeout(r, 2500));
    try {
      const resp = await fetch('/admin/api/limpiezas_programadas/agregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify(data)
      });
      if (!resp.ok) throw new Error('Error');
      form.reset();
      cargarDatos();
      btnCancelar.click();
      if (typeof showAlert === 'function') {
        showAlert('exito-datos', 'Datos guardados correctamente', false, 2500);
      }
    } catch (_) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al guardar', false, 2500);
      }
    }
  });


  function actualizarBoton() {
    const checks = document.querySelectorAll('#tablaProgramacion tbody .fila-check:checked');
    btnEliminar.disabled = checks.length === 0;
  }

  $('#tablaProgramacion tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaProgramacion tbody .fila-check:checked')).map(c => parseInt(c.dataset.id));
    if (!ids.length) return;
    if (typeof showAlert === 'function') {
      showAlert('enviando-mensaje', 'Eliminando datos...', false, 2500);
    }
    await new Promise(r => setTimeout(r, 2500));
    try {
      await fetch('/admin/api/limpiezas_programadas/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      cargarDatos();
      if (typeof showAlert === 'function') {
        showAlert('exito-datos', 'Datos eliminados', false, 2500);
      }
    } catch (_) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al eliminar', false, 2500);
      }
    }
  });

  cargarDatos();
});
