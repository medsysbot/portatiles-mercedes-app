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
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        if (!ver.ok) throw new Error('Token inválido');
        const info = await ver.json();
        if (!info.valido || info.rol !== 'cliente') {
            window.location.href = '/login';
            return;
        }
        const dni = info.user_id; // asumimos que user_id es el DNI
        const datosCliRes = await fetch(`/info_cliente?dni=${encodeURIComponent(dni)}`);
        let nombre = dni;
        let cumple = null;
        if (datosCliRes.ok) {
            const datosCli = await datosCliRes.json();
            nombre = datosCli.nombre || dni;
            cumple = datosCli.fecha_nacimiento || null;
        }
        document.getElementById('bienvenida').textContent = `Bienvenido ${nombre}`;
        mostrarSplash(nombre, cumple);
        cargarDatos(dni);
    } catch (err) {
        window.location.href = '/login';
    }
});

async function cargarDatos(dni) {
    try {
        const [alqRes, pagRes, limpRes] = await Promise.all([
            fetch(`/alquileres_cliente?dni=${encodeURIComponent(dni)}`),
            fetch(`/pagos_cliente?dni=${encodeURIComponent(dni)}`),
            fetch(`/limpiezas_cliente?dni=${encodeURIComponent(dni)}`)
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
