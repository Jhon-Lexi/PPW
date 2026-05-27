// ============================================
// ADMIN - Dashboard y CRUD
// ============================================

// Cargar dashboard
async function loadDashboard() {
  if (!requireAdmin()) return;
  const container = document.getElementById('dashboard-content');
  if (!container) return;

  const productos = await getProductos();
  const { data: pedidos } = await supabaseClient.from('pedidos').select('*');
  const totalVentas = pedidos?.filter(p => p.estado !== 'cancelado').reduce((sum, p) => sum + parseFloat(p.total), 0) || 0;

  container.innerHTML = `
    <h1>Dashboard</h1>
    <div class="admin-stats">
      <div class="admin-stat-card">
        <h4>Productos</h4>
        <div class="number">${productos.length}</div>
      </div>
      <div class="admin-stat-card">
        <h4>Pedidos</h4>
        <div class="number">${pedidos?.length || 0}</div>
      </div>
      <div class="admin-stat-card">
        <h4>Ventas totales</h4>
        <div class="number">S/ ${totalVentas.toFixed(2)}</div>
      </div>
      <div class="admin-stat-card">
        <h4>Productos bajos</h4>
        <div class="number" style="color:var(--danger)">${productos.filter(p => parseFloat(p.precio) < 30).length}</div>
      </div>
    </div>
    <div style="background:white;border-radius:12px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <h3 style="font-weight:700;margin-bottom:16px;">Accesos rápidos</h3>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <a href="/admin/productos.html" class="btn btn-primary">Gestionar productos</a>
        <a href="/admin/pedidos.html" class="btn btn-secondary">Ver pedidos</a>
        <a href="/catalogo.html" class="btn btn-secondary">Ver tienda</a>
      </div>
    </div>
  `;
}

