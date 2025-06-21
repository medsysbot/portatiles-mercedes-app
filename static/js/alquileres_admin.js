document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.querySelector("#tablaAlquileres tbody");
  const datos = [
    {
      numero: "B001",
      cliente: "Cliente A - 12345678",
      direccion: "Calle 1",
      inicio: "2024-05-01",
      fin: "2024-06-01",
      observaciones: "Contrato anual"
    },
    {
      numero: "B002",
      cliente: "Cliente B - 23456789",
      direccion: "Calle 2",
      inicio: "2024-06-10",
      fin: "2024-07-10",
      observaciones: "Pendiente de firma"
    }
  ];

  datos.forEach((item) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${item.numero}</td>
      <td>${item.cliente}</td>
      <td>${item.direccion}</td>
      <td>${item.inicio}</td>
      <td>${item.fin}</td>
      <td>${item.observaciones}</td>
      <td><button class='btn btn-danger btn-sm'>Eliminar</button></td>
    `;
    tabla.appendChild(fila);
  });
});
