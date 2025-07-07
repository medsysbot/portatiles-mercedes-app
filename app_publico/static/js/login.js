const form = document.getElementById("loginForm") || document.getElementById("form-login");
if (form) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const rol = document.getElementById("rol") ? document.getElementById("rol").value.trim() : "";

        const datos = { email, password };
        if (rol) datos.rol = rol;

        const errorEl = document.getElementById("errorMsg");
        if (errorEl) errorEl.textContent = "";

        fetch("/login", {
            method: "POST",
            body: JSON.stringify(datos),
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(async res => {
            const data = await res.json();
            if (res.ok && data.access_token) {
                localStorage.setItem("access_token", data.access_token);

                if (data.usuario && data.usuario.dni_cuit_cuil) {
                    localStorage.setItem("usuario_obj", JSON.stringify({
                        dni_cuit_cuil: data.usuario.dni_cuit_cuil,
                        email: data.usuario.email,
                        nombre: data.usuario.nombre
                    }));
                    window.location.href = "/cliente/panel";
                    return;
                }

                if (data.rol && (data.rol === "empleado" || data.rol === "Empleado" || data.rol === "Administrador")) {
                    localStorage.setItem("usuario_obj", JSON.stringify({
                        email: data.email || email,
                        nombre: data.nombre || "",
                        rol: data.rol,
                        id: data.id || ""
                    }));
                    if (data.rol === "Administrador") {
                        window.location.href = "/splash";
                    } else {
                        window.location.href = "/empleado/panel";
                    }
                    return;
                }

                // Si es cliente y NO viene dni_cuit_cuil en la respuesta, lo busca por API
                fetch(`/clientes/datos_personales_api?email=${encodeURIComponent(email)}`, {
                    headers: { "Authorization": "Bearer " + data.access_token }
                })
                .then(r2 => r2.json())
                .then(datos => {
                    if (datos.dni_cuit_cuil) {
                        localStorage.setItem("usuario_obj", JSON.stringify({
                            dni_cuit_cuil: datos.dni_cuit_cuil,
                            email: datos.email,
                            nombre: datos.nombre
                        }));
                        window.location.href = "/cliente/panel";
                    } else {
                        if (errorEl) errorEl.textContent = "No se pudo recuperar los datos del cliente.";
                    }
                })
                .catch(() => {
                    if (errorEl) errorEl.textContent = "Error al recuperar datos del cliente.";
                });

            } else {
                if (errorEl) {
                    errorEl.textContent = data.detail || "Credenciales incorrectas.";
                }
            }
        })
        .catch(error => {
            if (errorEl) errorEl.textContent = "Error al iniciar sesión.";
        });
    });
}
