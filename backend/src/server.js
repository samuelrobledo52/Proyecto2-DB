import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { QueryTypes } from 'sequelize';
import {
  AppUser,
  Category,
  Customer,
  Employee,
  Product,
  Supplier,
  sequelize,
} from './db.js';

const app = express();
const port = Number(process.env.PORT || 3000);

const rolePermissions = {
  admin: ['inventory:write', 'sales:write', 'reports:read', 'catalog:read', 'users:read'],
  inventario: ['inventory:write', 'catalog:read'],
  ventas: ['sales:write', 'catalog:read'],
  reportes: ['reports:read', 'catalog:read'],
  auditor: ['catalog:read', 'reports:read'],
};

const publicUser = (user) => ({
  id_usuario: user.id_usuario,
  usuario: user.usuario,
  rol: user.rol,
  nombre: user.nombre,
  permissions: rolePermissions[user.rol] || [],
});

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Debe iniciar sesion' });
  next();
};

const requirePermission = (permission) => (req, res, next) => {
  const permissions = rolePermissions[req.session.user?.rol] || [];
  if (!permissions.includes(permission)) {
    return res.status(403).json({ error: 'No tiene permiso para realizar esta accion' });
  }
  next();
};

const sendError = (res, error, message = 'Ocurrio un error en el servidor') => {
  console.error(error);
  res.status(500).json({ error: message, detail: error.message });
};

const callProcedure = async (sql, replacements = {}) => {
  const [rows] = await sequelize.query(sql, {
    replacements,
  });
  return Array.isArray(rows) ? rows[0] || {} : rows || {};
};

const productAttributes = [
  'id_producto',
  'nombre',
  'precio',
  'stock',
  'id_categoria',
  'id_proveedor',
];

app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'proyecto-3-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
  },
}));

app.get('/api/health', async (_req, res) => {
  const [result] = await sequelize.query('SELECT NOW() AS fecha_servidor', { type: QueryTypes.SELECT });
  res.json({ status: 'ok', databaseTime: result.fecha_servidor });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    const user = await AppUser.findOne({ where: { usuario, password } });
    if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });
    req.session.user = publicUser(user);
    res.json(req.session.user);
  } catch (error) {
    sendError(res, error, 'No se pudo iniciar sesion');
  }
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  req.session.destroy(() => res.json({ message: 'Sesion cerrada' }));
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.get('/api/categories', requireAuth, requirePermission('catalog:read'), async (_req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id_categoria', 'nombre', 'descripcion'],
      order: [['id_categoria', 'ASC']],
    });
    res.json(categories);
  } catch (error) {
    sendError(res, error, 'No se pudieron cargar las categorias');
  }
});

app.post('/api/categories', requireAuth, requirePermission('inventory:write'), async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre || !descripcion) return res.status(400).json({ error: 'Nombre y descripcion son obligatorios' });
    const result = await callProcedure(
      'CALL sp_crear_categoria(:nombre, :descripcion, NULL)',
      { nombre, descripcion }
    );
    const category = await Category.findByPk(result.o_id_categoria);
    res.status(201).json(category);
  } catch (error) {
    sendError(res, error, 'No se pudo crear la categoria');
  }
});

app.put('/api/categories/:id', requireAuth, requirePermission('inventory:write'), async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const result = await callProcedure(
      'CALL sp_actualizar_categoria(:id, :nombre, :descripcion, NULL)',
      { id: req.params.id, nombre, descripcion }
    );
    if (!result.o_actualizada) return res.status(404).json({ error: 'Categoria no encontrada' });
    const category = await Category.findByPk(req.params.id);
    res.json(category);
  } catch (error) {
    sendError(res, error, 'No se pudo actualizar la categoria');
  }
});

app.delete('/api/categories/:id', requireAuth, requirePermission('inventory:write'), async (req, res) => {
  try {
    const result = await callProcedure('CALL sp_eliminar_categoria(:id, NULL)', { id: req.params.id });
    if (!result.o_eliminada) return res.status(404).json({ error: 'Categoria no encontrada' });
    res.json({ message: 'Categoria eliminada correctamente' });
  } catch (error) {
    res.status(400).json({ error: 'No se puede eliminar una categoria relacionada con productos' });
  }
});

app.get('/api/products', requireAuth, requirePermission('catalog:read'), async (_req, res) => {
  try {
    const products = await Product.findAll({
      attributes: productAttributes,
      include: [
        { model: Category, as: 'categoria', attributes: ['nombre'] },
        { model: Supplier, as: 'proveedor', attributes: ['nombre'] },
      ],
      order: [['id_producto', 'ASC']],
    });
    res.json(products.map((product) => {
      const row = product.get({ plain: true });
      return {
        ...row,
        categoria: row.categoria?.nombre,
        proveedor: row.proveedor?.nombre,
      };
    }));
  } catch (error) {
    sendError(res, error, 'No se pudieron cargar los productos');
  }
});

app.post('/api/products', requireAuth, requirePermission('inventory:write'), async (req, res) => {
  try {
    const { nombre, precio, stock, id_categoria, id_proveedor } = req.body;
    if (!nombre || precio <= 0 || stock < 0 || !id_categoria || !id_proveedor) {
      return res.status(400).json({ error: 'Datos invalidos para crear el producto' });
    }
    const result = await callProcedure(
      'CALL sp_crear_producto(:nombre, :precio, :stock, :id_categoria, :id_proveedor, NULL)',
      { nombre, precio, stock, id_categoria, id_proveedor }
    );
    const product = await Product.findByPk(result.o_id_producto, { attributes: productAttributes });
    res.status(201).json(product);
  } catch (error) {
    sendError(res, error, 'No se pudo crear el producto');
  }
});

