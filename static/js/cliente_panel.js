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
        const datosCliRes = await fetch(`/info_datos_cliente?email=${email}`);
        let nombre = email;
        let datosCompletos = false;
        if (datosCliRes.ok) {
            const datosCli = await datosCliRes.json();
            nombre = datosCli.nombre || email;
            datosCompletos = ['nombre','apellido','dni','direccion','telefono','cuit','razon_social'].every(c => datosCli[c]);
        }
        // Modal ya no se muestra automáticamente
        document.getElementById('bienvenida').textContent = `Bienvenido ${nombre}`;
        mostrarSplash(nombre);
        cargarDatos(email);
        cargarDatosPersonales(window.emailCliente);
    } catch (err) {
        handleUnauthorized();
    }
});
// ==== Funciones auxiliares ====

async function cargarDatos(email) {
    try {
        const [alqRes, pagRes, limpRes] = await Promise.all([
            fetchConAuth(`/alquileres_cliente?email=${encodeURIComponent(email)}`),
            fetchConAuth(`/pagos_cliente?email=${encodeURIComponent(email)}`),
            fetchConAuth(`/limpiezas_cliente?email=${encodeURIComponent(email)}`)
        ]);

        if (alqRes.ok) {
            const datos = await alqRes.json();
            renderAlquileres(datos);
        }
        if (pagRes.ok) {
            const datos = await pagRes.json();
            renderPagos(datos);
        }
        if (limpRes.ok) {
            const datos = await limpRes.json();
            renderLimpiezas(datos);
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
        tr.innerHTML = `<td>${reg.tipo_banio || ''}</td>` +
                       `<td>${reg.ubicacion || ''}</td>` +
                       `<td>${reg.fecha_inicio || ''}</td>` +
                       `<td>${reg.fecha_fin || ''}</td>`;
        tbody.appendChild(tr);
    });
}

function renderPagos(lista) {
    const tbody = document.querySelector('#tablaPagos tbody');
    tbody.innerHTML = '';
    lista.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.fecha || ''}</td>` +
                       `<td>${p.monto || ''}</td>` +
                       `<td>${p.metodo || ''}</td>`;
        tbody.appendChild(tr);
    });
}

function renderLimpiezas(lista) {
    const tbody = document.querySelector('#tablaLimpiezas tbody');
    tbody.innerHTML = '';
    lista.forEach(l => {
        const tr = document.createElement('tr');
        const remito = l.remito_url ? `<a href="${l.remito_url}" target="_blank">Ver</a>` : '';
        tr.innerHTML = `<td>${l.fecha || l.fecha_hora || ''}</td>` +
                       `<td>${l.observaciones || ''}</td>` +
                       `<td>${remito}</td>`;
        tbody.appendChild(tr);
    });
}

function mostrarSplash(nombre, fechaNac) {
    const splash = document.getElementById('splash');
    const mensaje = document.getElementById('splashMensaje');
    const btn = document.getElementById('splashCerrar');

    const mensajes = [`¡Hola ${nombre}! Bienvenido nuevamente a Portátiles Mercedes.`];
    const hoy = new Date();
    const dia = hoy.getDate();
    const mes = hoy.getMonth() + 1;

    if (fechaNac) {
        const partes = fechaNac.split('-');
        if (partes.length === 3) {
            const d = parseInt(partes[2]);
            const m = parseInt(partes[1]);
            if (d === dia && m === mes) {
                mensajes.push(`¡Feliz cumpleaños, ${nombre}! Te deseamos un gran día. Gracias por confiar en nosotros.`);
            }
        }
    }
    if (dia === 25 && mes === 12) {
        mensajes.push('¡Feliz Navidad! Que pases una jornada llena de paz y alegría.');
    }
    if (dia === 1 && mes === 1) {
        mensajes.push('¡Feliz Año Nuevo! Que este nuevo año venga con grandes logros y buenos momentos.');
    }
    if (dia === 19 && mes === 3) {
        mensajes.push('¡Feliz Día del Padre! Gracias por acompañarnos siempre.');
    }
    if (dia === 20 && mes === 7) {
        mensajes.push('¡Feliz Día del Amigo! Gracias por ser parte de nuestra comunidad.');
    }

    mensaje.innerHTML = mensajes.join('<br>');
    splash.style.display = 'flex';

    btn.addEventListener('click', () => {
        splash.style.display = 'none';
    });

    setTimeout(() => {
        splash.style.display = 'none';
    }, 5000);
}

async function cargarDatosPersonales(email) {
    try {
        const resp = await fetch(`/info_datos_cliente?email=${email}`);
        if (!resp.ok) return;

        const datos = await resp.json();

        document.getElementById("nombre").value = datos.nombre || "";
        document.getElementById("apellido").value = datos.apellido || "";
        document.getElementById("direccion").value = datos.direccion || "";
        document.getElementById("telefono").value = datos.telefono || "";
        document.getElementById("dni").value = datos.dni || "";
        document.getElementById("cuit").value = datos.cuit || "";
        document.getElementById("razon_social").value = datos.razon_social || "";
        document.getElementById("email").value = datos.email || "";

        document.getElementById("botonGuardarDatos").disabled = true;
    } catch (err) {
        console.error("\u274c Error cargando datos:", err);
    }
}

const emailStored = localStorage.getItem("email");
if (emailStored) {
    cargarDatosPersonales(emailStored);
}

async function guardarDatos() {
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
    if (response.ok) {
        alert('Datos guardados correctamente');
        document.getElementById('botonGuardarDatos').disabled = true;
    } else {
        alert('Error al guardar datos: ' + resultado.detail);
    }
}
