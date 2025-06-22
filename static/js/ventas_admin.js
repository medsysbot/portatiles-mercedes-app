// Archivo: static/js/ventas_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaVentas').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'fecha_operacion' },
      { data: 'tipo_bano' },
      { data: 'dni_cliente' },
      { data: 'nombre_cliente' },
      { data: 'forma_pago' },
      { data: 'observaciones' }
    ]
  });

  const btnBuscar = document.getElementById('btnBuscarVentas');
  const buscador = document.getElementById('busquedaVentas');
  const errorDiv = document.getElementById('errorVentas');
  const mensajeDiv = document.getElementById('mensajeVentas');
  let ventas = [];

  async function cargarVentas() {
    try {
      const resp = await fetch('/admin/api/ventas', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error al consultar ventas');
      ventas = await resp.json();
      mostrarVentas(ventas);
      errorDiv.classList.add('d-none');
      if (ventas.length === 0) {
        mostrarMensaje('No hay ventas registradas', '');
      } else {
        mostrarMensaje('', '');
      }
    } catch (err) {
      console.error('Error cargando ventas:', err);
      errorDiv.textContent = 'No se pudo cargar el listado.';
      errorDiv.classList.remove('d-none');
    }
  }

  function mostrarVentas(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function mostrarMensaje(texto, tipo) {
    if (!mensajeDiv) return;
    if (!texto) {
      mensajeDiv.style.display = 'none';
      mensajeDiv.textContent = '';
      mensajeDiv.classList.remove('alert-danger');
      return;
    }
    mensajeDiv.textContent = texto;
    mensajeDiv.classList.toggle('alert-danger', tipo === 'danger');
    mensajeDiv.style.display = 'block';
  }

  function filtrarVentas(texto) {
    const q = texto.toLowerCase();
    const filtradas = ventas.filter(v =>
      (v.nombre_cliente || '').toLowerCase().includes(q) ||
      (v.dni_cliente || '').toLowerCase().includes(q)
    );
    mostrarVentas(filtradas);
    if (filtradas.length === 0) {
      mostrarMensaje('No hay ventas registradas', '');
    } else {
      mostrarMensaje('', '');
    }
  }

  buscador?.addEventListener('input', () => filtrarVentas(buscador.value.trim()));
  btnBuscar?.addEventListener('click', () => filtrarVentas(buscador.value.trim()));

  cargarVentas();
});
