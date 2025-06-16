document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tabla-ia-clasificados");
  const datos = [
    { id: 1, dato1: "Aviso 1", dato2: "Publicado" },
    { id: 2, dato1: "Aviso 2", dato2: "Borrador" }
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
