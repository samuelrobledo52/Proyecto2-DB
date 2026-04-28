import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

const sendError = (res, error, message = 'Ocurrió un error en el servidor') => {
  console.error(error);
  res.status(500).json({ error: message, detail: error.message });
};

app.get('/api/health', async (_req, res) => {
  const result = await pool.query('SELECT NOW() AS fecha_servidor');
  res.json({ status: 'ok', databaseTime: result.rows[0].fecha_servidor });
});

app.get('/api/categories', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id_categoria, nombre, descripcion FROM categoria ORDER BY id_categoria');
    res.json(result.rows);
  } catch (error) {
    sendError(res, error, 'No se pudieron cargar las categorías');
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre || !descripcion) return res.status(400).json({ error: 'Nombre y descripción son obligatorios' });
    const sql = 'INSERT INTO categoria(nombre, descripcion) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(sql, [nombre, descripcion]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    sendError(res, error, 'No se pudo crear la categoría');
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const sql = 'UPDATE categoria SET nombre = $1, descripcion = $2 WHERE id_categoria = $3 RETURNING *';
    const result = await pool.query(sql, [nombre, descripcion, req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    sendError(res, error, 'No se pudo actualizar la categoría');
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM categoria WHERE id_categoria = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(400).json({ error: 'No se puede eliminar una categoría relacionada con productos' });
  }
});

app.get('/api/products', async (_req, res) => {
  try {
    const sql = `
      SELECT p.id_producto, p.nombre, p.precio, p.stock,
             p.id_categoria, c.nombre AS categoria,
             p.id_proveedor, pr.nombre AS proveedor
      FROM producto p
      JOIN categoria c ON p.id_categoria = c.id_categoria
      JOIN proveedor pr ON p.id_proveedor = pr.id_proveedor
      ORDER BY p.id_producto
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (error) {
    sendError(res, error, 'No se pudieron cargar los productos');
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { nombre, precio, stock, id_categoria, id_proveedor } = req.body;
    if (!nombre || precio <= 0 || stock < 0 || !id_categoria || !id_proveedor) {
      return res.status(400).json({ error: 'Datos inválidos para crear el producto' });
    }
    const sql = `
      INSERT INTO producto(nombre, precio, stock, id_categoria, id_proveedor)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(sql, [nombre, precio, stock, id_categoria, id_proveedor]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    sendError(res, error, 'No se pudo crear el producto');
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { nombre, precio, stock, id_categoria, id_proveedor } = req.body;
    const sql = `
      UPDATE producto
      SET nombre = $1, precio = $2, stock = $3, id_categoria = $4, id_proveedor = $5
      WHERE id_producto = $6
      RETURNING *
    `;
    const result = await pool.query(sql, [nombre, precio, stock, id_categoria, id_proveedor, req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    sendError(res, error, 'No se pudo actualizar el producto');
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM producto WHERE id_producto = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ error: 'No se puede eliminar un producto relacionado con ventas' });
  }
});

app.get('/api/suppliers', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id_proveedor, nombre FROM proveedor ORDER BY id_proveedor');
    res.json(result.rows);
  } catch (error) {
    sendError(res, error, 'No se pudieron cargar los proveedores');
  }
});

app.get('/api/customers', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id_cliente, nombre FROM cliente ORDER BY id_cliente');
    res.json(result.rows);
  } catch (error) {
    sendError(res, error, 'No se pudieron cargar los clientes');
  }
});

app.get('/api/employees', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id_empleado, nombre FROM empleado ORDER BY id_empleado');
    res.json(result.rows);
  } catch (error) {
    sendError(res, error, 'No se pudieron cargar los empleados');
  }
});

