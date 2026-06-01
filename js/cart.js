// ============================================================
// MÓDULO DE CARRITO DE COMPRAS
// Usa localStorage para persistencia
// ============================================================

const CART_KEY = 'tienda_carrito';

/**
 * Obtiene el carrito del localStorage
 */
function getCart() {
  try {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

/**
 * Guarda el carrito en localStorage
 */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/**
 * Agrega un producto al carrito
 * @param {object} producto - { id, nombre, precio, imagen_url }
 */
function addToCart(producto) {
  if (!producto || !producto.id) return;

  const cart = getCart();
  const existing = cart.find(item => item.id === producto.id);

  if (existing) {
    existing.cantidad += 1;
  } else {
    cart.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen_url: producto.imagen_url || '',
      cantidad: 1
    });
  }

  saveCart(cart);
  updateCartBadge();
  showCartNotification(`${producto.nombre} agregado al carrito`);
}

/**
 * Elimina un producto del carrito
 */
function removeFromCart(productoId) {
  const cart = getCart().filter(item => item.id !== productoId);
  saveCart(cart);
  updateCartBadge();
  renderCartPage(); // Si estamos en la página del carrito
}

/**
 * Actualiza la cantidad de un producto
 */
function updateQuantity(productoId, nuevaCantidad) {
  if (nuevaCantidad < 1) {
    removeFromCart(productoId);
    return;
  }

  const cart = getCart();
  const item = cart.find(p => p.id === productoId);
  if (item) {
    item.cantidad = nuevaCantidad;
    saveCart(cart);
    updateCartBadge();
    renderCartPage();
  }
}

/**
 * Calcula el total del carrito
 */
function getCartTotal() {
  return getCart().reduce((total, item) => total + (item.precio * item.cantidad), 0);
}

/**
 * Obtiene la cantidad total de productos en el carrito
 */
function getCartCount() {
  return getCart().reduce((count, item) => count + item.cantidad, 0);
}

/**
 * Vacía el carrito
 */
function clearCart() {
  saveCart([]);
  updateCartBadge();
  renderCartPage();
}

/**
 * Actualiza el badge del carrito en el header
 */
function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge__count');
  const count = getCartCount();
  
  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
}

/**
 * Muestra una notificación temporal
 */
function showCartNotification(message) {
  const existing = document.getElementById('cart-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.id = 'cart-notification';
  notification.setAttribute('role', 'alert');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: var(--color-success, #22c55e);
    color: #fff;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 9999;
    font-weight: 500;
    animation: slideIn 0.3s ease;
    max-width: 300px;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

/**
 * Renderiza la página del carrito
 */
function renderCartPage() {
  const cartContainer = document.getElementById('cart-container');
  if (!cartContainer) return;

  const cart = getCart();

  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <div class="text-center" style="padding: var(--spacing-2xl) 0;">
        <p style="font-size: 3rem; margin-bottom: var(--spacing-md);">🛒</p>
        <h2>Tu carrito está vacío</h2>
        <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">
          Agrega productos desde nuestro catálogo
        </p>
        <a href="/catalogo.html" class="btn btn-primary">Ver Catálogo</a>
      </div>
    `;
    return;
  }

  let html = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Cantidad</th>
            <th>Subtotal</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
  `;

  cart.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    html += `
      <tr>
        <td style="display: flex; align-items: center; gap: var(--spacing-md);">
          <img src="${item.imagen_url || 'https://via.placeholder.com/60'}" 
               alt="${item.nombre}" 
               style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
          <span>${item.nombre}</span>
        </td>
        <td>$${item.precio.toFixed(2)}</td>
        <td>
          <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
            <button class="btn btn-sm btn-secondary" 
                    onclick="updateQuantity(${item.id}, ${item.cantidad - 1})"
                    aria-label="Reducir cantidad">-</button>
            <span style="font-weight: 600; min-width: 30px; text-align: center;">${item.cantidad}</span>
            <button class="btn btn-sm btn-secondary" 
                    onclick="updateQuantity(${item.id}, ${item.cantidad + 1})"
                    aria-label="Aumentar cantidad">+</button>
          </div>
        </td>
        <td><strong>$${subtotal.toFixed(2)}</strong></td>
        <td>
          <button class="btn btn-sm btn-danger" 
                  onclick="removeFromCart(${item.id})"
                  aria-label="Eliminar ${item.nombre} del carrito">
            Eliminar
          </button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
    <div style="text-align: right; margin-top: var(--spacing-xl);">
      <p style="font-size: var(--font-size-xl); font-weight: 700;">
        Total: $${getCartTotal().toFixed(2)}
      </p>
      <div style="display: flex; gap: var(--spacing-md); justify-content: flex-end; margin-top: var(--spacing-md);">
        <button class="btn btn-secondary" onclick="clearCart()">Vaciar Carrito</button>
        <button class="btn btn-primary" onclick="checkout()">Proceder al Pago</button>
      </div>
    </div>
  `;

  cartContainer.innerHTML = html;
}

/**
 * Procesa el checkout (simulado - redirige)
 */
async function checkout() {
  const user = await getCurrentUser();
  if (!user) {
    showCartNotification('Debes iniciar sesión para comprar');
    window.location.href = '/login.html?redirect=/carrito.html';
    return;
  }

  if (getCart().length === 0) {
    showCartNotification('Tu carrito está vacío');
    return;
  }

  // Aquí iría la lógica de crear un pedido en Supabase
  showCartNotification('Compra realizada con éxito. ¡Gracias por tu compra!');
  clearCart();
}

// Inicializar badge al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();

  // Renderizar carrito si estamos en la página del carrito
  if (document.getElementById('cart-container')) {
    renderCartPage();
  }

  // Botones "Agregar al carrito" (delegación de eventos)
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (btn) {
      e.preventDefault();

      const user = await getCurrentUser();
      if (!user) {
        showCartNotification('Debes iniciar sesión para comprar');
        window.location.href = '/login.html?redirect=/catalogo.html';
        return;
      }

      const producto = {
        id: parseInt(btn.dataset.id),
        nombre: btn.dataset.nombre,
        precio: parseFloat(btn.dataset.precio),
        imagen_url: btn.dataset.imagen
      };

      addToCart(producto);

      // Feedback visual en el botón
      const originalText = btn.textContent;
      btn.textContent = '✓ Agregado';
      btn.classList.add('btn-success');
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('btn-success');
      }, 1500);
    }
  });
});

// Exponer funciones globalmente para uso en HTML
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;
window.checkout = checkout;
window.updateCartBadge = updateCartBadge;
