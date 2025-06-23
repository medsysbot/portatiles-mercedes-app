document.addEventListener('DOMContentLoaded', () => {
  const tabla = document.getElementById('tablaEmpleados');
  const btnEliminar = document.getElementById('btnEliminarSeleccionados');

  function actualizarBoton() {
    const marcados = tabla.querySelectorAll('.fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = marcados.length === 0;
  }

  tabla.addEventListener('change', e => {
    if (e.target.classList.contains('fila-check')) actualizarBoton();
  });

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(tabla.querySelectorAll('.fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length || !confirm('¿Eliminar registros seleccionados?')) return;
    try {
      const resp = await fetch('/admin/api/empleados/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      location.reload();
    } catch (err) {
      console.error('Error eliminando empleados:', err);
      alert('Error eliminando registros');
    }
  });
});

