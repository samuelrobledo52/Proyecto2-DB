import dotenv from 'dotenv';
import { DataTypes, Sequelize } from 'sequelize';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    dialect: 'postgres',
    logging: false,
  }
);

export const Category = sequelize.define('Category', {
  id_categoria: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(80), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: 'categoria',
  timestamps: false,
});

export const Supplier = sequelize.define('Supplier', {
  id_proveedor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  telefono: { type: DataTypes.STRING(25), allowNull: false },
  correo: { type: DataTypes.STRING(120), allowNull: false },
  direccion: { type: DataTypes.STRING(180), allowNull: false },
}, {
  tableName: 'proveedor',
  timestamps: false,
});

export const Customer = sequelize.define('Customer', {
  id_cliente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  nit: { type: DataTypes.STRING(20), allowNull: false },
  correo: { type: DataTypes.STRING(120), allowNull: false },
  telefono: { type: DataTypes.STRING(25), allowNull: false },
}, {
  tableName: 'cliente',
  timestamps: false,
});

export const Employee = sequelize.define('Employee', {
  id_empleado: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  puesto: { type: DataTypes.STRING(80), allowNull: false },
  correo: { type: DataTypes.STRING(120), allowNull: false },
}, {
  tableName: 'empleado',
  timestamps: false,
});

export const Product = sequelize.define('Product', {
  id_producto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  stock: { type: DataTypes.INTEGER, allowNull: false },
  id_categoria: { type: DataTypes.INTEGER, allowNull: false },
  id_proveedor: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'producto',
  timestamps: false,
});

export const AppUser = sequelize.define('AppUser', {
  id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario: { type: DataTypes.STRING(60), allowNull: false },
  password: { type: DataTypes.STRING(120), allowNull: false },
  rol: { type: DataTypes.STRING(40), allowNull: false },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
}, {
  tableName: 'app_usuario',
  timestamps: false,
});

Product.belongsTo(Category, { foreignKey: 'id_categoria', as: 'categoria' });
Product.belongsTo(Supplier, { foreignKey: 'id_proveedor', as: 'proveedor' });
