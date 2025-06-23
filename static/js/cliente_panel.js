/*
Archivo: cliente_panel.js
Descripción: Lógica del panel del cliente
Acceso: Privado
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-15
*/
// ==== Eventos principales ====
function handleUnauthorized() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    localStorage.removeItem('nombre');
    window.location.href = '/login';
}

async function fetchConAuth(url, options = {}) {
    const resp = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': 'Bearer ' + localStorage.getItem('access_token')
        }
    });
    if (resp.status === 401) {
        handleUnauthorized();
        throw new Error('Unauthorized');
    }
    return resp;
}

let alquileresCargados = [];
let facturasCargadas = [];
let ventasCargadas = [];
let limpiezasCargadas = [];
let tablaAlquileres;
let tablaFacturas;
let tablaVentas;
let tablaLimpiezas;

function initTablas() {
    tablaAlquileres = $('#tablaAlquileres').DataTable({
        language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
        paging: true,
        searching: false,
        ordering: true,
        columns: [
            { data: 'numero_bano' },
            { data: 'cliente_nombre' },
            { data: 'cliente_dni' },
            { data: 'direccion' },
            { data: 'fecha_inicio' },
            { data: 'fecha_fin' },
            { data: 'observaciones' }
        ]
    });

    tablaFacturas = $('#tablaFacturasPendientes').DataTable({
        language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
        paging: true,
        searching: false,
        ordering: true,
        columns: [
            { data: 'id_factura' },
            { data: 'fecha' },
            { data: 'numero_factura' },
            { data: 'dni_cuit_cuil' },
            { data: 'razon_social' },
            { data: 'nombre_cliente' },
            { data: 'monto_adeudado' }
        ]
    });

    tablaVentas = $('#tablaVentasCliente').DataTable({
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

    tablaLimpiezas = $('#tablaServicios').DataTable({
        language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
        paging: true,
        searching: false,
        ordering: true,
        columns: [
            { data: 'fecha_servicio' },
            { data: 'numero_bano' },
            { data: 'dni_cliente' },
            { data: 'nombre_cliente' },
            { data: 'tipo_servicio' },
            { data: 'remito_url', render: data => `<a href="${data}" target="_blank">Ver</a>` },
            { data: 'observaciones' }
        ]
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const ver = await fetch('/verificar_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: token })
        });
        if (!ver.ok) throw new Error('Token inválido');
        const info = await ver.json();
        if (info.status !== 'ok' || info.rol !== 'cliente') {
            handleUnauthorized();
            return;
        }
        const email = info.email;
        window.emailCliente = email;
        const datosCliRes = await fetch(`/info_datos_cliente?email=${encodeURIComponent(email)}`);
        let nombre = email;
        if (datosCliRes.ok) {
            const datosCli = await datosCliRes.json();
            nombre = datosCli.nombre || email;
            window.dniCliente = datosCli.dni;
            cargarDatosPersonales(email, datosCli);
        } else {
            cargarDatosPersonales(email);
        }
        document.getElementById('bienvenida').textContent = 'Panel del Cliente';
        initTablas();
        cargarAlquileres(window.dniCliente);
        cargarFacturas(window.dniCliente);
        cargarVentas(window.dniCliente);
        cargarLimpiezas(window.dniCliente);
        cargarEmailsCliente(email);
        prepararListenersFormulario();

        const buscAlq = document.getElementById('busquedaAlquileres');
        buscAlq?.addEventListener('input', () => {
            const texto = (buscAlq.value || '').toLowerCase();
            const filtrados = alquileresCargados.filter(a =>
                (a.cliente_nombre || '').toLowerCase().includes(texto) ||
                (a.cliente_dni || '').toLowerCase().includes(texto) ||
                (a.numero_bano || '').toLowerCase().includes(texto)
            );
            mostrarAlquileres(filtrados);
            if (filtrados.length === 0) {
                mostrarMensaje('mensajeAlquileres', 'No hay alquileres registrados', '');
            } else {
                mostrarMensaje('mensajeAlquileres', '', '');
            }
        });

        const buscFact = document.getElementById('busquedaFacturas');
        const btnBuscFact = document.getElementById('btnBuscarFacturas');
        function filtrarFacturas() {
            const q = (buscFact.value || '').toLowerCase();
            const filtradas = facturasCargadas.filter(f => (f.dni_cuit_cuil || '').toLowerCase().includes(q));
            mostrarFacturas(filtradas);
            if (filtradas.length === 0) {
                mostrarMensaje('mensajeFacturas', 'No hay facturas registradas', '');
            } else {
                mostrarMensaje('mensajeFacturas', '', '');
            }
        }
        buscFact?.addEventListener('input', filtrarFacturas);
        btnBuscFact?.addEventListener('click', filtrarFacturas);

        const buscVentas = document.getElementById('busquedaVentas');
        buscVentas?.addEventListener('input', () => {
            const texto = (buscVentas.value || '').toLowerCase();
            const filtrados = ventasCargadas.filter(v =>
                (v.nombre_cliente || '').toLowerCase().includes(texto) ||
                (v.dni_cliente || '').toLowerCase().includes(texto)
            );
            mostrarVentas(filtrados);
            if (filtrados.length === 0) {
                mostrarMensaje('mensajeVentas', 'No hay ventas registradas', '');
            } else {
                mostrarMensaje('mensajeVentas', '', '');
            }
        });
    } catch (err) {
        if (err.message === 'Unauthorized' || err.message === 'Token inválido') {
            handleUnauthorized();
        } else {
            console.error(err);
        }
    }
});
// ==== Funciones auxiliares ====

function mostrarMensaje(id, texto, tipo) {
    const cont = document.getElementById(id);
    if (!cont) return;
    if (!texto) {
        cont.style.display = 'none';
        cont.textContent = '';
        cont.classList.remove('alert-danger');
        return;
    }
    cont.textContent = texto;
    cont.classList.toggle('alert-danger', tipo === 'danger');
    cont.style.display = 'block';
}

async function cargarAlquileres(dni) {
    const mensajeError = document.getElementById('errorAlquileres');
    try {
        const resp = await fetchConAuth(`/alquileres_cliente?dni=${encodeURIComponent(dni)}`);
        if (!resp.ok) throw new Error('Error consultando');
        alquileresCargados = await resp.json();
        mostrarAlquileres(alquileresCargados);
        mensajeError?.classList.add('d-none');
        if (alquileresCargados.length === 0) {
            mostrarMensaje('mensajeAlquileres', 'No hay alquileres registrados', '');
        } else {
            mostrarMensaje('mensajeAlquileres', '', '');
        }
    } catch (err) {
        console.error('Error al cargar alquileres:', err);
        if (mensajeError) {
            mensajeError.textContent = 'No se pudieron cargar los alquileres.';
            mensajeError.classList.remove('d-none');
        }
    }
}

function mostrarAlquileres(lista) {
    tablaAlquileres.clear();
    tablaAlquileres.rows.add(lista).draw();
}

async function cargarFacturas(dni) {
    const mensajeError = document.getElementById('errorFacturas');
    try {
        const resp = await fetchConAuth(`/facturas_pendientes_cliente?dni=${encodeURIComponent(dni)}`);
        if (!resp.ok) throw new Error('Error consultando');
        facturasCargadas = await resp.json();
        mostrarFacturas(facturasCargadas);
        mensajeError?.classList.add('d-none');
        if (facturasCargadas.length === 0) {
            mostrarMensaje('mensajeFacturas', 'No hay facturas registradas', '');
        } else {
            mostrarMensaje('mensajeFacturas', '', '');
        }
    } catch (err) {
        console.error('Error cargando facturas:', err);
        if (mensajeError) {
            mensajeError.textContent = 'No se pudo cargar el listado.';
            mensajeError.classList.remove('d-none');
        }
    }
}

function mostrarFacturas(lista) {
    tablaFacturas.clear();
    tablaFacturas.rows.add(lista).draw();
}

async function cargarVentas(dni) {
    const mensajeError = document.getElementById('errorVentas');
    try {
        const resp = await fetchConAuth(`/ventas_cliente?dni=${encodeURIComponent(dni)}`);
        if (!resp.ok) throw new Error('Error consultando');
        ventasCargadas = await resp.json();
        mostrarVentas(ventasCargadas);
        mensajeError?.classList.add('d-none');
        if (ventasCargadas.length === 0) {
            mostrarMensaje('mensajeVentas', 'No hay ventas registradas', '');
        } else {
            mostrarMensaje('mensajeVentas', '', '');
        }
    } catch (err) {
        console.error('Error al cargar ventas:', err);
        if (mensajeError) {
            mensajeError.textContent = 'No se pudo cargar el listado.';
            mensajeError.classList.remove('d-none');
        }
    }
}

function mostrarVentas(lista) {
    tablaVentas.clear();
    tablaVentas.rows.add(lista).draw();
}

async function cargarLimpiezas(dni) {
    const mensajeError = document.getElementById('errorServicios');
    try {
        const resp = await fetchConAuth(`/limpiezas_cliente?dni=${encodeURIComponent(dni)}`);
        if (!resp.ok) throw new Error('Error consultando');
        limpiezasCargadas = await resp.json();
        mostrarLimpiezas(limpiezasCargadas);
        mensajeError?.classList.add('d-none');
        if (limpiezasCargadas.length === 0) {
            mostrarMensaje('mensajeServicios', 'No hay servicios registrados', '');
        } else {
            mostrarMensaje('mensajeServicios', '', '');
        }
    } catch (err) {
        console.error('Error al cargar servicios:', err);
        if (mensajeError) {
            mensajeError.textContent = 'No se pudo cargar el listado.';
            mensajeError.classList.remove('d-none');
        }
    }
}

function mostrarLimpiezas(lista) {
    tablaLimpiezas.clear();
    tablaLimpiezas.rows.add(lista).draw();
}

function renderEmails(lista) {
    const tbody = document.querySelector('#tablaEmails tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    lista.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${e.fecha || ''}</td>` +
                       `<td>${e.asunto || ''}</td>` +
                       `<td>${e.estado || ''}</td>`;
        tbody.appendChild(tr);
    });
}

