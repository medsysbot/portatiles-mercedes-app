// Archivo: static/js/inventario_banos_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const btnNuevo = document.getElementById('btnNuevoBano');
  const modal = document.getElementById('modalNuevoBano');
  const modalContainer = document.getElementById('modal-form-container');

  const tabla = $('#tablaInventario').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'numero_bano' },
      { data: 'condicion' },
      { data: 'ultima_reparacion' },
      { data: 'ultimo_mantenimiento' },
      { data: 'estado' },
      { data: 'observaciones' }
    ]
  });

  async function cargarTabla() {
    try {
      const resp = await fetch('/admin/api/inventario_banos');
      if (!resp.ok) throw new Error('Error al consultar inventario');
      const datos = await resp.json();
      tabla.clear();
      tabla.rows.add(datos).draw();
    } catch (err) {
      console.error('Error cargando inventario:', err);
    }
  }

  btnNuevo?.addEventListener('click', async () => {
    const resp = await fetch('/inventario_bano_form');
    modalContainer.innerHTML = await resp.text();
    modal.style.display = 'block';
    const form = document.getElementById('formNuevoBano');
    form?.addEventListener('submit', guardarBano);
  });

  async function guardarBano(event) {
    event.preventDefault();
    const form = event.target;
    const datos = Object.fromEntries(new FormData(form).entries());

    if (!datos.numero_bano || !datos.condicion || !datos.estado) {
      alert('Complete los campos obligatorios');
      return;
    }

    const resp = await fetch('/admin/inventario_banos/nuevo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const result = await resp.json();
    if (resp.ok && result.ok) {
      modal.style.display = 'none';
      form.removeEventListener('submit', guardarBano);
      cargarTabla();
      alert('Baño guardado');
    } else {
      alert(result.error || 'Error al guardar');
    }
  }

  cargarTabla();
});