app.post('/api/sales', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id_cliente, id_empleado, items } = req.body;
    if (!id_cliente || !id_empleado || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'La venta debe incluir cliente, empleado y productos' });
    }

    await client.query('BEGIN');

    let total = 0;
    const preparedItems = [];

    for (const item of items) {
      const productResult = await client.query(
        'SELECT id_producto, precio, stock FROM producto WHERE id_producto = $1 FOR UPDATE',
        [item.id_producto]
      );
      if (productResult.rowCount === 0) throw new Error('Producto no encontrado');
      const product = productResult.rows[0];
      if (product.stock < item.cantidad) throw new Error('Stock insuficiente para completar la venta');

      const subtotal = Number(product.precio) * Number(item.cantidad);
      total += subtotal;
      preparedItems.push({ ...item, precio_unitario: product.precio, subtotal });
    }

    const saleResult = await client.query(
      'INSERT INTO venta(id_cliente, id_empleado, total) VALUES ($1, $2, $3) RETURNING id_venta, fecha, total',
      [id_cliente, id_empleado, total]
    );
    const sale = saleResult.rows[0];

    for (const item of preparedItems) {
      await client.query(
        `INSERT INTO detalle_venta(id_venta, id_producto, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [sale.id_venta, item.id_producto, item.cantidad, item.precio_unitario, item.subtotal]
      );
      await client.query(
        'UPDATE producto SET stock = stock - $1 WHERE id_producto = $2',
        [item.cantidad, item.id_producto]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Venta registrada correctamente', sale });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message || 'No se pudo registrar la venta' });
  } finally {
    client.release();
  }
});

app.get('/api/reports/sales-by-category', async (_req, res) => {
  try {
    const sql = `
      SELECT c.nombre AS categoria,
             SUM(dv.cantidad) AS unidades_vendidas,
             SUM(dv.subtotal) AS total_vendido
      FROM detalle_venta dv
      JOIN producto p ON dv.id_producto = p.id_producto
      JOIN categoria c ON p.id_categoria = c.id_categoria
      GROUP BY c.nombre
      HAVING SUM(dv.subtotal) > 0
      ORDER BY total_vendido DESC
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (error) {
    sendError(res, error, 'No se pudo generar el reporte por categoría');
  }
});

app.get('/api/reports/top-customers', async (_req, res) => {
  try {
    const sql = `
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
      ORDER BY total_comprado DESC
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (error) {
    sendError(res, error, 'No se pudo generar el reporte de clientes destacados');
  }
});

app.get('/api/reports/provider-products', async (_req, res) => {
  try {
    const sql = `
      SELECT pr.nombre AS proveedor, p.nombre AS producto, p.stock
      FROM proveedor pr
      JOIN producto p ON pr.id_proveedor = p.id_proveedor
      WHERE EXISTS (
        SELECT 1 FROM producto px WHERE px.id_proveedor = pr.id_proveedor AND px.stock > 0
      )
      ORDER BY pr.nombre, p.nombre
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (error) {
    sendError(res, error, 'No se pudo generar el reporte de proveedores');
  }
});

app.get('/api/reports/stock-cte', async (_req, res) => {
  try {
    const sql = `
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
      ORDER BY stock_total ASC
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (error) {
    sendError(res, error, 'No se pudo generar el reporte con CTE');
  }
});

app.get('/api/reports/view-sales', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vw_ventas_detalladas ORDER BY fecha DESC LIMIT 50');
    res.json(result.rows);
  } catch (error) {
    sendError(res, error, 'No se pudo consultar la vista de ventas');
  }
});

app.get('/api/reports/export.csv', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vw_ventas_detalladas ORDER BY fecha DESC');
    const headers = Object.keys(result.rows[0] || { reporte: 'sin_datos' });
    const rows = result.rows.map(row => headers.map(h => `"${String(row[h] ?? '').replaceAll('"', '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('reporte_ventas.csv');
    res.send(csv);
  } catch (error) {
    sendError(res, error, 'No se pudo exportar el reporte');
  }
});

app.listen(port, () => {
  console.log(`Servidor backend escuchando en puerto ${port}`);
});
