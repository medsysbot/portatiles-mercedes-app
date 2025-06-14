const form = document.getElementById("loginForm") || document.getElementById("form-login");
if (form) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const datos = {
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
        };

    fetch("/login", {
        method: "POST",
        body: JSON.stringify(datos),
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.access_token) {
            localStorage.setItem("access_token", data.access_token);
            if (data.rol) {
                localStorage.setItem("rol", data.rol);
            }
            if (data.nombre) {
                localStorage.setItem("nombre", data.nombre);
            }
            window.location.href = "/admin_panel";
        } else {
            alert("Credenciales incorrectas.");
        }
    })
    .catch(error => {
        console.error("Error en login:", error);
        alert("Error al iniciar sesión.");
    });
}
