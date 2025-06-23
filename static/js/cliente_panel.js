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
        cargarDatos(window.dniCliente);
        cargarEmailsCliente(email);
        prepararListenersFormulario();
    } catch (err) {
        if (err.message === 'Unauthorized' || err.message === 'Token inválido') {
            handleUnauthorized();
        } else {
            console.error(err);
        }
    }
});
// ==== Funciones auxiliares ====

async function cargarDatos(dni) {
    try {
        const [alqRes, pendRes, histRes, limpRes, venRes] = await Promise.all([
            fetchConAuth(`/alquileres_cliente?dni=${encodeURIComponent(dni)}`),
            fetchConAuth(`/facturas_pendientes_cliente?dni=${encodeURIComponent(dni)}`),
            fetchConAuth(`/facturas_cliente?dni=${encodeURIComponent(dni)}`),
            fetchConAuth(`/limpiezas_cliente?dni=${encodeURIComponent(dni)}`),
            fetchConAuth(`/ventas_cliente?dni=${encodeURIComponent(dni)}`)
        ]);

        if (alqRes.ok) {
            const datos = await alqRes.json();
            renderAlquileres(datos);
        }
        if (pendRes.ok) {
            const datos = await pendRes.json();
            renderPendientes(datos);
        }
        if (histRes.ok) {
            const datos = await histRes.json();
            renderHistorial(datos);
        }
        if (limpRes.ok) {
            const datos = await limpRes.json();
            renderLimpiezas(datos);
        }
        if (venRes.ok) {
            const datos = await venRes.json();
            renderVentas(datos);
        }
    } catch (err) {
        console.error(err);
        if (err.message === 'Unauthorized') handleUnauthorized();
    }
}

function renderAlquileres(lista) {
    const tbody = document.querySelector('#tablaAlquileres tbody');
    tbody.innerHTML = '';
    lista.forEach(reg => {
        const tr = document.createElement('tr');
        tr.innerHTML =
            `<td>${reg.numero_bano || ''}</td>` +
            `<td>${reg.cliente_nombre || ''}</td>` +
            `<td>${reg.cliente_dni || ''}</td>` +
            `<td>${reg.direccion || ''}</td>` +
            `<td>${reg.fecha_inicio || ''}</td>` +
            `<td>${reg.fecha_fin || ''}</td>` +
            `<td>${reg.observaciones || ''}</td>`;
        tbody.appendChild(tr);
    });
}


function renderPendientes(lista) {
    const tbody = document.querySelector('#tablaFacturasPendientes tbody');
    tbody.innerHTML = '';
    lista.forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${f.fecha || ''}</td>` +
                       `<td>${f.numero_factura || ''}</td>` +
                       `<td>${f.monto_adeudado || ''}</td>`;
        tbody.appendChild(tr);
    });
}

function renderHistorial(lista) {
    const tbody = document.querySelector('#tablaHistorial tbody');
    tbody.innerHTML = '';
    lista.forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${f.fecha || ''}</td>` +
                       `<td>${f.numero_factura || ''}</td>` +
                       `<td>${f.monto || ''}</td>` +
                       `<td>${f.estado || ''}</td>`;
        tbody.appendChild(tr);
    });
}

function renderLimpiezas(lista) {
    const tbody = document.querySelector('#tablaLimpiezas tbody');
    tbody.innerHTML = '';
    lista.forEach(l => {
        const tr = document.createElement('tr');
        const remito = l.remito_url ? `<a href="${l.remito_url}" target="_blank">Ver</a>` : '';
        tr.innerHTML = `<td>${l.fecha || ''}</td>` +
                       `<td>${l.numero_bano || ''}</td>` +
                       `<td>${l.tipo_servicio || ''}</td>` +
                       `<td>${l.observaciones || ''}</td>` +
                       `<td>${remito}</td>`;
        tbody.appendChild(tr);
    });
}

function renderVentas(lista) {
    const tbody = document.querySelector('#tablaVentasCliente tbody');
    tbody.innerHTML = '';
    lista.forEach(v => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${v.fecha_operacion || ''}</td>` +
                       `<td>${v.tipo_bano || ''}</td>` +
                       `<td>${v.forma_pago || ''}</td>` +
                       `<td>${v.observaciones || ''}</td>`;
        tbody.appendChild(tr);
    });
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
