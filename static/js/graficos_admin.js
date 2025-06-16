document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tabla-graficos");
  const datos = [
    { id: 1, dato1: "Gráfico A", dato2: "Listo" },
    { id: 2, dato1: "Gráfico B", dato2: "En proceso" }
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
