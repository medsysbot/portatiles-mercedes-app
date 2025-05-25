document.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const ver = await fetch('/verificar_token', {
            method: 'POST',
            body: new URLSearchParams({ token })
        });
        if (!ver.ok) throw new Error('Token inválido');
        const info = await ver.json();
        if (!info.valido || info.rol !== 'cliente') {
            window.location.href = '/login.html';
            return;
        }
        const dni = info.user_id; // asumimos que user_id es el DNI
        document.getElementById('bienvenida').textContent = `Bienvenido ${dni}`;
        cargarDatos(dni);
    } catch (err) {
        window.location.href = '/login.html';
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
