// Funciones para manejar el panel administrativo

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    if (!(await verificarToken(token))) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
        return;
    }

    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
    });

    document.getElementById('aplicarFiltros').addEventListener('click', () => {
        cargarTodo();
    });

    document.getElementById('exportarCsv').addEventListener('click', () => {
        exportarTablaCSV();
    });

    await cargarTodo();
});

async function verificarToken(token) {
    try {
        const resp = await fetch('/verificar_token', {
            method: 'POST',
            body: new URLSearchParams({ token })
        });
        const data = await resp.json();
        return resp.ok && data.valido && data.rol === 'empresa';
    } catch (_) {
        return false;
    }
}

function obtenerFiltros() {
    const dni = document.getElementById('filtroDni').value.trim();
    const desde = document.getElementById('filtroDesde').value;
    const hasta = document.getElementById('filtroHasta').value;
    const filtros = new URLSearchParams();
    filtros.append('token', localStorage.getItem('access_token'));
    if (dni) filtros.append('dni', dni);
    if (desde) filtros.append('desde', desde);
    if (hasta) filtros.append('hasta', hasta);
    return filtros.toString();
}

async function cargarTodo() {
    await Promise.all([
        cargarClientes(),
        cargarAlquileres(),
        cargarVentas(),
        cargarLimpiezas()
    ]);
}

async function cargarClientes() {
    const resp = await fetch(`/admin/clientes?${obtenerFiltros()}`);
    if (!resp.ok) return;
    const lista = await resp.json();
    const tbody = document.querySelector('#tablaClientes tbody');
    tbody.innerHTML = '';
    for (const c of lista) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${c.nombre || ''}</td>` +
            `<td>${c.dni || ''}</td>` +
            `<td>${c.email || ''}</td>` +
            `<td>${c.telefono || ''}</td>` +
            `<td><button data-dni="${c.dni}">Ver perfil</button></td>`;
        tbody.appendChild(tr);
    }
}

async function cargarAlquileres() {
    const resp = await fetch(`/admin/alquileres?${obtenerFiltros()}`);
    if (!resp.ok) return;
    const lista = await resp.json();
    const tbody = document.querySelector('#tablaAlquileres tbody');
    tbody.innerHTML = '';
    for (const a of lista) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${a.tipo_banio || ''}</td>` +
            `<td>${a.ubicacion || ''}</td>` +
            `<td>${a.fecha_inicio || ''}</td>` +
            `<td>${a.fecha_fin || ''}</td>` +
            `<td>${a.estado || ''}</td>`;
        tbody.appendChild(tr);
    }
}

async function cargarVentas() {
    const resp = await fetch(`/admin/ventas?${obtenerFiltros()}`);
    if (!resp.ok) return;
    const lista = await resp.json();
    const tbody = document.querySelector('#tablaVentas tbody');
    tbody.innerHTML = '';
    for (const v of lista) {
        const pdf = v.pdf_url ? `<a href="${v.pdf_url}" target="_blank">Ver PDF</a>` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${pdf}</td>` +
            `<td>${v.created_at || v.fecha || ''}</td>` +
            `<td>${v.total || v.monto || ''}</td>` +
            `<td>${v.cliente_nombre || ''}</td>`;
        tbody.appendChild(tr);
    }
}

async function cargarLimpiezas() {
    const resp = await fetch(`/admin/limpiezas?${obtenerFiltros()}`);
    if (!resp.ok) return;
    const lista = await resp.json();
    const tbody = document.querySelector('#tablaLimpiezas tbody');
    tbody.innerHTML = '';
    for (const l of lista) {
        const remito = l.remito_url ? `<a href="${l.remito_url}" target="_blank">Ver Remito</a>` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${remito}</td>` +
            `<td>${l.bano_id || ''}</td>` +
            `<td>${l.fecha_hora || ''}</td>` +
            `<td>${l.empleado || ''}</td>`;
        tbody.appendChild(tr);
    }
}

function exportarTablaCSV() {
    const secciones = ['tablaClientes', 'tablaAlquileres', 'tablaVentas', 'tablaLimpiezas'];
    let csv = '';
    for (const id of secciones) {
        const tabla = document.getElementById(id);
        if (!tabla) continue;
        for (const row of tabla.rows) {
            const cols = Array.from(row.cells).map(c => '"' + c.innerText.replace(/"/g, '""') + '"');
            csv += cols.join(',') + '\n';
        }
        csv += '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte.csv';
    a.click();
    URL.revokeObjectURL(url);
}
