# Diagrama ER

Este diagrama representa las entidades principales del sistema, sus atributos, llaves primarias, llaves foráneas y relaciones necesarias para gestionar inventario, proveedores, clientes, empleados y ventas.

```mermaid
erDiagram
    CATEGORIA ||--o{ PRODUCTO : clasifica
    PROVEEDOR ||--o{ PRODUCTO : suministra
    CLIENTE ||--o{ VENTA : realiza
    EMPLEADO ||--o{ VENTA : atiende
    VENTA ||--o{ DETALLE_VENTA : contiene
    PRODUCTO ||--o{ DETALLE_VENTA : vendido_en

    CATEGORIA {
        int id_categoria PK
        varchar nombre UK
        text descripcion
    }

    PROVEEDOR {
        int id_proveedor PK
        varchar nombre UK
        varchar telefono
        varchar correo UK
        varchar direccion
    }

    CLIENTE {
        int id_cliente PK
        varchar nombre
        varchar nit UK
        varchar correo UK
        varchar telefono
    }

    EMPLEADO {
        int id_empleado PK
        varchar nombre
        varchar puesto
        varchar correo UK
    }

    PRODUCTO {
        int id_producto PK
        varchar nombre
        numeric precio
        int stock
        int id_categoria FK
        int id_proveedor FK
    }

    VENTA {
        int id_venta PK
        timestamp fecha
        int id_cliente FK
        int id_empleado FK
        numeric total
    }

    DETALLE_VENTA {
        int id_detalle PK
        int id_venta FK
        int id_producto FK
        int cantidad
        numeric precio_unitario
        numeric subtotal
    }
```
