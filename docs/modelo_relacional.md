# Modelo relacional y normalización

## Modelo relacional

CATEGORIA(id_categoria PK, nombre UNIQUE NOT NULL, descripcion NOT NULL)

PROVEEDOR(id_proveedor PK, nombre UNIQUE NOT NULL, telefono NOT NULL, correo UNIQUE NOT NULL, direccion NOT NULL)

CLIENTE(id_cliente PK, nombre NOT NULL, nit UNIQUE NOT NULL, correo UNIQUE NOT NULL, telefono NOT NULL)

EMPLEADO(id_empleado PK, nombre NOT NULL, puesto NOT NULL, correo UNIQUE NOT NULL)

PRODUCTO(id_producto PK, nombre NOT NULL, precio NOT NULL, stock NOT NULL, id_categoria FK, id_proveedor FK)

VENTA(id_venta PK, fecha NOT NULL, id_cliente FK, id_empleado FK, total NOT NULL)

DETALLE_VENTA(id_detalle PK, id_venta FK, id_producto FK, cantidad NOT NULL, precio_unitario NOT NULL, subtotal NOT NULL)

## Dependencias funcionales principales

- id_categoria → nombre, descripcion
- id_proveedor → nombre, telefono, correo, direccion
- id_cliente → nombre, nit, correo, telefono
- id_empleado → nombre, puesto, correo
- id_producto → nombre, precio, stock, id_categoria, id_proveedor
- id_venta → fecha, id_cliente, id_empleado, total
- id_detalle → id_venta, id_producto, cantidad, precio_unitario, subtotal

## Justificación de normalización hasta 3FN

### Primera forma normal 1FN
Todas las tablas tienen atributos atómicos. No se almacenan listas dentro de una columna. Por ejemplo, los productos vendidos en una venta no se guardan dentro de la tabla venta, sino en detalle_venta.

### Segunda forma normal 2FN
Cada tabla utiliza una llave primaria simple y todos sus atributos dependen completamente de esa llave. En detalle_venta, los datos propios del detalle dependen de id_detalle y no se mezclan datos descriptivos del producto o de la venta.

### Tercera forma normal 3FN
No existen dependencias transitivas entre atributos no clave. Por ejemplo, el nombre de la categoría no se almacena en producto; se referencia mediante id_categoria. De la misma forma, los datos del cliente y empleado no se repiten en venta, sino que se consultan mediante llaves foráneas.

## Índices definidos

- idx_producto_nombre: facilita búsquedas por nombre de producto.
- idx_venta_fecha: mejora reportes filtrados u ordenados por fecha.
- idx_detalle_producto: mejora consultas de ventas por producto.
