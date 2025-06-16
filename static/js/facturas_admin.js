document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tabla-facturas");
  const datos = [
    { id: 1, dato1: "Factura 001", dato2: "Pendiente" },
    { id: 2, dato1: "Factura 002", dato2: "Pagada" }
  ];
  datos.forEach(item => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${item.id}</td>
      <td>${item.dato1}</td>
      <td>${item.dato2}</td>
      <td><button class='btn btn-sm btn-outline-primary'>Ver</button></td>
    `;
    tabla.appendChild(fila);
  });
});
