# Proyecto 2 - Sistema de Inventario y Ventas

**Universidad del Valle de Guatemala**  
**Facultad de Ingeniería**  
**Ciencia de la Computación y Tecnologías de la Información**  
**CC3088 - Bases de Datos 1**  
**Ciclo 1, 2026**

**Estudiante:** Samuel Robledo  
**Carné:** 241282  

---

## Descripción del proyecto

Este proyecto consiste en una aplicación web para gestionar el inventario y las ventas de una tienda. El sistema permite administrar categorías y productos, registrar ventas, controlar el stock disponible y visualizar reportes generados a partir de consultas SQL explícitas.

La aplicación fue desarrollada con una arquitectura separada en frontend, backend y base de datos relacional. Toda la infraestructura se levanta mediante Docker Compose, permitiendo ejecutar el proyecto completo con un solo comando.

---

## Tecnologías utilizadas

- **Frontend:** HTML, CSS y JavaScript
- **Backend:** Node.js con Express
- **Base de datos:** PostgreSQL
- **Contenedores:** Docker y Docker Compose
- **Consultas:** SQL explícito, sin ORM

---

## Estructura del proyecto


tienda-proyecto2/
├── backend/
│   ├── src/
│   │   ├── db.js
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
│
├── db/
│   ├── 01_schema.sql
│   └── 02_seed.sql
│
├── docs/
│   ├── diagrama_er.md
│   └── modelo_relacional.md
│
├── frontend/
│   ├── app.js
│   ├── index.html
│   └── styles.css
│
├── .env
├── .env.example
├── docker-compose.yml
└── README.md
Requisitos previos

Para ejecutar el proyecto se necesita tener instalado:

Docker Desktop
Docker Compose

No es necesario instalar PostgreSQL, Node.js ni dependencias manualmente, ya que todo se ejecuta dentro de contenedores.

Variables de entorno

El proyecto utiliza variables de entorno definidas en el archivo .env.

También se incluye un archivo .env.example con las variables necesarias para configurar el proyecto desde cero.

Credenciales utilizadas para la base de datos:

DB_USER=proy2
DB_PASSWORD=secret
DB_NAME=tienda_db
DB_HOST=db
DB_PORT=5432
Cómo ejecutar el proyecto

Desde la carpeta raíz del proyecto, ejecutar:

docker compose up --build

Este comando levanta los siguientes servicios:

Base de datos PostgreSQL
Backend Node.js
Frontend servido con Nginx
Acceso a la aplicación

Una vez levantados los contenedores, abrir en el navegador:

http://localhost:8080

Para verificar el backend directamente:

http://localhost:3000/api/health
Cómo detener el proyecto

Para detener los contenedores desde la terminal:

Ctrl + C

También se puede ejecutar:

docker compose down
Funcionalidades principales
Gestión de inventario

El sistema permite administrar productos y categorías mediante operaciones CRUD desde la interfaz web.

Funcionalidades disponibles:

Crear categorías
Editar categorías
Eliminar categorías
Crear productos
Editar productos
Eliminar productos
Visualizar productos con su categoría y proveedor
Controlar stock disponible
Registro de ventas

La aplicación permite registrar ventas seleccionando:

Cliente
Empleado
Producto
Cantidad vendida

Cuando se registra una venta, el sistema actualiza automáticamente el stock del producto vendido.

Transacción explícita

El registro de ventas utiliza una transacción explícita en el backend.

La lógica contempla:

BEGIN;
COMMIT;
ROLLBACK;

Si la venta se completa correctamente, se confirma la transacción con COMMIT.
Si ocurre un error o no hay stock suficiente, se cancela la operación con ROLLBACK.

Reportes SQL visibles en la interfaz

La aplicación incluye una sección de reportes donde se ejecutan consultas SQL desde el backend y se muestran los resultados directamente en la interfaz.

Reportes incluidos:

Ventas por categoría usando GROUP BY y HAVING
Clientes destacados usando Subquery IN
Productos por proveedor usando Subquery EXISTS
Reporte de stock usando CTE WITH
Reporte de ventas basado en una VIEW
Exportación CSV

El sistema permite exportar un reporte de ventas en formato CSV desde la interfaz web.

Endpoint utilizado:

http://localhost:3000/api/reports/export.csv
Diseño de base de datos

El modelo de datos representa una tienda con las siguientes entidades principales:

Categoría
Producto
Proveedor
Cliente
Empleado
Venta
Detalle de venta

La base de datos incluye:

Llaves primarias
Llaves foráneas
Restricciones NOT NULL
Restricciones UNIQUE
Restricciones CHECK
Índices explícitos con CREATE INDEX
Vista SQL con CREATE VIEW

La documentación del diseño se encuentra en:

docs/diagrama_er.md
docs/modelo_relacional.md
Cumplimiento de rúbrica
Criterio	Ubicación dentro del proyecto
Diagrama ER	docs/diagrama_er.md
Modelo relacional	docs/modelo_relacional.md
Normalización hasta 3FN	docs/modelo_relacional.md
DDL completo	db/01_schema.sql
Datos de prueba	db/02_seed.sql
Índices explícitos	db/01_schema.sql
CRUD de 2 entidades	Categorías y productos en la interfaz
JOINs visibles en UI	Sección de reportes SQL
Subqueries visibles en UI	Reportes Subquery IN y Subquery EXISTS
GROUP BY + HAVING	Reporte de ventas por categoría
CTE WITH	Reporte de stock
VIEW usada por backend	Reporte basado en vista de ventas
Transacción explícita	Registro de ventas en backend
Manejo de errores	Validaciones y mensajes en UI
Docker Compose	docker-compose.yml
Variables de entorno	.env y .env.example
Exportación CSV	Botón Exportar reporte CSV
Endpoints principales del backend
Método	Endpoint	Descripción
GET	/api/health	Verifica conexión con backend y base de datos
GET	/api/categories	Lista categorías
POST	/api/categories	Crea una categoría
PUT	/api/categories/:id	Actualiza una categoría
DELETE	/api/categories/:id	Elimina una categoría
GET	/api/products	Lista productos
POST	/api/products	Crea un producto
PUT	/api/products/:id	Actualiza un producto
DELETE	/api/products/:id	Elimina un producto
POST	/api/sales	Registra una venta con transacción
GET	/api/reports/sales-by-category	Reporte con GROUP BY y HAVING
GET	/api/reports/top-customers	Reporte con Subquery IN
GET	/api/reports/provider-products	Reporte con Subquery EXISTS
GET	/api/reports/stock-cte	Reporte con CTE
GET	/api/reports/view-sales	Reporte usando VIEW
GET	/api/reports/export.csv	Exporta reporte CSV
Notas de implementación
El proyecto no utiliza ORM.
Las consultas a la base de datos se realizan mediante SQL explícito.
La base de datos se inicializa automáticamente al levantar Docker por primera vez.
Los scripts 01_schema.sql y 02_seed.sql crean la estructura y cargan datos de prueba.
El frontend consume el backend mediante peticiones HTTP a localhost:3000.
Comandos útiles

Levantar el proyecto:

docker compose up --build

Detener contenedores:

docker compose down

Ver contenedores activos:

docker compose ps

Reconstruir desde cero:

docker compose down -v
docker compose up --build
Estado final

El proyecto implementa una aplicación web funcional para una tienda, con administración de inventario, registro de ventas, reportes SQL visibles en la interfaz, exportación CSV, base de datos relacional y despliegue completo mediante Docker Compose.
