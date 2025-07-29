// Archivo: robot_pm.js
document.addEventListener('DOMContentLoaded', () => {
    const robot = document.getElementById('widget-robot-pm');
    let coheteTimeout = null, regresoTimeout = null;

    function lanzarCohete() {
        // Quitar clases previas, poner animación de cohete
        robot.classList.remove('cohete-regreso');
        robot.classList.add('cohete-salida');
        // Al terminar la animación de salida, iniciar el regreso
        coheteTimeout = setTimeout(() => {
            robot.classList.remove('cohete-salida');
            robot.classList.add('cohete-regreso');
            // Al terminar el regreso, volver a modo flotante normal
            regresoTimeout = setTimeout(() => {
                robot.classList.remove('cohete-regreso');
                // Repetir el ciclo después de ~90s
                setTimeout(lanzarCohete, 90000);
            }, 2100); // coincide con duración pm-regreso
        }, 1500 + 10000); // 1.5s cohete + 10s fuera de pantalla
    }

    // Lanzar primer cohete después de 90s
    setTimeout(lanzarCohete, 90000);

    // Si recargas página, limpiar timeouts
    window.addEventListener('beforeunload', () => {
        clearTimeout(coheteTimeout);
        clearTimeout(regresoTimeout);
    });
});
