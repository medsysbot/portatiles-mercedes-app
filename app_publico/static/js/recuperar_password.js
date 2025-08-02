// Archivo: recuperar_password.js
// Proyecto: Portátiles Mercedes

const form = document.getElementById('recuperarForm');
const msg = document.getElementById('msg');
const btn = form?.querySelector('button[type="submit"]');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const email = document.getElementById('email').value.trim();

    if (!email) {
      msg.textContent = "Ingresá tu email";
      return;
    }

    // Deshabilita botón para evitar doble submit
    if (btn) btn.disabled = true;

    try {
      // 1. Mostrar alerta "enviando email"
      if (typeof showAlert === 'function') {
        await showAlert('email-envio', 'Enviando email...', false, 1600);
      }

      // 2. Hacer la petición
      const resp = await fetch('/recuperar_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      // 3. Procesar respuesta
      const data = await resp.json();

      if (resp.ok) {
        form.reset();
        // Mostrar alerta éxito
        if (typeof showAlert === 'function') {
          await showAlert('email-exito', data.mensaje || 'Email enviado', false, 2600);
        }
      } else {
        // Mostrar alerta error
        if (typeof showAlert === 'function') {
          await showAlert('email-error', data.detail || 'Error al enviar el email', false, 2600);
        }
      }
    } catch (err) {
      // Mostrar alerta error de red
      if (typeof showAlert === 'function') {
        await showAlert('email-error', 'Error de conexión', false, 2600);
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}
