document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tabla-ia-respuestas");
  const datos = [
    { id: 1, dato1: "Consulta 1", dato2: "OK" },
    { id: 2, dato1: "Consulta 2", dato2: "OK" }
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
