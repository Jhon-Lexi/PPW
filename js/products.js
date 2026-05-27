// ============================================
// PRODUCTOS - Catálogo y operaciones
// ============================================

// Obtener todos los productos
async function getProductos() {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener productos:', error);
    return [];
  }
  return data || [];
}

// Obtener producto por ID
async function getProductoById(id) {
  if (!supabaseClient) return null;
  const { data, error } = await supabaseClient
    .from('productos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

// Obtener categorías únicas
async function getCategorias() {
  const productos = await getProductos();
  const cats = [...new Set(productos.map(p => p.categoria))];
  return cats.filter(Boolean);
}

// Renderizar grid de productos
function renderProductos(productos, containerId = 'productos-grid') {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  if (!productos || productos.length === 0) {
    grid.innerHTML = `
      <div class="loading" style="grid-column:1/-1;">
        <div class="spinner"></div>
        <p>No se encontraron productos</p>
      </div>
    `;
    return;
  }

  let html = '';
  productos.forEach(p => {
    const precio = parseFloat(p.precio).toFixed(2);
    html += `
      <div class="producto-card">
        <a href="/producto.html?id=${p.id}">
          <img src="${p.imagen || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}" alt="${p.nombre}" class="producto-card-image" onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
        </a>
        <div class="producto-card-body">
          <span class="producto-card-categoria">${p.categoria || 'General'}</span>
          <a href="/producto.html?id=${p.id}">
            <h3 class="producto-card-title">${p.nombre}</h3>
          </a>
          <p class="producto-card-desc">${p.descripcion || ''}</p>
          <div class="producto-card-footer">
            <span class="producto-card-precio">${precio}</span>
            <button class="btn btn-primary btn-sm" onclick='addToCart(${JSON.stringify({id: p.id, nombre: p.nombre, precio: p.precio, imagen: p.imagen})}, 1)'>Agregar</button>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
}

// Renderizar catálogo con filtros
async function renderCatalogo() {
  const filtroCategoria = document.getElementById('filtro-categoria');
  const busqueda = document.getElementById('filtro-busqueda');
  const orden = document.getElementById('filtro-orden');

  let productos = await getProductos();

  // Aplicar filtros
  if (filtroCategoria?.value) {
    productos = productos.filter(p => p.categoria === filtroCategoria.value);
  }

  if (busqueda?.value) {
    const q = busqueda.value.toLowerCase();
    productos = productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.descripcion?.toLowerCase().includes(q)
    );
  }

  // Ordenar
  if (orden?.value) {
    switch (orden.value) {
      case 'precio-asc':
        productos.sort((a, b) => parseFloat(a.precio) - parseFloat(b.precio));
        break;
      case 'precio-desc':
        productos.sort((a, b) => parseFloat(b.precio) - parseFloat(a.precio));
        break;
      case 'nombre':
        productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
    }
  }

  renderProductos(productos);
}

// Inicializar catálogo
async function initCatalogo() {
  await initAuth();

  const filtros = ['filtro-categoria', 'filtro-busqueda', 'filtro-orden'];
  filtros.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', renderCatalogo);
  });

  const busqueda = document.getElementById('filtro-busqueda');
  if (busqueda) {
    let timeout;
    busqueda.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(renderCatalogo, 300);
    });
  }

  // Llenar categorías
  const selectCat = document.getElementById('filtro-categoria');
  if (selectCat) {
    const categorias = await getCategorias();
    categorias.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      selectCat.appendChild(opt);
    });
  }

  await renderCatalogo();
}

// Inicializar detalle de producto
async function initProducto() {
  await initAuth();

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    document.getElementById('producto-detalle').innerHTML = '<p style="text-align:center;padding:60px;color:#94a3b8;">Producto no encontrado</p>';
    return;
  }

  const producto = await getProductoById(id);
  if (!producto) {
    document.getElementById('producto-detalle').innerHTML = '<p style="text-align:center;padding:60px;color:#94a3b8;">Producto no encontrado</p>';
    return;
  }

  const container = document.getElementById('producto-detalle');
  container.innerHTML = `
    <img src="${producto.imagen || 'https://via.placeholder.com/500x400'}" alt="${producto.nombre}" class="producto-detalle-image" onerror="this.src='https://via.placeholder.com/500x400'">
    <div class="producto-detalle-info">
      <span class="producto-detalle-categoria">${producto.categoria || 'General'}</span>
      <h1>${producto.nombre}</h1>
      <div class="producto-detalle-precio">${parseFloat(producto.precio).toFixed(2)}</div>
      <p class="producto-detalle-desc">${producto.descripcion || 'Sin descripción disponible.'}</p>
      <div class="producto-detalle-actions">
        <div class="cantidad-selector">
          <button onclick="changeCantidad(-1)">−</button>
          <input type="number" id="cantidad-input" value="1" min="1" readonly>
          <button onclick="changeCantidad(1)">+</button>
        </div>
        <button class="btn btn-primary btn-lg" onclick='addToCartFromDetail(${JSON.stringify({id: producto.id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen})})'>
          Agregar al carrito
        </button>
      </div>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;">
        <p style="color:#64748b;font-size:0.9rem;">✅ Envío gratis en compras mayores a S/ 200</p>
        <p style="color:#64748b;font-size:0.9rem;">🔄 Devolución gratuita en 30 días</p>
        <p style="color:#64748b;font-size:0.9rem;">🔒 Pago seguro garantizado</p>
      </div>
    </div>
  `;
}

let currentCantidad = 1;

function changeCantidad(delta) {
  const input = document.getElementById('cantidad-input');
  if (!input) return;
  currentCantidad = Math.max(1, parseInt(input.value) + delta);
  input.value = currentCantidad;
}

function addToCartFromDetail(producto) {
  addToCart(producto, currentCantidad);
}
