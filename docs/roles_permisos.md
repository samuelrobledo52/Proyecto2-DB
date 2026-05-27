# Esquema de roles y permisos

El Proyecto 3 define exactamente cinco roles en PostgreSQL mediante `CREATE ROLE`.
Los permisos se asignan con `GRANT` y se retiran permisos generales con `REVOKE`.

| Rol DBMS | Usuario de prueba | Responsabilidad | Tablas / objetos accesibles | Operaciones |
|---|---|---|---|---|
| `rol_admin` | `admin` | Administracion general | Todas las tablas, secuencias, funciones y procedimientos | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `EXECUTE` |
| `rol_inventario` | `inventario` | Gestion de inventario | `categoria`, `producto`, `proveedor`, `vw_ventas_detalladas` | CRUD en categorias y productos, lectura de proveedores y vista |
| `rol_ventas` | `ventas` | Registro de ventas | `categoria`, `proveedor`, `producto`, `cliente`, `empleado`, `venta`, `detalle_venta` | Lectura de catalogos, insercion de ventas y detalle, actualizacion de stock por procedimiento |
| `rol_reportes` | `reportes` | Analisis comercial | Tablas de catalogo, ventas, detalle y `vw_ventas_detalladas` | `SELECT` y `EXECUTE` sobre funciones de reporte |
| `rol_auditor` | `auditor` | Revision sin cambios | Tablas principales y vista de ventas | Solo `SELECT` |

Todos los usuarios de prueba usan la contrasena `secret` en la pantalla de login.
La conexion de calificacion usa las credenciales obligatorias `proy3 / secret`.
