// Archivo: /app_publico/static/js/robot_pm.js
document.addEventListener("DOMContentLoaded", () => {
  const robot = document.getElementById("robot-pm-img");

  if (!robot) return;

  // Movimiento ocasional (subida rápida o giro)
  const movimientos = ["giro", "subida"];
  setInterval(() => {
    const mov = movimientos[Math.floor(Math.random() * movimientos.length)];
    if (mov === "giro") {
      robot.style.animation = "giroRapido 1s linear";
    } else {
      robot.style.animation = "subidaRapida 1.8s ease-in-out";
    }

    // Restaurar la animación original al terminar
    setTimeout(() => {
      robot.style.animation = "levitar 6s ease-in-out infinite, parpadeoOjos 8s steps(1) infinite";
    }, 1800);
  }, 10000); // Cada 10 segundos
});