// Cargar lista de productos (admin)
async function loadAdminProductos() {
  if (!requireAdmin()) return;
  const container = document.getElementById('admin-productos');
  if (!container) return;

  const productos = await getProductos();
  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:24px;">
      <h1>Productos</h1>
      <button class="btn btn-primary" onclick="showProductModal()">+ Nuevo producto</button>
    </div>
    <div style="overflow-x:auto;">
    <table class="admin-table">
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
  `;

  productos.forEach(p => {
    html += `
      <tr>
        <td><img src="${p.imagen || 'https://via.placeholder.com/60'}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;" onerror="this.src='https://via.placeholder.com/60'"></td>
        <td><strong>${p.nombre}</strong></td>
        <td>${p.categoria || 'General'}</td>
        <td><strong>S/ ${parseFloat(p.precio).toFixed(2)}</strong></td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick='editProduct(${JSON.stringify(p)})'>✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// Mostrar modal de producto
function showProductModal(producto = null) {
  const isEdit = !!producto;
  const overlay = document.getElementById('product-modal');
  if (!overlay) {
    const div = document.createElement('div');
    div.id = 'product-modal';
    div.className = 'modal-overlay';
    div.innerHTML = `
      <div class="modal">
        <h3 id="modal-title">${isEdit ? 'Editar producto' : 'Nuevo producto'}</h3>
        <form id="product-form" onsubmit="saveProduct(event)">
          <input type="hidden" id="product-id" value="${isEdit ? producto.id : ''}">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" id="product-nombre" value="${isEdit ? producto.nombre : ''}" required>
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea id="product-desc">${isEdit ? (producto.descripcion || '') : ''}</textarea>
          </div>
          <div class="form-group">
            <label>Precio</label>
            <input type="number" id="product-precio" step="0.01" value="${isEdit ? producto.precio : ''}" required>
          </div>
          <div class="form-group">
            <label>URL de imagen</label>
            <input type="url" id="product-imagen" value="${isEdit ? (producto.imagen || '') : ''}">
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <select id="product-categoria">
              <option value="electronica" ${isEdit && producto.categoria === 'electronica' ? 'selected' : ''}>Electrónica</option>
              <option value="accesorios" ${isEdit && producto.categoria === 'accesorios' ? 'selected' : ''}>Accesorios</option>
              <option value="deportes" ${isEdit && producto.categoria === 'deportes' ? 'selected' : ''}>Deportes</option>
              <option value="ropa" ${isEdit && producto.categoria === 'ropa' ? 'selected' : ''}>Ropa</option>
              <option value="hogar" ${isEdit && producto.categoria === 'hogar' ? 'selected' : ''}>Hogar</option>
              <option value="general" ${isEdit && producto.categoria === 'general' ? 'selected' : ''}>General</option>
            </select>
          </div>
          <div style="display:flex;gap:12px;margin-top:24px;">
            <button type="submit" class="btn btn-primary" style="flex:1;">${isEdit ? 'Actualizar' : 'Crear'}</button>
            <button type="button" class="btn btn-secondary" onclick="closeProductModal()">Cancelar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(div);
  } else {
    document.getElementById('modal-title').textContent = isEdit ? 'Editar producto' : 'Nuevo producto';
    document.getElementById('product-id').value = isEdit ? producto.id : '';
    document.getElementById('product-nombre').value = isEdit ? producto.nombre : '';
    document.getElementById('product-desc').value = isEdit ? (producto.descripcion || '') : '';
    document.getElementById('product-precio').value = isEdit ? producto.precio : '';
    document.getElementById('product-imagen').value = isEdit ? (producto.imagen || '') : '';
    document.getElementById('product-categoria').value = isEdit ? (producto.categoria || 'general') : 'general';
  }

  setTimeout(() => document.getElementById('product-modal')?.classList.add('active'), 10);
}

function closeProductModal() {
  document.getElementById('product-modal')?.classList.remove('active');
}

// Guardar producto
async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('product-id').value;
  const data = {
    nombre: document.getElementById('product-nombre').value,
    descripcion: document.getElementById('product-desc').value,
    precio: parseFloat(document.getElementById('product-precio').value),
    imagen: document.getElementById('product-imagen').value,
    categoria: document.getElementById('product-categoria').value
  };

  let error;
  if (id) {
    ({ error } = await supabaseClient.from('productos').update(data).eq('id', id));
  } else {
    ({ error } = await supabaseClient.from('productos').insert(data));
  }

  if (error) {
    showToast('Error: ' + error.message, 'error');
  } else {
    showToast(id ? 'Producto actualizado' : 'Producto creado', 'success');
    closeProductModal();
    loadAdminProductos();
  }
}

// Editar producto
function editProduct(producto) {
  showProductModal(producto);
}

// Eliminar producto
async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  const { error } = await supabaseClient.from('productos').delete().eq('id', id);
  if (error) {
    showToast('Error: ' + error.message, 'error');
  } else {
    showToast('Producto eliminado', 'success');
    loadAdminProductos();
  }
}

// Cargar pedidos (admin)
async function loadAdminPedidos() {
  if (!requireAdmin()) return;
  const container = document.getElementById('admin-pedidos');
  if (!container) return;

  const { data: pedidos } = await supabaseClient
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false });

  let html = `
    <h1>Pedidos</h1>
    <div style="overflow-x:auto;">
    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Usuario</th>
          <th>Total</th>
          <th>Estado</th>
          <th>Fecha</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (!pedidos || pedidos.length === 0) {
    html += '<tr><td colspan="6" style="text-align:center;color:#94a3b8;">No hay pedidos aún</td></tr>';
  } else {
    for (const pedido of pedidos) {
      const { data: userData } = await supabaseClient
        .from('perfiles')
        .select('nombre')
        .eq('id', pedido.usuario_id)
        .single();

      const nombre = userData?.nombre || 'Usuario';
      html += `
        <tr>
          <td style="font-size:0.8rem;color:#94a3b8;">${pedido.id.slice(0, 8)}...</td>
          <td>${nombre}</td>
          <td><strong>S/ ${parseFloat(pedido.total).toFixed(2)}</strong></td>
          <td>
            <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:600;
              ${pedido.estado === 'pendiente' ? 'background:#fef3c7;color:#92400e;' : ''}
              ${pedido.estado === 'pagado' ? 'background:#dbeafe;color:#1e40af;' : ''}
              ${pedido.estado === 'enviado' ? 'background:#f3e8ff;color:#6b21a8;' : ''}
              ${pedido.estado === 'entregado' ? 'background:#d1fae5;color:#065f46;' : ''}
              ${pedido.estado === 'cancelado' ? 'background:#fee2e2;color:#991b1b;' : ''}
            ">${pedido.estado}</span>
          </td>
          <td>${new Date(pedido.created_at).toLocaleDateString()}</td>
          <td>
            <select onchange="updateOrderStatus('${pedido.id}', this.value)" style="padding:6px 10px;border:2px solid #e2e8f0;border-radius:6px;font-size:0.85rem;">
              <option value="pendiente" ${pedido.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
              <option value="pagado" ${pedido.estado === 'pagado' ? 'selected' : ''}>Pagado</option>
              <option value="enviado" ${pedido.estado === 'enviado' ? 'selected' : ''}>Enviado</option>
              <option value="entregado" ${pedido.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
              <option value="cancelado" ${pedido.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
            </select>
          </td>
        </tr>
      `;
    }
  }

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// Actualizar estado de pedido
async function updateOrderStatus(pedidoId, estado) {
  const { error } = await supabaseClient
    .from('pedidos')
    .update({ estado })
    .eq('id', pedidoId);

  if (error) {
    showToast('Error: ' + error.message, 'error');
  } else {
    showToast('Pedido actualizado', 'success');
  }
}
