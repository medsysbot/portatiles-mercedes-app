const form = document.getElementById("loginForm") || document.getElementById("form-login");
if (form) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const rol = document.getElementById("rol") ? document.getElementById("rol").value.trim() : "";

    const datos = { email, password };
    if (rol) datos.rol = rol;

    if (!email.trim() || !password.trim()) {
        if (typeof showAlert === "function") {
            showAlert('error-validacion', 'Complete todos los campos', false);
        }
        return;
    }

    if (!rol) {
        if (typeof showAlert === "function") {
            showAlert('error-validacion', 'Seleccione un rol válido', false);
        }
        return;
    }

        const start = Date.now();
        if (typeof showAlert === "function") {
            showAlert('cargando-datos', 'Enviando datos...', false);
        }

        fetch("/login", {
            method: "POST",
            body: JSON.stringify(datos),
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(async res => {
            const data = await res.json();
            const delay = Math.max(0, 1600 - (Date.now() - start));
            if (res.ok && data.access_token) {
                setTimeout(() => {
                    if (typeof showAlert === "function") {
                        showAlert('exito-datos', 'Formulario enviado correctamente', false);
                    }
                    localStorage.setItem("access_token", data.access_token);
                    const finalizar = (url) => {
                        setTimeout(() => { window.location.href = url; }, 2600);
                    };

                    if (data.usuario && data.usuario.dni_cuit_cuil) {
                        localStorage.setItem("usuario_obj", JSON.stringify({
                            dni_cuit_cuil: data.usuario.dni_cuit_cuil,
                            email: data.usuario.email,
                            nombre: data.usuario.nombre
                        }));
                        localStorage.setItem("dni_cuit_cuil", data.usuario.dni_cuit_cuil);
                        finalizar("/splash_cliente");
                        return;
                    }

                    if (data.rol && (data.rol === "empleado" || data.rol === "Empleado" || data.rol === "Administrador")) {
                        localStorage.setItem("usuario_obj", JSON.stringify({
                            email: data.email || email,
                            nombre: data.nombre || "",
                            rol: data.rol,
                            id: data.id || ""
                        }));
                        finalizar(data.rol === "Administrador" ? "/splash" : "/splash_empleado");
                        return;
                    }

                    // Si es cliente y NO viene dni_cuit_cuil en la respuesta, intenta obtenerlo
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
                            localStorage.setItem("dni_cuit_cuil", datos.dni_cuit_cuil);
                        } else {
                            localStorage.setItem("usuario_obj", JSON.stringify({
                                email: email,
                                nombre: datos.nombre || ""
                            }));
                        }
                        finalizar("/splash_cliente");
                    })
                    .catch(() => {
                        localStorage.setItem("usuario_obj", JSON.stringify({
                            email: email,
                            nombre: data.nombre || ""
                        }));
                        finalizar("/splash_cliente");
                    });
                }, delay);
            } else {
                setTimeout(() => {
                    if (typeof showAlert === "function") {
                        showAlert('error-datos', data.detail || 'Error al enviar el formulario', false);
                    }
                }, delay);
            }
        })
        .catch(() => {
            const delay = Math.max(0, 1600 - (Date.now() - start));
            setTimeout(() => {
                if (typeof showAlert === "function") {
                    showAlert('error-datos', 'Error al enviar el formulario', false);
                }
            }, delay);
        });
    });
}
