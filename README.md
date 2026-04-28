# Proyecto 2 - Sistema de Inventario y Ventas

Universidad del Valle de Guatemala  
Facultad de Ingeniería  
CC3088 - Bases de Datos 1  
Ciclo 1, 2026

Autor: Samuel Robledo (241282)

## Descripción general

Este proyecto consiste en una aplicación web para gestionar el inventario y las ventas de una tienda. El sistema permite administrar productos y categorías, registrar ventas, controlar el stock disponible y visualizar reportes construidos con consultas SQL explícitas.

La solución incluye frontend, backend, base de datos relacional PostgreSQL y despliegue mediante Docker Compose.

## Tecnologías utilizadas

- Frontend: HTML, CSS y JavaScript
- Backend: Node.js con Express
- Base de datos: PostgreSQL
- Contenedores: Docker y Docker Compose
- SQL: consultas explícitas mediante el paquete pg, sin ORM

## Estructura del proyecto

```text
.
├── backend
│   ├── Dockerfile
│   ├── package.json
│   └── src
│       ├── db.js
│       └── server.js
├── db
│   ├── 01_schema.sql
│   └── 02_seed.sql
├── docs
│   ├── diagrama_er.md
│   └── modelo_relacional.md
├── frontend
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── docker-compose.yml
├── .env.example
└── README.md
```

## Credenciales de base de datos

El proyecto usa las credenciales requeridas para calificación:

```env
DB_USER=proy2
DB_PASSWORD=secret
```

El archivo `.env.example` contiene todas las variables necesarias. Para ejecutar el proyecto, copiarlo como `.env` si todavía no existe:

```bash
cp .env.example .env
```

## Instrucciones para levantar el proyecto desde cero

Desde la carpeta raíz del proyecto, ejecutar:

```bash
docker compose up --build
```

Luego abrir la aplicación en el navegador:

```text
http://localhost:8080
```

El backend queda disponible en:

```text
http://localhost:3000/api/health
```

Para detener los contenedores:

```bash
docker compose down
```

Para reiniciar completamente la base de datos y volver a cargar los scripts iniciales:

```bash
docker compose down -v
docker compose up --build
```

## Funcionalidades implementadas

### CRUD completo

La interfaz permite crear, consultar, actualizar y eliminar:

1. Categorías
2. Productos

### Registro de ventas

El sistema permite registrar una venta seleccionando cliente, empleado, producto y cantidad. Al confirmar una venta, el backend valida stock, inserta el encabezado de venta, inserta el detalle y actualiza el inventario.

La operación usa transacción explícita con:

```sql
BEGIN;
COMMIT;
ROLLBACK;
```

Si ocurre un error, por ejemplo stock insuficiente, se ejecuta ROLLBACK y la venta no queda registrada parcialmente.

### Reportes visibles en la UI

La sección de reportes incluye:

- Ventas por categoría con JOIN, GROUP BY, HAVING y funciones de agregación.
- Clientes destacados usando subquery con IN.
- Productos por proveedor usando subquery con EXISTS.
- Resumen de stock usando CTE con WITH.
- Reporte de ventas alimentado desde la vista `vw_ventas_detalladas`.

### Exportación

La aplicación permite exportar el reporte de ventas a CSV desde la interfaz.

## Diseño de base de datos

La documentación se encuentra en la carpeta `docs`:

- `docs/diagrama_er.md`: diagrama ER en formato Mermaid.
- `docs/modelo_relacional.md`: modelo relacional, dependencias funcionales y normalización hasta 3FN.

## Scripts de base de datos

Los scripts se ejecutan automáticamente al crear el contenedor de PostgreSQL:

- `db/01_schema.sql`: creación de tablas, llaves primarias, llaves foráneas, restricciones, índices y vista.
- `db/02_seed.sql`: datos de prueba con al menos 25 registros por tabla.

## Consultas SQL destacadas

### JOIN con múltiples tablas

```sql
SELECT p.id_producto, p.nombre, p.precio, p.stock,
       c.nombre AS categoria,
       pr.nombre AS proveedor
FROM producto p
JOIN categoria c ON p.id_categoria = c.id_categoria
JOIN proveedor pr ON p.id_proveedor = pr.id_proveedor;
```

### GROUP BY, HAVING y agregación

```sql
SELECT c.nombre AS categoria,
       SUM(dv.cantidad) AS unidades_vendidas,
       SUM(dv.subtotal) AS total_vendido
FROM detalle_venta dv
JOIN producto p ON dv.id_producto = p.id_producto
JOIN categoria c ON p.id_categoria = c.id_categoria
GROUP BY c.nombre
HAVING SUM(dv.subtotal) > 0;
```

### CTE

```sql
WITH resumen_stock AS (
  SELECT c.nombre AS categoria,
         COUNT(p.id_producto) AS productos,
         SUM(p.stock) AS stock_total,
         AVG(p.stock) AS stock_promedio
  FROM categoria c
  JOIN producto p ON c.id_categoria = p.id_categoria
  GROUP BY c.nombre
)
SELECT * FROM resumen_stock;
```

### VIEW

```sql
CREATE VIEW vw_ventas_detalladas AS
SELECT v.id_venta, v.fecha, c.nombre AS cliente, e.nombre AS empleado,
       p.nombre AS producto, cat.nombre AS categoria,
       dv.cantidad, dv.precio_unitario, dv.subtotal, v.total
FROM venta v
JOIN cliente c ON v.id_cliente = c.id_cliente
JOIN empleado e ON v.id_empleado = e.id_empleado
JOIN detalle_venta dv ON v.id_venta = dv.id_venta
JOIN producto p ON dv.id_producto = p.id_producto
JOIN categoria cat ON p.id_categoria = cat.id_categoria;
```

## Criterios de rúbrica cubiertos

- Diagrama ER documentado.
- Modelo relacional documentado.
- Normalización justificada hasta 3FN.
- DDL con PRIMARY KEY, FOREIGN KEY y NOT NULL.
- Datos de prueba con al menos 25 registros por tabla.
- Índices explícitos con CREATE INDEX.
- Consultas JOIN visibles en UI.
- Subqueries visibles en UI.
- GROUP BY, HAVING y agregaciones visibles en UI.
- CTE visible en UI.
- VIEW usada por el backend para alimentar la UI.
- Transacción explícita con manejo de error y ROLLBACK.
- CRUD completo de 2 entidades.
- Reportes visibles con datos reales.
- Manejo visible de errores para el usuario.
- README con instrucciones funcionales.
- Exportación de reporte a CSV.
