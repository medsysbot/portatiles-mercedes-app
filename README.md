# Portátiles Mercedes App

**Sistema web y aplicativo completo para la empresa Portátiles Mercedes**, dedicada al alquiler, venta y mantenimiento de baños químicos portátiles.

Este proyecto integra dos grandes áreas:
- Una **página pública institucional** accesible desde cualquier navegador.
- Un **aplicativo privado** con login, para clientes y administradores de la empresa.

---

## Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: FastAPI (Python)
- **Base de datos y almacenamiento**: Supabase
- **Despliegue**: Railway / Codex (entorno virtual)

---

## Estructura general

portatiles-mercedes-app/
│
├── main.py # App principal de FastAPI
├── requirements.txt # Dependencias necesarias
├── README.md # Este archivo
├── public/ # Recursos públicos (HTML, imágenes)
└── app/ # Módulos privados (login, alquiler, etc.)


---

## Funcionalidades

### Parte pública (informativa)

- Página institucional clara y profesional
- Muestra los **servicios ofrecidos**:
  - Alquiler de baños químicos
  - Venta de baños comunes y VIP
  - Servicio de limpieza
- Galería de imágenes realistas (recitales, obras, parques)
- Datos de contacto:
  - **Email**: portatilesmercedes@gmail.com
  - **Teléfono**: 2657-627996
- Sección reservada para incluir más adelante:
  - Explicación técnica sobre el funcionamiento de los baños químicos

---

### Parte privada (aplicativo con login)

#### Roles:
- **Empresa (Administrador)**
  - Gestiona todos los clientes
  - Visualiza ventas, alquileres, pagos
  - Accede a remitos con fotos
  - Ve reportes por cliente, por baño y por fecha

- **Cliente**
  - Visualiza su historial de servicios
  - Consulta remitos de limpieza
  - Recibe alertas y recordatorios

---

## Módulos internos

- **Alquiler de baños**
  - Registro de inicio y fin
  - Datos del cliente, ubicación y tipo de baño

- **Ventas**
  - Integrado al stock
  - Generación automática de PDF de factura

- **Servicio de limpieza**
  - Formulario HTML desde el celular
  - Campos: cliente, baño, empleado, fecha/hora, observaciones, foto del remito
  - La imagen se guarda en bucket Supabase exclusivo del cliente

- **Alertas automáticas**
  - Cumpleaños de clientes
  - Pagos vencidos
  - Próximas limpiezas programadas

- **Débito automático**
  - Activado por defecto
  - Programa cobros mensuales para clientes fijos

---

## Buckets en Supabase

- `remitos-limpieza-[cliente_id]` — Remitos subidos por el personal de limpieza
- `ventas-boletos` — Facturas en PDF generadas por el sistema
- `imagenes-web` — Fotos institucionales que se muestran en la página

---

## Instrucciones para correr localmente

1. Clonar el repositorio:
```bash
git clone https://github.com/medsysbot/portatiles-mercedes-app.git
cd portatiles-mercedes-app
