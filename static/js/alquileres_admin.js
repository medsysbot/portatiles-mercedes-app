document.addEventListener('DOMContentLoaded', () => {
  const cuerpoTabla = document.querySelector('#tablaAlquileres tbody');
  const buscador = document.getElementById('busquedaAlquileres');
  const btnBuscar = document.getElementById('btnBuscarAlquiler');
  const modalEl = document.getElementById('modalNuevoAlquiler');
  const modal = bootstrap.Modal ? new bootstrap.Modal(modalEl) : null;
  const form = document.getElementById('formNuevoAlquiler');
  const btnGuardar = document.getElementById('btnGuardarAlquiler');

  let alquileres = [];

  async function cargarAlquileres() {
    try {
      const resp = await fetch('/admin/api/alquileres');
      if (!resp.ok) throw new Error('Error consultando alquileres');
      alquileres = await resp.json();
      mostrarAlquileres(alquileres);
    } catch (err) {
      console.error('Error al cargar alquileres:', err);
    }
  }

  function mostrarAlquileres(lista) {
    cuerpoTabla.innerHTML = '';
    for (const a of lista) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.numero_banho || ''}</td>
        <td>${a.cliente_nombre || ''}${a.cliente_dni ? ' - ' + a.cliente_dni : ''}</td>
        <td>${a.direccion || ''}</td>
        <td>${a.fecha_inicio || ''}</td>
        <td>${a.fecha_fin || ''}</td>
        <td>${a.observaciones || ''}</td>
        <td></td>`;
      cuerpoTabla.appendChild(tr);
    }
  }

  function filtrar() {
    const texto = (buscador.value || '').toLowerCase();
    const filtrados = alquileres.filter(a =>
      (a.cliente_nombre || '').toLowerCase().includes(texto) ||
      (a.cliente_dni || '').toLowerCase().includes(texto) ||
      (a.numero_banho || '').toLowerCase().includes(texto)
    );
    mostrarAlquileres(filtrados);
  }

  btnBuscar?.addEventListener('click', filtrar);
  buscador?.addEventListener('input', filtrar);

  btnGuardar?.addEventListener('click', async () => {
    const datos = {
      numero_banho: form.numeroBano.value.trim(),
      cliente_nombre: form.clienteNombre.value.trim(),
      cliente_dni: form.clienteDni.value.trim(),
      direccion: form.direccion.value.trim(),
      fecha_inicio: form.fechaInicio.value,
      fecha_fin: form.fechaFin.value,
      observaciones: form.observaciones.value.trim()
    };
    if (!datos.numero_banho) {
      alert('El número de baño es obligatorio');
      return;
    }
    try {
      const resp = await fetch('/admin/api/alquileres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      if (!resp.ok) throw new Error('Error al guardar');
      form.reset();
      modal?.hide();
      await cargarAlquileres();
    } catch (err) {
      console.error('Error guardando alquiler:', err);
      alert('Error al guardar alquiler');
    }
  });

  cargarAlquileres();
});
