// Archivo: static/js/clientes_mis_compras.js
// Proyecto: Portátiles Mercedes

function handleUnauthorized() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
  localStorage.removeItem('nombre');
  window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('access_token')) {
    window.location.href = '/login';
    return;
  }

  const buscador = document.getElementById('busquedaVentas');
  const btnBuscar = document.getElementById('btnBuscarVentas');
  const errorDiv = document.getElementById('errorVentas');
  const mensajeDiv = document.getElementById('mensajeVentas');

  let registros = [];

  const tabla = $('#tablaVentasCliente').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'fecha_operacion', defaultContent: '-' },
      { data: 'tipo_bano', defaultContent: '-' },
      { data: 'dni_cuit_cuil', defaultContent: '-' },
      { data: 'nombre_cliente', defaultContent: '-' },
      { data: 'forma_pago', defaultContent: '-' },
      { data: 'observaciones', defaultContent: '-' }
    ]
  });

  async function cargarVentas() {
    try {
      const resp = await fetch('/clientes/compras_api', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (resp.status === 401) return handleUnauthorized();
      registros = await resp.json();
      mostrarVentas(registros);
      errorDiv.classList.add('d-none');
      mensajeDiv.style.display = registros.length ? 'none' : 'block';
      mensajeDiv.textContent = registros.length ? '' : 'Sin registros';
    } catch (err) {
      console.error('Error cargando compras:', err);
      errorDiv.textContent = 'No se pudo cargar el listado.';
      errorDiv.classList.remove('d-none');
    }
  }

  function mostrarVentas(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrar() {
    const q = (buscador.value || '').toLowerCase();
    const filtrados = registros.filter(v =>
      (v.dni_cuit_cuil || '').toLowerCase().includes(q)
    );
    mostrarVentas(filtrados);
    mensajeDiv.style.display = filtrados.length ? 'none' : 'block';
    mensajeDiv.textContent = filtrados.length ? '' : 'Sin registros';
  }

  buscador?.addEventListener('input', filtrar);
  btnBuscar?.addEventListener('click', filtrar);

  cargarVentas();
});
