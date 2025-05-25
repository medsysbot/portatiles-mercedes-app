// Script para enviar el formulario de venta
const form = document.getElementById('formVenta');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(form));
  try {
    const resp = await fetch('/registrar_venta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const resultado = await resp.json();
    if (resp.ok) {
      alert('Venta registrada con éxito. PDF disponible en: ' + resultado.pdf_url);
      form.reset();
    } else {
      alert('Error: ' + (resultado.detail || 'No se pudo registrar'));
    }
  } catch (_) {
    alert('Error de conexión');
  }
});
