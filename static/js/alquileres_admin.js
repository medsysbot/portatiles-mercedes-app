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
        <td>${a.numero_bano || ''}</td>
        <td>${a.cliente || ''}</td>
        <td>${a.direccion || ''}</td>
        <td>${a.inicio_contrato || ''}</td>
        <td>${a.fin_contrato || ''}</td>
        <td>${a.observaciones || ''}</td>
        <td></td>`;
      cuerpoTabla.appendChild(tr);
    }
  }

  function filtrar() {
    const texto = (buscador.value || '').toLowerCase();
    const filtrados = alquileres.filter(a =>
      (a.cliente || '').toLowerCase().includes(texto) ||
      (a.numero_bano || '').toLowerCase().includes(texto)
    );
    mostrarAlquileres(filtrados);
  }

  btnBuscar?.addEventListener('click', filtrar);
  buscador?.addEventListener('input', filtrar);

  btnGuardar?.addEventListener('click', async () => {
    const datos = {
      numero_bano: document.getElementById('numero_bano').value.trim(),
      cliente: document.getElementById('cliente').value.trim(),
      direccion: document.getElementById('direccion').value.trim(),
      inicio_contrato: document.getElementById('inicio_contrato').value,
      fin_contrato: document.getElementById('fin_contrato').value,
      observaciones: document.getElementById('observaciones').value.trim()
    };
    if (!datos.numero_bano || !datos.cliente || !datos.inicio_contrato) {
      alert('Completá los campos obligatorios');
      return;
    }
    try {
      const resp = await fetch('/admin/alquileres/nuevo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      if (!resp.ok) throw new Error('Error al guardar');
      form.reset();
      modal?.hide();
      alert('Alquiler guardado correctamente');
      await cargarAlquileres();
    } catch (err) {
      console.error('Error guardando alquiler:', err);
      alert('Error al guardar alquiler');
    }
  });

  cargarAlquileres();
});

document.addEventListener("DOMContentLoaded", () => {
  const nuevoBtn = document.getElementById("btnNuevoAlquiler");

  if (nuevoBtn) {
    nuevoBtn.addEventListener("click", () => {
      const modal = new bootstrap.Modal(document.getElementById("modalNuevoAlquiler"));
      modal.show();
    });
  }
});
