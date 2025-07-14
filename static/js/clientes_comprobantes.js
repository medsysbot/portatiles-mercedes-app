// Archivo: static/js/clientes_comprobantes.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('access_token')) {
    window.location.href = '/login';
    return;
  }

  function handleUnauthorized() {
    localStorage.clear();
    window.location.href = '/login';
  }

  async function fetchConAuth(url, options = {}) {
    const token = localStorage.getItem('access_token');
    if (!token) handleUnauthorized();
    const resp = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: 'Bearer ' + token
      }
    });
    if (resp.status === 401) handleUnauthorized();
    return resp;
  }

  const tabla = $('#tablaComprobantes').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      {
        data: null,
        orderable: false,
        render: d => `<input type="checkbox" class="pm-check" data-id="${d.id}">`
      },
      { data: 'nombre_cliente' },
      { data: 'dni_cuit_cuil' },
      { data: 'razon_social', defaultContent: '' },
      { data: 'numero_de_factura' },
      {
        data: 'comprobante_url',
        render: d => d ? `<a href="${d}" target="_blank">VER PAGO</a>` : ''
      },
      {
        data: 'fecha_envio',
        render: fecha => {
          if (!fecha) return '';
          const f = new Date(fecha);
          return `${f.toLocaleDateString('es-AR')} ${f.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
        }
      }
    ]
  });

  const buscador = document.getElementById('busquedaComprobantes');
  const btnBuscar = document.getElementById('btnBuscarComprobante');
  const form = document.getElementById('formComprobante');
  const btnNuevo = document.getElementById('btnMostrarForm');
  const contTabla = document.getElementById('contenedorTabla');
  const contControles = document.getElementById('contenedorControles');
  const btnCancelar = document.getElementById('btnCancelarForm');
  const btnEliminar = document.getElementById('btnEliminarComprobantes');
  let registros = [];

  function actualizarBtnEliminar() {
    if (!btnEliminar) return;
    const marcados = document.querySelectorAll('.pm-check:checked').length;
    btnEliminar.disabled = marcados === 0;
  }

  document.addEventListener('change', ev => {
    if (ev.target.matches('.pm-check')) actualizarBtnEliminar();
  });

  btnEliminar?.addEventListener('click', async () => {
    const checks = document.querySelectorAll('.pm-check:checked');
    if (!checks.length) return;

    const start = Date.now();
    if (typeof showAlert === 'function') {
      showAlert('borrando', 'Eliminando comprobantes...', false, 1600);
    }

    let dni = localStorage.getItem('dni_cuit_cuil');
    if (!dni) {
      const usr = localStorage.getItem('usuario_obj');
      if (usr) {
        try { dni = JSON.parse(usr).dni_cuit_cuil; } catch (e) {}
      }
    }

    try {
      for (const ch of checks) {
        const id = ch.dataset.id;
        await fetchConAuth(`/api/comprobantes_pago/${id}?dni_cuit_cuil=${dni}`, {
          method: 'DELETE'
        });
      }
      await cargarComprobantes();
      actualizarBtnEliminar();
      const delay = Math.max(0, 1600 - (Date.now() - start));
      setTimeout(() => {
        if (typeof showAlert === 'function') {
          showAlert('borrado-exito', 'Comprobantes eliminados', false, 2600);
        }
      }, delay);
    } catch (e) {
      const delay = Math.max(0, 1600 - (Date.now() - start));
      setTimeout(() => {
        if (typeof showAlert === 'function') {
          showAlert('borrado-error', 'Error eliminando comprobantes', false, 2600);
        }
      }, delay);
      console.error('Error eliminando', e);
    }
  });

  btnNuevo?.addEventListener('click', () => {
    form?.classList.remove('d-none');
    contTabla?.classList.add('d-none');
    contControles?.remove();  // Elimina todo el bloque como en administración
  });

  btnCancelar?.addEventListener('click', () => {
    form?.classList.add('d-none');
    location.href = '/clientes/comprobantes';  // Refresca todo desde 0
  });

  function mostrarComprobantes(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrar() {
    const q = (buscador.value || '').toLowerCase();
      const filtrados = registros.filter(c =>
        (c.nombre_cliente || '').toLowerCase().includes(q) ||
        (c.dni_cuit_cuil || '').toLowerCase().includes(q) ||
        (c.razon_social || '').toLowerCase().includes(q) ||
        (c.numero_de_factura || '').toLowerCase().includes(q) ||
        (c.comprobante_url || '').toLowerCase().includes(q)
      );
    mostrarComprobantes(filtrados);
  }

  buscador?.addEventListener('input', filtrar);
  btnBuscar?.addEventListener('click', filtrar);

  async function cargarComprobantes() {
    const inicio = startDataLoad();
    await dataLoadDelay();
    let dni = localStorage.getItem('dni_cuit_cuil');
    if (!dni) {
      const usr = localStorage.getItem('usuario_obj');
      if (usr) {
        try { dni = JSON.parse(usr).dni_cuit_cuil; } catch (e) {}
      }
    }
    if (!dni) {
      console.error('No se encontró DNI del cliente en localStorage');
      return;
    }
    try {
      const resp = await fetchConAuth(`/api/comprobantes_pago?dni_cuit_cuil=${dni}`);
      if (!resp.ok) throw new Error('Error consultando comprobantes');
      registros = await resp.json();
      mostrarComprobantes(registros);
      document.querySelectorAll('.pm-check').forEach(c => (c.checked = false));
      actualizarBtnEliminar();
      endDataLoad(inicio, true);
    } catch (err) {
      endDataLoad(inicio, false);
      console.error('Error cargando comprobantes:', err);
    }
  }

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const datos = new FormData(form);

    for (const [_, v] of datos.entries()) {
      if (!v) {
        if (typeof showAlert === 'function') {
          showAlert('error-validacion', 'Complete todos los campos', false);
        }
        return;
      }
    }

    if (typeof showAlert === 'function') {
      showAlert('cargando-datos', 'Enviando datos...', false);
    }
    try {
      const resp = await fetch('/api/comprobantes_pago', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') },
        body: datos
      });
      const res = await resp.json();
      if (resp.ok && res.ok) {
        if (typeof showAlert === 'function') {
          showAlert('exito-datos', 'Formulario enviado correctamente', false);
        }
        setTimeout(() => {
          location.href = '/clientes/comprobantes';
        }, 1500);
      } else {
        throw new Error(res.detail || 'Error al subir comprobante');
      }
    } catch (err) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al enviar el formulario', false);
      }
    }
  });

  cargarComprobantes();
});
