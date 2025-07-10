// Archivo: static/js/programacion_limpiezas_empleado.js
// Proyecto: Portátiles Mercedes
// Versión corregida: buscador externo y tabla consistente con limpieza_admin.js

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaProgramacion').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false, // DESACTIVADO: usamos buscador externo
    ordering: true,
    columns: [
      { data: 'fecha_limpieza' },
      { data: 'hora_aprox' },
      { data: 'numero_bano' },
      { data: 'nombre_cliente' },
      { data: 'dni_cuit_cuil' },
      { data: 'direccion' }
    ]
  });

  const buscador = document.getElementById('buscador-programacion');
  const btnBuscar = document.getElementById('btnBuscarProgramacion');
  const errorDiv = document.getElementById('errorProgramacion');
  const btnEliminar = document.getElementById('btnEliminarSeleccionados');
  let datosOriginales = [];

  async function cargarDatos() {
    const inicio = Date.now();
    if (typeof showAlert === 'function') {
      showAlert('enviando-reporte', 'Cargando programación...', false, 1600);
    }
    try {
      const resp = await fetch('/empleado/api/limpiezas_programadas', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error al cargar programación de limpiezas');
      datosOriginales = await resp.json();
      mostrarDatos(datosOriginales);
      errorDiv?.classList.add('d-none');
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
        if (typeof showAlert === 'function') {
          showAlert('exito-datos', 'Listado actualizado', false, 2600);
        }
      }, delay);
    } catch (err) {
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
        if (typeof showAlert === 'function') {
          showAlert('error-datos', 'No se pudo cargar la programación', false, 2600);
        }
      }, delay);
      console.error('Error cargando programación:', err);
    }
  }

  function mostrarDatos(lista) {
    tabla.clear().rows.add(lista).draw();
  }

  }

  function filtrarDatos(texto) {
    const q = texto.toLowerCase();
    const filtrados = datosOriginales.filter(d =>
      (d.nombre_cliente || '').toLowerCase().includes(q) ||
      (d.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (d.numero_bano || '').toLowerCase().includes(q) ||
      (d.direccion || '').toLowerCase().includes(q)
    );
    mostrarDatos(filtrados);
    if (filtrados.length === 0) {
    }
  }

  buscador?.addEventListener('input', () => filtrarDatos(buscador.value.trim()));
  btnBuscar?.addEventListener('click', () => filtrarDatos(buscador.value.trim()));

  cargarDatos();
});
