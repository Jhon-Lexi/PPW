// ============================================================
// MÓDULO DE PRODUCTOS - CARGA Y FILTROS
// ============================================================

/**
 * Carga productos desde Supabase y los renderiza en un contenedor
 * 
 * @param {string} containerId - ID del contenedor HTML
 * @param {object} options - Opciones de filtro
 * @param {string} options.search - Término de búsqueda
 * @param {string} options.categoria - Categoría para filtrar
 * @param {number} options.limit - Límite de productos a mostrar
 */
async function cargarProductos(containerId = 'productos-container', options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '<div class="spinner" role="status"><span class="sr-only">Cargando productos...</span></div>';

  try {
    // Construir consulta
    let query = supabase.from('productos').select('*');

    // Filtro por categoría
    if (options.categoria) {
      query = query.eq('categoria', options.categoria);
    }

    // Búsqueda por texto (ILike para case-insensitive)
    if (options.search && options.search.trim()) {
      query = query.ilike('nombre', `%${options.search.trim()}%`);
    }

    // Ordenar y limitar
    query = query.order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data: productos, error } = await query;

    if (error) throw error;

    const noResults = document.getElementById('no-results');

    if (!productos || productos.length === 0) {
      container.innerHTML = '';
      if (noResults) noResults.style.display = 'block';
      return;
    }

    if (noResults) noResults.style.display = 'none';

    let html = '';
    productos.forEach(producto => {
      const imagen = producto.imagen_url || 'https://via.placeholder.com/400x300?text=Sin+Imagen';
      const stockClass = producto.stock > 0 ? '' : 'opacity-50';
      const stockText = producto.stock > 0 ? `${producto.stock} en stock` : 'Agotado';

      html += `
        <article class="card ${stockClass}">
          <img src="${imagen}" 
               alt="${producto.nombre}" 
               class="card__image"
               loading="lazy">
          <div class="card__body">
            <span style="font-size: var(--font-size-sm); color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">
              ${producto.categoria}
            </span>
            <h3 class="card__title">${producto.nombre}</h3>
            <p class="card__text">${producto.descripcion || ''}</p>
            <p class="card__price">$${parseFloat(producto.precio).toFixed(2)}</p>
            <p style="font-size: var(--font-size-sm); color: ${producto.stock > 0 ? 'var(--color-success)' : 'var(--color-danger)'}; margin-bottom: var(--spacing-md);">
              ${stockText}
            </p>
            <button class="btn btn-primary add-to-cart-btn"
                    data-id="${producto.id}"
                    data-nombre="${producto.nombre}"
                    data-precio="${producto.precio}"
                    data-imagen="${imagen}"
                    ${producto.stock <= 0 ? 'disabled' : ''}
                    aria-label="Agregar ${producto.nombre} al carrito">
              ${producto.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
            </button>
          </div>
        </article>
      `;
    });

    container.innerHTML = html;

  } catch (error) {
    console.error('Error cargando productos:', error.message);
    container.innerHTML = `
      <div class="alert alert-error" role="alert">
        Error al cargar los productos. Verifica tu conexión e intenta de nuevo.
      </div>
    `;
  }
}

/**
 * Carga las categorías desde Supabase y llena el select de filtros
 */
async function cargarCategorias() {
  const select = document.getElementById('category-filter');
  if (!select) return;

  try {
    const { data: categorias, error } = await supabase
      .from('categorias')
      .select('nombre')
      .order('nombre');

    if (error) throw error;

    if (categorias) {
      categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.nombre;
        option.textContent = cat.nombre;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error cargando categorías:', error.message);
  }
}