app.put('/api/products/:id', requireAuth, requirePermission('inventory:write'), async (req, res) => {
  try {
    const { nombre, precio, stock, id_categoria, id_proveedor } = req.body;
    const result = await callProcedure(
      'CALL sp_actualizar_producto(:id, :nombre, :precio, :stock, :id_categoria, :id_proveedor, NULL)',
      { id: req.params.id, nombre, precio, stock, id_categoria, id_proveedor }
    );
    if (!result.o_actualizado) return res.status(404).json({ error: 'Producto no encontrado' });
    const product = await Product.findByPk(req.params.id, { attributes: productAttributes });
    res.json(product);
  } catch (error) {
    sendError(res, error, 'No se pudo actualizar el producto');
  }
});

app.delete('/api/products/:id', requireAuth, requirePermission('inventory:write'), async (req, res) => {
  try {
    const result = await callProcedure('CALL sp_eliminar_producto(:id, NULL)', { id: req.params.id });
    if (!result.o_eliminado) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ error: 'No se puede eliminar un producto relacionado con ventas' });
  }
});

app.get('/api/suppliers', requireAuth, requirePermission('catalog:read'), async (_req, res) => {
  try {
    const suppliers = await Supplier.findAll({
      attributes: ['id_proveedor', 'nombre'],
      order: [['id_proveedor', 'ASC']],
    });
    res.json(suppliers);
  } catch (error) {
    sendError(res, error, 'No se pudieron cargar los proveedores');
  }
});

app.get('/api/customers', requireAuth, requirePermission('catalog:read'), async (_req, res) => {
  try {
    const customers = await Customer.findAll({
      attributes: ['id_cliente', 'nombre'],
      order: [['id_cliente', 'ASC']],
    });
    res.json(customers);
  } catch (error) {
    sendError(res, error, 'No se pudieron cargar los clientes');
  }
});

app.get('/api/employees', requireAuth, requirePermission('catalog:read'), async (_req, res) => {
  try {
    const employees = await Employee.findAll({
      attributes: ['id_empleado', 'nombre'],
      order: [['id_empleado', 'ASC']],
    });
    res.json(employees);
  } catch (error) {
    sendError(res, error, 'No se pudieron cargar los empleados');
  }
});

app.post('/api/sales', requireAuth, requirePermission('sales:write'), async (req, res) => {
  try {
    const { id_cliente, id_empleado, items } = req.body;
    if (!id_cliente || !id_empleado || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'La venta debe incluir cliente, empleado y productos' });
    }
    const result = await callProcedure(
      'CALL sp_registrar_venta(:id_cliente, :id_empleado, CAST(:items AS JSONB), NULL, NULL)',
      { id_cliente, id_empleado, items: JSON.stringify(items) }
    );
    res.status(201).json({
      message: 'Venta registrada correctamente',
      sale: { id_venta: result.o_id_venta, total: result.o_total },
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'No se pudo registrar la venta' });
  }
});

app.get('/api/reports/sales-by-category', requireAuth, requirePermission('reports:read'), async (_req, res) => {
  try {
    const rows = await sequelize.query('SELECT * FROM fn_reporte_ventas_categoria()', { type: QueryTypes.SELECT });
    res.json(rows);
  } catch (error) {
    sendError(res, error, 'No se pudo generar el reporte por categoria');
  }
});

app.get('/api/reports/top-customers', requireAuth, requirePermission('reports:read'), async (_req, res) => {
  try {
    const rows = await sequelize.query('SELECT * FROM fn_reporte_clientes_destacados()', { type: QueryTypes.SELECT });
    res.json(rows);
  } catch (error) {
    sendError(res, error, 'No se pudo generar el reporte de clientes destacados');
  }
});

app.get('/api/reports/provider-products', requireAuth, requirePermission('reports:read'), async (_req, res) => {
  try {
    const rows = await sequelize.query('SELECT * FROM fn_reporte_productos_proveedor()', { type: QueryTypes.SELECT });
    res.json(rows);
  } catch (error) {
    sendError(res, error, 'No se pudo generar el reporte de proveedores');
  }
});

app.get('/api/reports/stock-cte', requireAuth, requirePermission('reports:read'), async (_req, res) => {
  try {
    const rows = await sequelize.query('SELECT * FROM fn_reporte_stock_cte()', { type: QueryTypes.SELECT });
    res.json(rows);
  } catch (error) {
    sendError(res, error, 'No se pudo generar el reporte con CTE');
  }
});

app.get('/api/reports/view-sales', requireAuth, requirePermission('reports:read'), async (_req, res) => {
  try {
    const rows = await sequelize.query('SELECT * FROM vw_ventas_detalladas ORDER BY fecha DESC LIMIT 50', { type: QueryTypes.SELECT });
    res.json(rows);
  } catch (error) {
    sendError(res, error, 'No se pudo consultar la vista de ventas');
  }
});

app.get('/api/reports/export.csv', requireAuth, requirePermission('reports:read'), async (_req, res) => {
  try {
    const rows = await sequelize.query('SELECT * FROM vw_ventas_detalladas ORDER BY fecha DESC', { type: QueryTypes.SELECT });
    const headers = Object.keys(rows[0] || { reporte: 'sin_datos' });
    const csvRows = rows.map(row => headers.map(h => `"${String(row[h] ?? '').replaceAll('"', '""')}"`).join(','));
    const csv = [headers.join(','), ...csvRows].join('\n');
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('reporte_ventas.csv');
    res.send(csv);
  } catch (error) {
    sendError(res, error, 'No se pudo exportar el reporte');
  }
});

await sequelize.authenticate();

app.listen(port, () => {
  console.log(`Servidor backend escuchando en puerto ${port}`);
});
