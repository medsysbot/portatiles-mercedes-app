document.addEventListener('DOMContentLoaded', () => {
  const seccionDatos = document.getElementById('seccionDatos');
  const seccionSalarios = document.getElementById('seccionSalarios');
  const seccionAusencias = document.getElementById('seccionAusencias');
  const btnDatos = document.getElementById('tabDatosBtn');
  const btnSalarios = document.getElementById('tabSalariosBtn');
  const btnAusencias = document.getElementById('tabAusenciasBtn');

  let datosCargados = [];
  let salariosCargados = [];
  let ausenciasCargados = [];

  // --- Manejo de pestañas con clase d-none (Bootstrap) ---
  function mostrar(seccion) {
    [seccionDatos, seccionSalarios, seccionAusencias].forEach(div => div.classList.add('d-none'));
    seccion.classList.remove('d-none');
  }

  btnDatos.addEventListener('click', () => mostrar(seccionDatos));
  btnSalarios.addEventListener('click', () => mostrar(seccionSalarios));
  btnAusencias.addEventListener('click', () => mostrar(seccionAusencias));

  mostrar(seccionDatos); // Mostrar datos por defecto

  // --- URLs de las APIs ---
  const urlDatos = esAdmin ? '/admin/api/empleados_datos_personales' : '/empleado/api/datos_personales';
  const urlDatosDel = '/admin/api/empleados_datos_personales/eliminar';
  const urlSalarios = esAdmin ? '/admin/api/empleados_salarios' : '/empleado/api/empleados_salarios';
  const urlSalariosDel = '/admin/api/empleados_salarios/eliminar';
  const urlAusencias = esAdmin ? '/admin/api/empleados_ausencias' : '/empleado/api/empleados_ausencias';
  const urlAusenciasDel = '/admin/api/empleados_ausencias/eliminar';

  // --- DataTables ---
  const tablaDatos = $('#tablaDatos').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: esAdmin ? [
      { data: 'id', render: d => `<input type="checkbox" class="fila-check" data-id="${d}">`, orderable: false },
      { data: 'nombre_empleado' },
      { data: 'dni_cuit_cuil' },
      { data: 'email' },
      { data: 'fecha_ingreso' },
      // Actualizamos la referencia al nuevo campo en la base de datos
      { data: 'documento_pdf_url', render: url => `<a href="${url}" target="_blank">Ver</a>` }
    ] : [
      { data: 'nombre_empleado' },
      { data: 'dni_cuit_cuil' },
      { data: 'email' },
      { data: 'fecha_ingreso' },
      // En modo empleado también usamos el campo actualizado
      { data: 'documento_pdf_url', render: url => `<a href="${url}" target="_blank">Ver</a>` }
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

  // --- Búsquedas ---
  const buscDatos = document.getElementById('busquedaDatos');
  const btnBuscarDatos = document.getElementById('btnBuscarDatos');
  const buscSalarios = document.getElementById('busquedaSalarios');
  const btnBuscarSalarios = document.getElementById('btnBuscarSalarios');
  const buscAusencias = document.getElementById('busquedaAusencias');
  const btnBuscarAusencias = document.getElementById('btnBuscarAusencias');

  function filtrarDatos() {
    const q = (buscDatos?.value || '').toLowerCase();
    const filtrados = datosCargados.filter(d =>
      (d.nombre_empleado || '').toLowerCase().includes(q) ||
      (d.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (d.email || '').toLowerCase().includes(q)
    );
    mostrarDatos(filtrados);
  }
  buscDatos?.addEventListener('input', filtrarDatos);
  btnBuscarDatos?.addEventListener('click', filtrarDatos);

  function filtrarSalarios() {
    const q = (buscSalarios?.value || '').toLowerCase();
    const filtrados = salariosCargados.filter(s =>
      (s.nombre_empleado || '').toLowerCase().includes(q) ||
      (s.dni_cuit_cuil || '').toLowerCase().includes(q)
    );
    mostrarSalarios(filtrados);
  }
  buscSalarios?.addEventListener('input', filtrarSalarios);
  btnBuscarSalarios?.addEventListener('click', filtrarSalarios);

  function filtrarAusencias() {
    const q = (buscAusencias?.value || '').toLowerCase();
    const filtrados = ausenciasCargados.filter(a =>
      (a.nombre_empleado || '').toLowerCase().includes(q) ||
      (a.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (a.tipo_ausencia || '').toLowerCase().includes(q)
    );
    mostrarAusencias(filtrados);
  }
  buscAusencias?.addEventListener('input', filtrarAusencias);
  btnBuscarAusencias?.addEventListener('click', filtrarAusencias);

  // --- Botones de eliminación ---
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

  function mostrarDatos(lista) {
    tablaDatos.clear();
    tablaDatos.rows.add(lista).draw();
  }

  function mostrarSalarios(lista) {
    tablaSalarios.clear();
    tablaSalarios.rows.add(lista).draw();
  }

  function mostrarAusencias(lista) {
    tablaAusencias.clear();
    tablaAusencias.rows.add(lista).draw();
  }


  // --- Cargar datos tablas ---
  async function cargarDatos() {
    try {
      const resp = await fetch(urlDatos, { headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') } });
      datosCargados = await resp.json();
      mostrarDatos(datosCargados);
    } catch (err) { console.error('Error al cargar datos personales:', err); }
  }

  async function cargarSalarios() {
    try {
      const resp = await fetch(urlSalarios, { headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') } });
      salariosCargados = await resp.json();
      mostrarSalarios(salariosCargados);
    } catch (err) { console.error('Error al cargar salarios:', err); }
  }

  async function cargarAusencias() {
    try {
      const resp = await fetch(urlAusencias, { headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') } });
      ausenciasCargados = await resp.json();
      mostrarAusencias(ausenciasCargados);
    } catch (err) { console.error('Error al cargar ausencias:', err); }
  }

  // --- Acciones eliminar ---
  if (btnEliminarDatos) btnEliminarDatos.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaDatos tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length) return;
    try {
      const resp = await fetch(urlDatosDel, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('error');
      await cargarDatos();
    } catch (err) {
      console.error('Error eliminando datos personales:', err);
    }
  });

  if (btnEliminarSalarios) btnEliminarSalarios.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaSalarios tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length) return;
    try {
      const resp = await fetch(urlSalariosDel, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('error');
      await cargarSalarios();
    } catch (err) {
      console.error('Error eliminando salarios:', err);
    }
  });

  if (btnEliminarAusencias) btnEliminarAusencias.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaAusencias tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length) return;
    try {
      const resp = await fetch(urlAusenciasDel, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('error');
      await cargarAusencias();
    } catch (err) {
      console.error('Error eliminando ausencias:', err);
    }
  });


  // --- Inicialización ---
  cargarDatos();
  cargarSalarios();
  cargarAusencias();
});
