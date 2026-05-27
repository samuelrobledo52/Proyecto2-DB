DROP VIEW IF EXISTS vw_ventas_detalladas;
DROP FUNCTION IF EXISTS fn_reporte_stock_cte();
DROP FUNCTION IF EXISTS fn_reporte_productos_proveedor();
DROP FUNCTION IF EXISTS fn_reporte_clientes_destacados();
DROP FUNCTION IF EXISTS fn_reporte_ventas_categoria();
DROP PROCEDURE IF EXISTS sp_registrar_venta(INT, INT, JSONB);
DROP PROCEDURE IF EXISTS sp_eliminar_producto(INT);
DROP PROCEDURE IF EXISTS sp_actualizar_producto(INT, VARCHAR, NUMERIC, INT, INT, INT);
DROP PROCEDURE IF EXISTS sp_crear_producto(VARCHAR, NUMERIC, INT, INT, INT);
DROP PROCEDURE IF EXISTS sp_eliminar_categoria(INT);
DROP PROCEDURE IF EXISTS sp_actualizar_categoria(INT, VARCHAR, TEXT);
DROP PROCEDURE IF EXISTS sp_crear_categoria(VARCHAR, TEXT);
DROP TABLE IF EXISTS detalle_venta CASCADE;
DROP TABLE IF EXISTS venta CASCADE;
DROP TABLE IF EXISTS producto CASCADE;
DROP TABLE IF EXISTS app_usuario CASCADE;
DROP TABLE IF EXISTS categoria CASCADE;
DROP TABLE IF EXISTS proveedor CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;
DROP TABLE IF EXISTS empleado CASCADE;

DROP ROLE IF EXISTS rol_admin;
DROP ROLE IF EXISTS rol_inventario;
DROP ROLE IF EXISTS rol_ventas;
DROP ROLE IF EXISTS rol_reportes;
DROP ROLE IF EXISTS rol_auditor;

CREATE ROLE rol_admin;
CREATE ROLE rol_inventario;
CREATE ROLE rol_ventas;
CREATE ROLE rol_reportes;
CREATE ROLE rol_auditor;

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

