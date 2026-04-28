const API = 'http://localhost:3000/api';

const request = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
};

const renderTable = (elementId, rows, actions = null) => {
  const table = document.getElementById(elementId);
  if (!rows.length) {
    table.innerHTML = '<tr><td>No hay datos disponibles</td></tr>';
    return;
  }
  const headers = Object.keys(rows[0]);
  table.innerHTML = `
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}${actions ? '<th>Acciones</th>' : ''}</tr></thead>
    <tbody>
      ${rows.map(row => `
        <tr>
          ${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}
          ${actions ? `<td>${actions(row)}</td>` : ''}
        </tr>
      `).join('')}
    </tbody>
  `;
};

const loadHealth = async () => {
  try {
    const data = await request('/health');
    document.getElementById('health').textContent = `Conexión activa con backend y base de datos. Hora DB: ${new Date(data.databaseTime).toLocaleString()}`;
  } catch (error) {
    document.getElementById('health').textContent = 'No se pudo conectar con el backend.';
  }
};

const fillSelect = (id, rows, valueKey, textKey) => {
  const select = document.getElementById(id);
  select.innerHTML = rows.map(row => `<option value="${row[valueKey]}">${row[textKey]}</option>`).join('');
};

const loadCategories = async () => {
  const categories = await request('/categories');
  fillSelect('productCategory', categories, 'id_categoria', 'nombre');
  renderTable('categoriesTable', categories, row => `
    <button class="button secondary" onclick='editCategory(${JSON.stringify(row)})'>Editar</button>
    <button class="button danger" onclick='deleteCategory(${row.id_categoria})'>Eliminar</button>
  `);
};

const loadProducts = async () => {
  const products = await request('/products');
  fillSelect('saleProduct', products, 'id_producto', 'nombre');
  renderTable('productsTable', products, row => `
    <button class="button secondary" onclick='editProduct(${JSON.stringify(row)})'>Editar</button>
    <button class="button danger" onclick='deleteProduct(${row.id_producto})'>Eliminar</button>
  `);
};

const loadCatalogs = async () => {
  const [suppliers, customers, employees] = await Promise.all([
    request('/suppliers'),
    request('/customers'),
    request('/employees'),
  ]);
  fillSelect('productSupplier', suppliers, 'id_proveedor', 'nombre');
  fillSelect('saleCustomer', customers, 'id_cliente', 'nombre');
  fillSelect('saleEmployee', employees, 'id_empleado', 'nombre');
};

window.editCategory = (row) => {
  document.getElementById('categoryId').value = row.id_categoria;
  document.getElementById('categoryName').value = row.nombre;
  document.getElementById('categoryDescription').value = row.descripcion;
};

window.deleteCategory = async (id) => {
  try {
    await request(`/categories/${id}`, { method: 'DELETE' });
    await loadCategories();
  } catch (error) {
    alert(error.message);
  }
};

window.editProduct = (row) => {
  document.getElementById('productId').value = row.id_producto;
  document.getElementById('productName').value = row.nombre;
  document.getElementById('productPrice').value = row.precio;
  document.getElementById('productStock').value = row.stock;
  document.getElementById('productCategory').value = row.id_categoria;
  document.getElementById('productSupplier').value = row.id_proveedor;
};

window.deleteProduct = async (id) => {
  try {
    await request(`/products/${id}`, { method: 'DELETE' });
    await loadProducts();
  } catch (error) {
    alert(error.message);
  }
};

document.getElementById('categoryForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.getElementById('categoryId').value;
  const body = JSON.stringify({
    nombre: document.getElementById('categoryName').value,
    descripcion: document.getElementById('categoryDescription').value,
  });
  try {
    await request(id ? `/categories/${id}` : '/categories', { method: id ? 'PUT' : 'POST', body });
    event.target.reset();
    document.getElementById('categoryId').value = '';
    await loadCategories();
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById('productForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.getElementById('productId').value;
  const body = JSON.stringify({
    nombre: document.getElementById('productName').value,
    precio: Number(document.getElementById('productPrice').value),
    stock: Number(document.getElementById('productStock').value),
    id_categoria: Number(document.getElementById('productCategory').value),
    id_proveedor: Number(document.getElementById('productSupplier').value),
  });
  try {
    await request(id ? `/products/${id}` : '/products', { method: id ? 'PUT' : 'POST', body });
    event.target.reset();
    document.getElementById('productId').value = '';
    await loadProducts();
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById('saleForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = document.getElementById('saleMessage');
  try {
    const data = await request('/sales', {
      method: 'POST',
      body: JSON.stringify({
        id_cliente: Number(document.getElementById('saleCustomer').value),
        id_empleado: Number(document.getElementById('saleEmployee').value),
        items: [{
          id_producto: Number(document.getElementById('saleProduct').value),
          cantidad: Number(document.getElementById('saleQuantity').value),
        }],
      }),
    });
    message.textContent = `${data.message}. Total: Q${Number(data.sale.total).toFixed(2)}`;
    message.style.color = '#166534';
    await loadProducts();
  } catch (error) {
    message.textContent = error.message;
    message.style.color = '#b91c1c';
  }
});

document.getElementById('clearCategory').addEventListener('click', () => {
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryId').value = '';
});

document.getElementById('clearProduct').addEventListener('click', () => {
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
});

document.querySelectorAll('[data-report]').forEach(button => {
  button.addEventListener('click', async () => {
    try {
      const rows = await request(`/reports/${button.dataset.report}`);
      renderTable('reportTable', rows);
    } catch (error) {
      alert(error.message);
    }
  });
});

const init = async () => {
  await loadHealth();
  await loadCatalogs();
  await loadCategories();
  await loadProducts();
};

init().catch(error => alert(error.message));