async function cargarEmailsCliente(email) {
    try {
        const resp = await fetchConAuth(`/emails_cliente?email=${encodeURIComponent(email)}`);
        if (!resp.ok) throw new Error('Error');
        const datos = await resp.json();
        renderEmails(datos);
    } catch (err) {
        console.error('Error cargando emails:', err);
    }
}



let datosOriginales = null;

async function cargarDatosPersonales(email, datos = null) {
    try {
        let info = datos;
        if (!info) {
            const resp = await fetch(`/info_datos_cliente?email=${encodeURIComponent(email)}`);
            if (!resp.ok) {
                console.warn('No se encontraron datos personales');
                return;
            }
            info = await resp.json();
        }

        datosOriginales = info;
        document.getElementById("nombre").value = info.nombre || "";
        document.getElementById("apellido").value = info.apellido || "";
        document.getElementById("direccion").value = info.direccion || "";
        document.getElementById("telefono").value = info.telefono || "";
        document.getElementById("dni").value = info.dni || "";
        document.getElementById("cuit").value = info.cuit || "";
        document.getElementById("razon_social").value = info.razon_social || "";
        document.getElementById("email").value = info.email || "";

        document.getElementById("botonGuardarDatos").disabled = true;
    } catch (err) {
        console.error("\u274c Error cargando datos:", err);
        alert('No se pudieron cargar sus datos personales');
    }
}