CREATE TABLE app_usuario (
    id_usuario SERIAL PRIMARY KEY,
    usuario VARCHAR(60) NOT NULL UNIQUE,
    password VARCHAR(120) NOT NULL,
    rol VARCHAR(40) NOT NULL CHECK (rol IN ('admin', 'inventario', 'ventas', 'reportes', 'auditor')),
    nombre VARCHAR(120) NOT NULL
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

CREATE OR REPLACE PROCEDURE sp_crear_categoria(
    IN p_nombre VARCHAR,
    IN p_descripcion TEXT,
    OUT o_id_categoria INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows INT;
BEGIN
    INSERT INTO categoria(nombre, descripcion)
    VALUES (p_nombre, p_descripcion)
    RETURNING id_categoria INTO o_id_categoria;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_actualizar_categoria(
    IN p_id_categoria INT,
    IN p_nombre VARCHAR,
    IN p_descripcion TEXT,
    OUT o_actualizada BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows INT;
BEGIN
    UPDATE categoria
    SET nombre = p_nombre,
        descripcion = p_descripcion
    WHERE id_categoria = p_id_categoria;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    o_actualizada := v_rows > 0;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_eliminar_categoria(
    IN p_id_categoria INT,
    OUT o_eliminada BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows INT;
BEGIN
    DELETE FROM categoria
    WHERE id_categoria = p_id_categoria;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    o_eliminada := v_rows > 0;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_crear_producto(
    IN p_nombre VARCHAR,
    IN p_precio NUMERIC,
    IN p_stock INT,
    IN p_id_categoria INT,
    IN p_id_proveedor INT,
    OUT o_id_producto INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows INT;
BEGIN
    INSERT INTO producto(nombre, precio, stock, id_categoria, id_proveedor)
    VALUES (p_nombre, p_precio, p_stock, p_id_categoria, p_id_proveedor)
    RETURNING id_producto INTO o_id_producto;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_actualizar_producto(
    IN p_id_producto INT,
    IN p_nombre VARCHAR,
    IN p_precio NUMERIC,
    IN p_stock INT,
    IN p_id_categoria INT,
    IN p_id_proveedor INT,
    OUT o_actualizado BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows INT;
BEGIN
    UPDATE producto
    SET nombre = p_nombre,
        precio = p_precio,
        stock = p_stock,
        id_categoria = p_id_categoria,
        id_proveedor = p_id_proveedor
    WHERE id_producto = p_id_producto;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    o_actualizado := v_rows > 0;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_eliminar_producto(
    IN p_id_producto INT,
    OUT o_eliminado BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows INT;
BEGIN
    DELETE FROM producto
    WHERE id_producto = p_id_producto;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    o_eliminado := v_rows > 0;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_registrar_venta(
    IN p_id_cliente INT,
    IN p_id_empleado INT,
    IN p_items JSONB,
    OUT o_id_venta INT,
    OUT o_total NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_item JSONB;
    v_producto RECORD;
    v_cantidad INT;
BEGIN
    o_total := 0;

    IF jsonb_array_length(p_items) = 0 THEN
        ROLLBACK;
        RAISE EXCEPTION 'La venta debe tener al menos un producto';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_cantidad := (v_item ->> 'cantidad')::INT;

        SELECT id_producto, precio, stock
        INTO v_producto
        FROM producto
        WHERE id_producto = (v_item ->> 'id_producto')::INT
        FOR UPDATE;

        IF NOT FOUND THEN
            ROLLBACK;
            RAISE EXCEPTION 'Producto no encontrado';
        END IF;

        IF v_cantidad <= 0 OR v_producto.stock < v_cantidad THEN
            ROLLBACK;
            RAISE EXCEPTION 'Stock insuficiente para completar la venta';
        END IF;

        o_total := o_total + (v_producto.precio * v_cantidad);
    END LOOP;

    INSERT INTO venta(id_cliente, id_empleado, total)
    VALUES (p_id_cliente, p_id_empleado, o_total)
    RETURNING id_venta INTO o_id_venta;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_cantidad := (v_item ->> 'cantidad')::INT;

        SELECT id_producto, precio, stock
        INTO v_producto
        FROM producto
        WHERE id_producto = (v_item ->> 'id_producto')::INT
        FOR UPDATE;

        INSERT INTO detalle_venta(id_venta, id_producto, cantidad, precio_unitario, subtotal)
        VALUES (
            o_id_venta,
            v_producto.id_producto,
            v_cantidad,
            v_producto.precio,
            v_producto.precio * v_cantidad
        );

        UPDATE producto
        SET stock = stock - v_cantidad
        WHERE id_producto = v_producto.id_producto;
    END LOOP;

    COMMIT;
END;
$$;

CREATE OR REPLACE FUNCTION fn_reporte_ventas_categoria()
RETURNS TABLE(categoria VARCHAR, unidades_vendidas BIGINT, total_vendido NUMERIC)
LANGUAGE sql
AS $$
    SELECT c.nombre AS categoria,
           SUM(dv.cantidad) AS unidades_vendidas,
           SUM(dv.subtotal) AS total_vendido
    FROM detalle_venta dv
    JOIN producto p ON dv.id_producto = p.id_producto
    JOIN categoria c ON p.id_categoria = c.id_categoria
    GROUP BY c.nombre
    HAVING SUM(dv.subtotal) > 0
    ORDER BY total_vendido DESC;
$$;

CREATE OR REPLACE FUNCTION fn_reporte_clientes_destacados()
RETURNS TABLE(cliente VARCHAR, total_comprado NUMERIC)
LANGUAGE sql
AS $$
    SELECT c.nombre AS cliente, SUM(v.total) AS total_comprado
    FROM cliente c
    JOIN venta v ON c.id_cliente = v.id_cliente
    WHERE c.id_cliente IN (
        SELECT id_cliente
        FROM venta
        GROUP BY id_cliente
        HAVING SUM(total) >= (SELECT AVG(total) FROM venta)
    )
    GROUP BY c.nombre
    ORDER BY total_comprado DESC;
$$;

CREATE OR REPLACE FUNCTION fn_reporte_productos_proveedor()
RETURNS TABLE(proveedor VARCHAR, producto VARCHAR, stock INT)
LANGUAGE sql
AS $$
    SELECT pr.nombre AS proveedor, p.nombre AS producto, p.stock
    FROM proveedor pr
    JOIN producto p ON pr.id_proveedor = p.id_proveedor
    WHERE EXISTS (
        SELECT 1 FROM producto px WHERE px.id_proveedor = pr.id_proveedor AND px.stock > 0
    )
    ORDER BY pr.nombre, p.nombre;
$$;

CREATE OR REPLACE FUNCTION fn_reporte_stock_cte()
RETURNS TABLE(categoria VARCHAR, productos BIGINT, stock_total BIGINT, stock_promedio NUMERIC)
LANGUAGE sql
AS $$
    WITH resumen_stock AS (
        SELECT c.nombre AS categoria,
               COUNT(p.id_producto) AS productos,
               SUM(p.stock) AS stock_total,
               AVG(p.stock) AS stock_promedio
        FROM categoria c
        JOIN producto p ON c.id_categoria = p.id_categoria
        GROUP BY c.nombre
    )
    SELECT * FROM resumen_stock
    ORDER BY stock_total ASC;
$$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO rol_admin, rol_inventario, rol_ventas, rol_reportes, rol_auditor;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rol_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO rol_admin;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public TO rol_admin;

GRANT SELECT, INSERT, UPDATE, DELETE ON categoria, producto TO rol_inventario;
GRANT SELECT ON proveedor, vw_ventas_detalladas TO rol_inventario;
GRANT USAGE, SELECT ON SEQUENCE categoria_id_categoria_seq, producto_id_producto_seq TO rol_inventario;
GRANT EXECUTE ON PROCEDURE sp_crear_categoria(VARCHAR, TEXT) TO rol_inventario;
GRANT EXECUTE ON PROCEDURE sp_actualizar_categoria(INT, VARCHAR, TEXT) TO rol_inventario;
GRANT EXECUTE ON PROCEDURE sp_eliminar_categoria(INT) TO rol_inventario;
GRANT EXECUTE ON PROCEDURE sp_crear_producto(VARCHAR, NUMERIC, INT, INT, INT) TO rol_inventario;
GRANT EXECUTE ON PROCEDURE sp_actualizar_producto(INT, VARCHAR, NUMERIC, INT, INT, INT) TO rol_inventario;
GRANT EXECUTE ON PROCEDURE sp_eliminar_producto(INT) TO rol_inventario;

GRANT SELECT ON categoria, proveedor, producto, cliente, empleado TO rol_ventas;
GRANT INSERT ON venta, detalle_venta TO rol_ventas;
GRANT UPDATE(stock) ON producto TO rol_ventas;
GRANT USAGE, SELECT ON SEQUENCE venta_id_venta_seq, detalle_venta_id_detalle_seq TO rol_ventas;
GRANT EXECUTE ON PROCEDURE sp_registrar_venta(INT, INT, JSONB) TO rol_ventas;

GRANT SELECT ON categoria, proveedor, producto, cliente, empleado, venta, detalle_venta, vw_ventas_detalladas TO rol_reportes;
GRANT EXECUTE ON FUNCTION fn_reporte_ventas_categoria() TO rol_reportes;
GRANT EXECUTE ON FUNCTION fn_reporte_clientes_destacados() TO rol_reportes;
GRANT EXECUTE ON FUNCTION fn_reporte_productos_proveedor() TO rol_reportes;
GRANT EXECUTE ON FUNCTION fn_reporte_stock_cte() TO rol_reportes;

GRANT SELECT ON categoria, proveedor, producto, cliente, empleado, venta, detalle_venta, vw_ventas_detalladas TO rol_auditor;

GRANT rol_admin, rol_inventario, rol_ventas, rol_reportes, rol_auditor TO proy3;
