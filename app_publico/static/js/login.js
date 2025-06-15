const form = document.getElementById("loginForm") || document.getElementById("form-login");
if (form) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const datos = {
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
        };

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
                    if (data.rol) {
                        localStorage.setItem("rol", data.rol);
                    }
                    if (data.nombre) {
                        localStorage.setItem("nombre", data.nombre);
                    }
                    window.location.href = "/admin_panel";
                } else {
                    if (errorEl) {
                        errorEl.textContent = data.detail || "Credenciales incorrectas.";
                    }
                }
            })
            .catch(error => {
                console.error("Error en login:", error);
                if (errorEl) errorEl.textContent = "Error al iniciar sesión.";
            });
    });
}
