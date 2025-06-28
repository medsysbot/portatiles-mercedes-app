// Script: recursos_humanos.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const seccionDatos = document.getElementById('seccionDatos');
  const seccionSalarios = document.getElementById('seccionSalarios');
  const seccionAusencias = document.getElementById('seccionAusencias');
  const btnDatos = document.getElementById('tabDatosBtn');
  const btnSalarios = document.getElementById('tabSalariosBtn');
  const btnAusencias = document.getElementById('tabAusenciasBtn');

  function mostrar(seccion) {
    seccionDatos.style.display = 'none';
    seccionSalarios.style.display = 'none';
    seccionAusencias.style.display = 'none';
    seccion.style.display = 'block';
  }

  btnDatos.addEventListener('click', () => mostrar(seccionDatos));
  btnSalarios.addEventListener('click', () => mostrar(seccionSalarios));
  btnAusencias.addEventListener('click', () => mostrar(seccionAusencias));

  mostrar(seccionDatos);

  const urlDatos = esAdmin ? '/admin/api/empleados_datos_personales' : '/empleado/api/datos_personales';
  const urlDatosDel = '/admin/api/empleados_datos_personales/eliminar';
  const urlSalarios = esAdmin ? '/admin/api/empleados_salarios' : '/empleado/api/empleados_salarios';
  const urlSalariosDel = '/admin/api/empleados_salarios/eliminar';
  const urlAusencias = esAdmin ? '/admin/api/empleados_ausencias' : '/empleado/api/empleados_ausencias';
  const urlAusenciasDel = '/admin/api/empleados_ausencias/eliminar';

  const tablaDatos = $('#tablaDatos').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: esAdmin ? [
      { data: 'id', render: d => `<input type="checkbox" class="fila-check" data-id="${d}">`, orderable: false },
      { data: 'nombre_empleado' },
      { data: 'dni_cuit_cuil' },
      { data: 'fecha_ingreso' },
      { data: 'imagen_documento_pdf_url', render: url => `<a href="${url}" target="_blank">Ver</a>` }
    ] : [
      { data: 'nombre_empleado' },
      { data: 'dni_cuit_cuil' },
      { data: 'fecha_ingreso' },
      { data: 'imagen_documento_pdf_url', render: url => `<a href="${url}" target="_blank">Ver</a>` }
    ]
  });

  const tablaSalarios = $('#tablaSalarios').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: esAdmin ? [
      { data: 'id', render: d => `<input type="checkbox" class="fila-check" data-id="${d}">`, orderable: false },
      { data: 'nombre_empleado' },
      { data: 'dni_cuit_cuil' },
      { data: 'salario' },
      { data: 'anticipo_pedido' },
      { data: 'saldo_a_pagar' },
      { data: 'recibo_sueldo_pdf_url', render: url => `<a href="${url}" target="_blank">Ver</a>` }
    ] : [
      { data: 'nombre_empleado' },
      { data: 'dni_cuit_cuil' },
      { data: 'salario' },
      { data: 'anticipo_pedido' },
      { data: 'saldo_a_pagar' },
      { data: 'recibo_sueldo_pdf_url', render: url => `<a href="${url}" target="_blank">Ver</a>` }
    ]
  });

  const tablaAusencias = $('#tablaAusencias').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: esAdmin ? [
      { data: 'id', render: d => `<input type="checkbox" class="fila-check" data-id="${d}">`, orderable: false },
      { data: 'nombre_empleado' },
      { data: 'dni_cuit_cuil' },
      { data: 'tipo_ausencia' },
      { data: 'fecha_inicio' },
      { data: 'fecha_fin' },
      { data: 'certificado_medico_pdf_url', render: url => `<a href="${url}" target="_blank">Ver</a>` }
    ] : [
      { data: 'nombre_empleado' },
      { data: 'dni_cuit_cuil' },
      { data: 'tipo_ausencia' },
      { data: 'fecha_inicio' },
      { data: 'fecha_fin' },
      { data: 'certificado_medico_pdf_url', render: url => `<a href="${url}" target="_blank">Ver</a>` }
    ]
  });

  const btnEliminarDatos = document.getElementById('btnEliminarDatos');
  const btnEliminarSalarios = document.getElementById('btnEliminarSalarios');
  const btnEliminarAusencias = document.getElementById('btnEliminarAusencias');

  function actualizarBoton(tabla, boton) {
    const marcados = tabla.rows().nodes().to$().find('.fila-check:checked');
    if (boton) boton.disabled = marcados.length === 0;
  }

  if (esAdmin) {
    $('#tablaDatos tbody').on('change', '.fila-check', () => actualizarBoton(tablaDatos, btnEliminarDatos));
    $('#tablaSalarios tbody').on('change', '.fila-check', () => actualizarBoton(tablaSalarios, btnEliminarSalarios));
    $('#tablaAusencias tbody').on('change', '.fila-check', () => actualizarBoton(tablaAusencias, btnEliminarAusencias));
  }

  async function cargarDatos() {
    try {
      const resp = await fetch(urlDatos, { headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') } });
      const datos = await resp.json();
      tablaDatos.clear();
      tablaDatos.rows.add(datos).draw();
    } catch (err) { console.error('Error al cargar datos personales:', err); }
  }

  async function cargarSalarios() {
    try {
      const resp = await fetch(urlSalarios, { headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') } });
      const datos = await resp.json();
      tablaSalarios.clear();
      tablaSalarios.rows.add(datos).draw();
    } catch (err) { console.error('Error al cargar salarios:', err); }
  }

  async function cargarAusencias() {
    try {
      const resp = await fetch(urlAusencias, { headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') } });
      const datos = await resp.json();
      tablaAusencias.clear();
      tablaAusencias.rows.add(datos).draw();
    } catch (err) { console.error('Error al cargar ausencias:', err); }
  }

  if (btnEliminarDatos) btnEliminarDatos.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaDatos tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length || !confirm('¿Eliminar registros seleccionados?')) return;
    try {
      const resp = await fetch(urlDatosDel, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('error');
      await cargarDatos();
    } catch (e) { alert('Error eliminando registros'); }
  });

  if (btnEliminarSalarios) btnEliminarSalarios.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaSalarios tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length || !confirm('¿Eliminar registros seleccionados?')) return;
    try {
      const resp = await fetch(urlSalariosDel, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('error');
      await cargarSalarios();
    } catch (e) { alert('Error eliminando registros'); }
  });

  if (btnEliminarAusencias) btnEliminarAusencias.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaAusencias tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length || !confirm('¿Eliminar registros seleccionados?')) return;
    try {
      const resp = await fetch(urlAusenciasDel, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('error');
      await cargarAusencias();
    } catch (e) { alert('Error eliminando registros'); }
  });

  cargarDatos();
  cargarSalarios();
  cargarAusencias();
});
