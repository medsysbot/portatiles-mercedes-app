// Script para enviar el formulario de venta
const form = document.getElementById('formVenta');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(form));
  try {
    await fetch('/registrar_venta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
  } catch (_) {
    // Ignorar errores, se cierra igualmente
  }

  if (window.opener) {
    window.opener.location.href = '/ventas';
    window.opener.focus();
  }
  window.close();
});
