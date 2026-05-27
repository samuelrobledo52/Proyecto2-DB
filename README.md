# Proyecto 3 - Sistema seguro de inventario y ventas

**Universidad del Valle de Guatemala**  
**CC3088 - Bases de Datos 1**  
**Estudiante:** Samuel Robledo  
**Carne:** 241282

## Descripcion

Continuacion del Proyecto 2. La aplicacion web de inventario y ventas ahora incluye autenticacion con sesion, proteccion de rutas y vistas por rol, cinco roles reales en PostgreSQL, stored procedures invocados desde el backend y uso obligatorio de ORM mediante Sequelize.

## Tecnologias

- Frontend: HTML, CSS y JavaScript
- Backend: Node.js, Express, express-session y Sequelize
- Base de datos: PostgreSQL
- Infraestructura: Docker Compose

## Ejecucion desde cero

Las credenciales obligatorias para calificacion son:

```env
DB_USER=proy3
DB_PASSWORD=secret
DB_NAME=tienda_proy3
```

Levantar el proyecto:

```bash
docker compose up --build
```

Si ya existia un volumen de una version anterior:

```bash
docker compose down -v
docker compose up --build
```

Accesos:

- Frontend: `http://localhost:8080`
- Backend health: `http://localhost:3000/api/health`

## Usuarios de prueba

Todos usan password `secret`.

| Usuario | Rol de aplicacion | Rol DBMS relacionado |
|---|---|---|
| `admin` | `admin` | `rol_admin` |
| `inventario` | `inventario` | `rol_inventario` |
| `ventas` | `ventas` | `rol_ventas` |
| `reportes` | `reportes` | `rol_reportes` |
| `auditor` | `auditor` | `rol_auditor` |

## Roles en PostgreSQL

El archivo `db/01_schema.sql` define exactamente cinco roles con `CREATE ROLE`:

- `rol_admin`
- `rol_inventario`
- `rol_ventas`
- `rol_reportes`
- `rol_auditor`

Tambien revoca permisos generales con `REVOKE` y asigna permisos granulares con `GRANT`.
La documentacion completa esta en `docs/roles_permisos.md`.

## Stored procedures y funciones

Procedimientos invocados desde el backend:

- `sp_crear_categoria`
- `sp_actualizar_categoria`
- `sp_eliminar_categoria`
- `sp_crear_producto`
- `sp_actualizar_producto`
- `sp_eliminar_producto`
- `sp_registrar_venta`

`sp_registrar_venta` recibe parametros de entrada y salida, bloquea productos con `FOR UPDATE`, calcula total, registra detalle, actualiza stock y usa `COMMIT` o `ROLLBACK`.

Funciones de reporte:

- `fn_reporte_ventas_categoria`
- `fn_reporte_clientes_destacados`
- `fn_reporte_productos_proveedor`
- `fn_reporte_stock_cte`

## ORM

El backend configura Sequelize en `backend/src/db.js` y define modelos para:

- `Category`
- `Product`
- `Supplier`
- `Customer`
- `Employee`
- `AppUser`

Las rutas CRUD y de catalogos usan Sequelize para consultar modelos y `sequelize.query` para invocar stored procedures y reportes SQL avanzados.

## Endpoints principales

| Metodo | Endpoint | Proteccion |
|---|---|---|
| POST | `/api/auth/login` | Publico |
| POST | `/api/auth/logout` | Sesion |
| GET | `/api/auth/me` | Publico |
| GET | `/api/categories` | `catalog:read` |
| POST/PUT/DELETE | `/api/categories` | `inventory:write` |
| GET | `/api/products` | `catalog:read` |
| POST/PUT/DELETE | `/api/products` | `inventory:write` |
| POST | `/api/sales` | `sales:write` |
| GET | `/api/reports/*` | `reports:read` |

## Estructura relevante

```text
backend/src/db.js          Modelos Sequelize
backend/src/server.js      Sesiones, permisos, rutas y llamadas a procedures
db/01_schema.sql           DDL, roles, permisos, procedures y funciones
db/02_seed.sql             Datos de prueba y usuarios por rol
docs/roles_permisos.md     Documentacion de roles
frontend/                  UI protegida por rol
docker-compose.yml         PostgreSQL, backend y frontend
```
