// Archivo: robot_pm.js
document.addEventListener('DOMContentLoaded', () => {
    const robot = document.getElementById('widget-robot-pm');

    // Animaciones robot (flotación, cohete)
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
    // Abrir el modal ya existente en el HTML, NO crear ninguno nuevo
    const modalPM = document.getElementById('modal-pm');
    robot?.addEventListener('click', () => {
        if (modalPM) {
            modalPM.style.display = 'flex';
            // Limpiar estado interno del modal si hace falta
            if (typeof resetModal === "function") {
                resetModal();
            }
        }
    });
});
