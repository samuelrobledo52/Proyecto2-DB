DROP VIEW IF EXISTS vw_ventas_detalladas;
DROP TABLE IF EXISTS detalle_venta CASCADE;
DROP TABLE IF EXISTS venta CASCADE;
DROP TABLE IF EXISTS producto CASCADE;
DROP TABLE IF EXISTS categoria CASCADE;
DROP TABLE IF EXISTS proveedor CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;
DROP TABLE IF EXISTS empleado CASCADE;

CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL
);

CREATE TABLE proveedor (
    id_proveedor SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL UNIQUE,
    telefono VARCHAR(25) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    direccion VARCHAR(180) NOT NULL
);

CREATE TABLE cliente (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    nit VARCHAR(20) NOT NULL UNIQUE,
    correo VARCHAR(120) NOT NULL UNIQUE,
    telefono VARCHAR(25) NOT NULL
);

CREATE TABLE empleado (
    id_empleado SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    puesto VARCHAR(80) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE producto (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    precio NUMERIC(10,2) NOT NULL CHECK (precio > 0),
    stock INT NOT NULL CHECK (stock >= 0),
    id_categoria INT NOT NULL,
    id_proveedor INT NOT NULL,
    CONSTRAINT fk_producto_categoria FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria),
    CONSTRAINT fk_producto_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor)
);

CREATE TABLE venta (
    id_venta SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_cliente INT NOT NULL,
    id_empleado INT NOT NULL,
    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    CONSTRAINT fk_venta_cliente FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente),
    CONSTRAINT fk_venta_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
);

CREATE TABLE detalle_venta (
    id_detalle SERIAL PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario > 0),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT fk_detalle_venta FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

CREATE INDEX idx_producto_nombre ON producto(nombre);
CREATE INDEX idx_venta_fecha ON venta(fecha);
CREATE INDEX idx_detalle_producto ON detalle_venta(id_producto);

CREATE VIEW vw_ventas_detalladas AS
SELECT
    v.id_venta,
    v.fecha,
    c.nombre AS cliente,
    e.nombre AS empleado,
    p.nombre AS producto,
    cat.nombre AS categoria,
    dv.cantidad,
    dv.precio_unitario,
    dv.subtotal,
    v.total
FROM venta v
JOIN cliente c ON v.id_cliente = c.id_cliente
JOIN empleado e ON v.id_empleado = e.id_empleado
JOIN detalle_venta dv ON v.id_venta = dv.id_venta
JOIN producto p ON dv.id_producto = p.id_producto
JOIN categoria cat ON p.id_categoria = cat.id_categoria;
