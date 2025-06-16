document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tabla-reportes");
  const datos = [
    { id: 1, dato1: "Informe A", dato2: "2024-05-20" },
    { id: 2, dato1: "Informe B", dato2: "2024-06-18" }
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