function prepararListenersFormulario() {
    const inputs = ["nombre", "apellido", "direccion", "telefono", "dni", "cuit", "razon_social", "email"];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                document.getElementById('botonGuardarDatos').disabled = !hayCambios();
            });
        }
    });
}

function hayCambios() {
    if (!datosOriginales) return true;
    const campos = ["nombre", "apellido", "direccion", "telefono", "dni", "cuit", "razon_social", "email"];
    return campos.some(c => (datosOriginales[c] || "") !== document.getElementById(c).value);
}

function mostrarMensajeFormulario(mensaje, tipo) {
    const contenedor = document.getElementById('mensajeFormDatos');
    if (!contenedor) return;
    contenedor.textContent = mensaje;
    contenedor.classList.remove('alert-success', 'alert-danger');
    contenedor.classList.add(tipo === 'success' ? 'alert-success' : 'alert-danger');
    contenedor.style.display = 'block';
}

async function guardarDatos(ev) {
    if (ev) ev.preventDefault();
    const datos = {
        dni: document.getElementById("dni").value,
        nombre: document.getElementById("nombre").value,
        apellido: document.getElementById("apellido").value,
        direccion: document.getElementById("direccion").value,
        telefono: document.getElementById("telefono").value,
        cuit: document.getElementById("cuit").value,
        razon_social: document.getElementById("razon_social").value,
        email: document.getElementById("email").value
    };

    const obligatorios = ['dni','nombre','apellido','direccion','telefono','email'];
    for (const campo of obligatorios) {
        if (!datos[campo]) {
            alert('Completa el campo ' + campo);
            return;
        }
    }

    const response = await fetchConAuth('/guardar_datos_cliente', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
    });

    const resultado = await response.json();
    if (response.ok && resultado.mensaje) {
        mostrarMensajeFormulario(resultado.mensaje, 'success');
        datosOriginales = datos;
        document.getElementById('botonGuardarDatos').disabled = true;
    } else {
        mostrarMensajeFormulario(resultado.error || 'Error al guardar datos', 'danger');
    }
}

document.getElementById('formReporte').addEventListener('submit', enviarReporte);
document.getElementById('formRespuestaEmail').addEventListener('submit', enviarEmail);

async function enviarReporte(ev) {
    ev.preventDefault();
    const datos = {
        dni: window.dniCliente,
        fecha: document.getElementById('fechaReporte').value,
        nombre_persona: document.getElementById('nombrePersonaReporte').value,
        motivo: document.getElementById('motivoReporte').value,
        observaciones: document.getElementById('obsReporte').value
    };
    const resp = await fetchConAuth('/cliente/reporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    const cont = document.getElementById('msgReporte');
    if (resp.ok) {
        cont.textContent = 'Reporte enviado correctamente';
        cont.className = 'alert alert-success';
        ev.target.reset();
    } else {
        const r = await resp.json();
        cont.textContent = r.detail || 'Error al enviar';
        cont.className = 'alert alert-danger';
    }
    cont.style.display = 'block';
}

async function enviarEmail(ev) {
    ev.preventDefault();
    const datos = {
        email: document.getElementById('email').value,
        mensaje: document.getElementById('mensajeEmail').value
    };
    const resp = await fetchConAuth('/cliente/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    const cont = document.getElementById('mensajeEmailCliente');
    if (resp.ok) {
        cont.textContent = 'Email enviado';
        cont.className = 'alert alert-success';
        ev.target.reset();
    } else {
        const r = await resp.json();
        cont.textContent = r.detail || 'Error al enviar';
        cont.className = 'alert alert-danger';
    }
    cont.style.display = 'block';
}
