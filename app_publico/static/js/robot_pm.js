// Archivo: robot_pm.js
document.addEventListener('DOMContentLoaded', () => {
    const robot = document.getElementById('widget-robot-pm');
    let coheteTimeout = null, regresoTimeout = null;

    function lanzarCohete() {
        robot.classList.remove('cohete-regreso');
        robot.classList.add('cohete-salida');
        coheteTimeout = setTimeout(() => {
            robot.classList.remove('cohete-salida');
            robot.classList.add('cohete-regreso');
            regresoTimeout = setTimeout(() => {
                robot.classList.remove('cohete-regreso');
                setTimeout(lanzarCohete, 90000);
            }, 2100);
        }, 1500 + 10000);
    }
    setTimeout(lanzarCohete, 90000);
    window.addEventListener('beforeunload', () => {
        clearTimeout(coheteTimeout);
        clearTimeout(regresoTimeout);
    });

    // ---- MODAL PM ----
    function abrirModalPM() {
        let modal = document.getElementById('modal-pm-widget');
        if (!modal) {
            // Crea el modal sólo si no existe (HTML + CSS básico)
            modal = document.createElement('div');
            modal.id = 'modal-pm-widget';
            modal.innerHTML = `
                <div class="modal-pm-overlay"></div>
                <div class="modal-pm-contenido">
                    <img src="/app_publico/static/icons/modal_pm.png" alt="Modal PM" class="modal-pm-img">
                    <button id="cerrar-modal-pm" class="modal-pm-cerrar">×</button>
                </div>
            `;
            document.body.appendChild(modal);

            // CSS mínimo
            const style = document.createElement('style');
            style.textContent = `
                #modal-pm-widget { position:fixed; z-index:9999; left:0; top:0; width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; }
                .modal-pm-overlay { position:absolute; width:100vw; height:100vh; left:0; top:0; background:rgba(0,0,0,0.75);}
                .modal-pm-contenido { position:relative; z-index:2; display:flex; align-items:center; justify-content:center; }
                .modal-pm-img { display:block; max-width:95vw; max-height:90vh; border-radius:16px; box-shadow:0 8px 32px #000; }
                .modal-pm-cerrar { position:absolute; top:16px; right:18px; font-size:2.2rem; background:rgba(0,0,0,0.4); color:#fff; border:none; border-radius:50%; width:42px; height:42px; cursor:pointer; z-index:3; }
                .modal-pm-cerrar:hover { background:#222; }
            `;
            document.head.appendChild(style);

            // Botón cerrar
            modal.querySelector('#cerrar-modal-pm').onclick = () => {
                modal.remove();
            };
            // Cerrar si toca el overlay
            modal.querySelector('.modal-pm-overlay').onclick = () => {
                modal.remove();
            };
        }
    }

    robot?.addEventListener('click', abrirModalPM);
});
