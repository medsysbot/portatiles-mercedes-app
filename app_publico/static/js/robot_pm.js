function animacionSubidaYCaida() {
    const contenedor = document.getElementById("robot-pm-widget");
    const estela = document.getElementById("robot-estela");

    if (!contenedor || !estela) return;

    // 🔥 Mostrar estela
    estela.style.opacity = "1";

    // Subida rápida
    contenedor.animate([
        { transform: "translateY(0)" },
        { transform: "translateY(-100vh)" }
    ], {
        duration: 400,
        easing: "ease-in"
    });

    // Bajada suave
    setTimeout(() => {
        contenedor.animate([
            { transform: "translateY(-100vh)" },
            { transform: "translateY(0)" }
        ], {
            duration: 3000,
            easing: "ease-out"
        });

        // 🔥 Ocultar estela cuando baja
        estela.style.opacity = "0";
    }, 400);
}
