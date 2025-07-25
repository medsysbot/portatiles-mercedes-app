// Archivo: static/js/empleados_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = document.getElementById('tabla-empleados');
  const btnEliminar = document.getElementById('btnEliminarEmpleados');
  const buscador = document.getElementById('busquedaEmpleado');
  const btnBuscar = document.getElementById('btnBuscarEmpleado');

  function actualizarBoton() {
    const marcados = tabla.querySelectorAll('.fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = marcados.length === 0;
  }

  tabla.addEventListener('change', e => {
    if (e.target.classList.contains('fila-check')) actualizarBoton();
  });

  function filtrarEmpleados() {
    const q = (buscador?.value || '').toLowerCase();
    tabla.querySelectorAll('tbody tr').forEach(tr => {
      const texto = tr.textContent.toLowerCase();
      tr.style.display = texto.includes(q) ? '' : 'none';
    });
  }

  buscador?.addEventListener('input', filtrarEmpleados);
  btnBuscar?.addEventListener('click', filtrarEmpleados);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(tabla.querySelectorAll('.fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length) return;
    try {
      const resp = await fetch('/admin/api/empleados/eliminar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('access_token')
        },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar empleados');
      location.reload();
    } catch (err) {
      console.error('Error eliminando empleados:', err);
    }
  });
});

