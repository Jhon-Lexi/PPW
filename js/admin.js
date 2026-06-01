// ============================================================
// MÓDULO DE ADMINISTRACIÓN
// CRUD de productos, eventos, usuarios y dashboard
// ============================================================

// ============================================================
// DASHBOARD - Estadísticas
// ============================================================
async function cargarEstadisticas() {
  try {
    const [productos, categorias, eventos, pedidos] = await Promise.all([
      supabase.from('productos').select('count', { count: 'exact' }),
      supabase.from('categorias').select('count', { count: 'exact' }),
      supabase.from('eventos').select('count', { count: 'exact' }),
      supabase.from('pedidos').select('count', { count: 'exact' })
    ]);

    document.getElementById('total-productos').textContent = productos.count ?? 0;
    document.getElementById('total-categorias').textContent = categorias.count ?? 0;
    document.getElementById('total-eventos').textContent = eventos.count ?? 0;
    document.getElementById('total-pedidos').textContent = pedidos.count ?? 0;
  } catch (error) {
    console.error('Error cargando estadísticas:', error.message);
  }
}

/**
 * Carga mensajes recientes de contacto para el dashboard
 */
async function cargarMensajesRecientes() {
  const container = document.getElementById('mensajes-recientes');
  if (!container) return;

  try {
    const { data, error } = await supabase
      .from('contactos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted);">No hay mensajes nuevos.</p>';
      return;
    }

    let html = '<div class="table-container"><table><thead><tr><th>Nombre</th><th>Email</th><th>Mensaje</th><th>Fecha</th></tr></thead><tbody>';
    data.forEach(msg => {
      const fecha = new Date(msg.created_at).toLocaleDateString('es-ES');
      html += `
        <tr>
          <td>${msg.nombre}</td>
          <td>${msg.email}</td>
          <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${msg.mensaje}</td>
          <td>${fecha}</td>
        </tr>
      `;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error cargando mensajes:', error.message);
    container.innerHTML = '<div class="alert alert-error">Error al cargar mensajes.</div>';
  }
}

// ============================================================
// CRUD DE PRODUCTOS
// ============================================================

/**
 * Inicializa la página de gestión de productos
 */
async function initProductosAdmin() {
  await cargarCategoriasSelect();
  await renderProductosTable();
  setupProductosModal();
}

/**
 * Carga categorías en el select del modal
 */
async function cargarCategoriasSelect() {
  const select = document.getElementById('prod-categoria');
  if (!select) return;

  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('nombre')
      .order('nombre');

    if (error) throw error;

    // Limpiar opciones existentes (mantener la primera)
    while (select.options.length > 1) {
      select.remove(1);
    }

    if (data) {
      data.forEach(cat => {
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

/**
 * Renderiza la tabla de productos en el admin
 */
async function renderProductosTable(search = '') {
  const container = document.getElementById('admin-productos-container');
  if (!container) return;

  container.innerHTML = '<div class="spinner" role="status"><span class="sr-only">Cargando productos...</span></div>';

  try {
    let query = supabase.from('productos').select('*');

    if (search.trim()) {
      query = query.ilike('nombre', `%${search.trim()}%`);
    }

    const { data: productos, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    if (!productos || productos.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: var(--spacing-xl);">No hay productos registrados.</p>';
      return;
    }

    let html = '<div class="table-container"><table><thead><tr><th>Imagen</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Categoría</th><th>Acciones</th></tr></thead><tbody>';

    productos.forEach(p => {
      html += `
        <tr>
          <td>
            <img src="${p.imagen_url || 'https://via.placeholder.com/50'}" 
                 alt="${p.nombre}" 
                 style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
          </td>
          <td>${p.nombre}</td>
          <td>$${parseFloat(p.precio).toFixed(2)}</td>
          <td>${p.stock}</td>
          <td>${p.categoria}</td>
          <td>
            <div style="display: flex; gap: var(--spacing-xs);">
              <button class="btn btn-sm btn-secondary" onclick="editarProducto(${p.id})" aria-label="Editar ${p.nombre}">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="eliminarProducto(${p.id})" aria-label="Eliminar ${p.nombre}">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error:', error.message);
    container.innerHTML = '<div class="alert alert-error">Error al cargar productos.</div>';
  }
}

/**
 * Configura el modal de productos (nuevo/editar)
 */
function setupProductosModal() {
  const modal = document.getElementById('producto-modal');
  const btnNuevo = document.getElementById('btn-nuevo-producto');
  const btnClose = document.getElementById('modal-close');
  const btnCancel = document.getElementById('modal-cancel');
  const form = document.getElementById('producto-form');
  const searchInput = document.getElementById('admin-search');

  // Abrir modal para nuevo producto
  if (btnNuevo) {
    btnNuevo.addEventListener('click', () => {
      resetFormProducto();
      document.getElementById('modal-title').textContent = 'Nuevo Producto';
      modal.classList.add('open');
    });
  }

  // Cerrar modal
  const closeModal = () => modal.classList.remove('open');
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Búsqueda en tabla
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderProductosTable(searchInput.value);
    });
  }

  // Guardar producto
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorDiv = document.getElementById('producto-form-error');
      errorDiv.style.display = 'none';

      const producto = {
        nombre: document.getElementById('prod-nombre').value.trim(),
        descripcion: document.getElementById('prod-descripcion').value.trim(),
        precio: parseFloat(document.getElementById('prod-precio').value),
        stock: parseInt(document.getElementById('prod-stock').value),
        categoria: document.getElementById('prod-categoria').value,
        imagen_url: document.getElementById('prod-imagen').value.trim()
      };

      // Validaciones
      if (!producto.nombre || !producto.precio || isNaN(producto.stock) || !producto.categoria) {
        errorDiv.textContent = 'Todos los campos marcados con * son obligatorios.';
        errorDiv.style.display = 'block';
        return;
      }

      const productoId = document.getElementById('producto-id').value;

      try {
        if (productoId) {
          // Actualizar producto existente
          const { error } = await supabase
            .from('productos')
            .update(producto)
            .eq('id', productoId);

          if (error) throw error;
        } else {
          // Crear nuevo producto
          const { error } = await supabase
            .from('productos')
            .insert(producto);

          if (error) throw error;
        }

        closeModal();
        await renderProductosTable(searchInput?.value || '');
      } catch (error) {
        errorDiv.textContent = 'Error al guardar: ' + error.message;
        errorDiv.style.display = 'block';
      }
    });
  }
}

/**
 * Editar producto: carga datos en el modal
 */
async function editarProducto(id) {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) return;

    document.getElementById('producto-id').value = data.id;
    document.getElementById('prod-nombre').value = data.nombre;
    document.getElementById('prod-descripcion').value = data.descripcion || '';
    document.getElementById('prod-precio').value = data.precio;
    document.getElementById('prod-stock').value = data.stock;
    document.getElementById('prod-categoria').value = data.categoria;
    document.getElementById('prod-imagen').value = data.imagen_url || '';

    document.getElementById('modal-title').textContent = 'Editar Producto';
    document.getElementById('producto-modal').classList.add('open');
  } catch (error) {
    console.error('Error cargando producto:', error.message);
  }
}

/**
 * Elimina un producto con confirmación
 */
async function eliminarProducto(id) {
  if (!confirm('¿Estás seguro de eliminar este producto?')) return;

  try {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    const searchInput = document.getElementById('admin-search');
    await renderProductosTable(searchInput?.value || '');
  } catch (error) {
    alert('Error al eliminar: ' + error.message);
  }
}

/**
 * Resetea el formulario de producto
 */
function resetFormProducto() {
  document.getElementById('producto-id').value = '';
  document.getElementById('prod-nombre').value = '';
  document.getElementById('prod-descripcion').value = '';
  document.getElementById('prod-precio').value = '';
  document.getElementById('prod-stock').value = '';
  document.getElementById('prod-categoria').value = '';
  document.getElementById('prod-imagen').value = '';
  document.getElementById('producto-form-error').style.display = 'none';
}

// ============================================================
// ADMINISTRACIÓN DE USUARIOS (solo superadmin)
// ============================================================

/**
 * Carga y renderiza la lista de usuarios
 */
async function cargarUsuarios() {
  const container = document.getElementById('admin-usuarios-container');
  if (!container) return;

  container.innerHTML = '<div class="spinner" role="status"><span class="sr-only">Cargando usuarios...</span></div>';

  try {
    const { data: perfiles, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!perfiles || perfiles.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No hay usuarios registrados.</p>';
      return;
    }

    let html = '<div class="table-container"><table><thead><tr><th>ID</th><th>Nombre</th><th>Rol</th><th>Acciones</th></tr></thead><tbody>';

    perfiles.forEach(perfil => {
      html += `
        <tr>
          <td style="font-size: var(--font-size-sm);">${perfil.id.substring(0, 8)}...</td>
          <td>${perfil.nombre || 'Sin nombre'}</td>
          <td>
            <span style="font-weight: 600; color: ${perfil.rol === 'superadmin' ? 'var(--color-warning)' : perfil.rol === 'admin' ? 'var(--color-primary)' : 'var(--text-secondary)'};">
              ${perfil.rol}
            </span>
          </td>
          <td>
            ${perfil.rol !== 'superadmin' ? `
              <button class="btn btn-sm btn-primary" onclick="cambiarRol('${perfil.id}', 'admin')" aria-label="Hacer administrador">
                Hacer Admin
              </button>
              <button class="btn btn-sm btn-secondary" onclick="cambiarRol('${perfil.id}', 'cliente')" aria-label="Hacer cliente">
                Hacer Cliente
              </button>
            ` : '<span style="color: var(--text-muted);">Superadmin</span>'}
          </td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error cargando usuarios:', error.message);
    container.innerHTML = '<div class="alert alert-error">Error al cargar usuarios.</div>';
  }
}

/**
 * Cambia el rol de un usuario
 */
async function cambiarRol(userId, nuevoRol) {
  if (!confirm(`¿Cambiar el rol del usuario a "${nuevoRol}"?`)) return;

  try {
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: nuevoRol })
      .eq('id', userId);

    if (error) throw error;

    await cargarUsuarios();
  } catch (error) {
    alert('Error al cambiar rol: ' + error.message);
  }
}

// ============================================================
// ADMINISTRACIÓN DE EVENTOS
// ============================================================

/**
 * Inicializa la página de gestión de eventos
 */
async function initEventosAdmin() {
  await renderEventosTable();
  setupEventosModal();
}

/**
 * Renderiza tabla de eventos en el admin
 */
async function renderEventosTable() {
  const container = document.getElementById('admin-eventos-container');
  if (!container) return;

  container.innerHTML = '<div class="spinner" role="status"><span class="sr-only">Cargando eventos...</span></div>';

  try {
    const { data: eventos, error } = await supabase
      .from('eventos')
      .select('*')
      .order('fecha', { ascending: true });

    if (error) throw error;

    if (!eventos || eventos.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: var(--spacing-xl);">No hay eventos registrados.</p>';
      return;
    }

    let html = '<div class="table-container"><table><thead><tr><th>Título</th><th>Fecha</th><th>Lugar</th><th>Acciones</th></tr></thead><tbody>';

    eventos.forEach(e => {
      const fecha = new Date(e.fecha).toLocaleDateString('es-ES');
      html += `
        <tr>
          <td>${e.titulo}</td>
          <td>${fecha} ${e.hora ? `- ${e.hora}` : ''}</td>
          <td>${e.lugar || '-'}</td>
          <td>
            <div style="display: flex; gap: var(--spacing-xs);">
              <button class="btn btn-sm btn-secondary" onclick="editarEvento(${e.id})" aria-label="Editar ${e.titulo}">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="eliminarEvento(${e.id})" aria-label="Eliminar ${e.titulo}">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div class="alert alert-error">Error al cargar eventos.</div>';
  }
}

/**
 * Configura el modal de eventos
 */
function setupEventosModal() {
  const modal = document.getElementById('evento-modal');
  const btnNuevo = document.getElementById('btn-nuevo-evento');
  const btnClose = document.getElementById('evento-modal-close');
  const btnCancel = document.getElementById('evento-modal-cancel');
  const form = document.getElementById('evento-form');

  if (btnNuevo) {
    btnNuevo.addEventListener('click', () => {
      resetFormEvento();
      document.getElementById('evento-modal-title').textContent = 'Nuevo Evento';
      modal.classList.add('open');
    });
  }

  const closeModal = () => modal.classList.remove('open');
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorDiv = document.getElementById('evento-form-error');
      errorDiv.style.display = 'none';

      const evento = {
        titulo: document.getElementById('ev-titulo').value.trim(),
        descripcion: document.getElementById('ev-descripcion').value.trim(),
        fecha: document.getElementById('ev-fecha').value,
        hora: document.getElementById('ev-hora').value || null,
        lugar: document.getElementById('ev-lugar').value.trim(),
        imagen_url: document.getElementById('ev-imagen').value.trim()
      };

      if (!evento.titulo || !evento.fecha) {
        errorDiv.textContent = 'Título y fecha son obligatorios.';
        errorDiv.style.display = 'block';
        return;
      }

      const eventoId = document.getElementById('evento-id').value;

      try {
        if (eventoId) {
          const { error } = await supabase.from('eventos').update(evento).eq('id', eventoId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('eventos').insert(evento);
          if (error) throw error;
        }
        closeModal();
        await renderEventosTable();
      } catch (error) {
        errorDiv.textContent = 'Error: ' + error.message;
        errorDiv.style.display = 'block';
      }
    });
  }
}

async function editarEvento(id) {
  try {
    const { data, error } = await supabase.from('eventos').select('*').eq('id', id).single();
    if (error || !data) return;

    document.getElementById('evento-id').value = data.id;
    document.getElementById('ev-titulo').value = data.titulo;
    document.getElementById('ev-descripcion').value = data.descripcion || '';
    document.getElementById('ev-fecha').value = data.fecha;
    document.getElementById('ev-hora').value = data.hora || '';
    document.getElementById('ev-lugar').value = data.lugar || '';
    document.getElementById('ev-imagen').value = data.imagen_url || '';

    document.getElementById('evento-modal-title').textContent = 'Editar Evento';
    document.getElementById('evento-modal').classList.add('open');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function eliminarEvento(id) {
  if (!confirm('¿Eliminar este evento?')) return;
  try {
    await supabase.from('eventos').delete().eq('id', id);
    await renderEventosTable();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

function resetFormEvento() {
  document.getElementById('evento-id').value = '';
  document.getElementById('ev-titulo').value = '';
  document.getElementById('ev-descripcion').value = '';
  document.getElementById('ev-fecha').value = '';
  document.getElementById('ev-hora').value = '';
  document.getElementById('ev-lugar').value = '';
  document.getElementById('ev-imagen').value = '';
  document.getElementById('evento-form-error').style.display = 'none';
}
