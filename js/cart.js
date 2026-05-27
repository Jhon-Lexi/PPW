// ============================================
// CARRITO DE COMPRAS - localStorage
// ============================================

const CART_KEY = 'ecommerce_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(producto, cantidad = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.id === producto.id);

  if (existing) {
    existing.cantidad += cantidad;
  } else {
    cart.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: parseFloat(producto.precio),
      imagen: producto.imagen,
      cantidad
    });
  }

  saveCart(cart);
  showToast(`${producto.nombre} agregado al carrito`, 'success');
}

function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
  renderCartPage();
}

function updateQuantity(productId, cantidad) {
  if (cantidad < 1) return removeFromCart(productId);
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.cantidad = cantidad;
    saveCart(cart);
    renderCartPage();
  }
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.cantidad, 0);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
}

function updateCartCount() {
  const count = getCartCount();
  const badges = document.querySelectorAll('.cart-count');
  badges.forEach(badge => {
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  });
}

// Renderizar página de carrito
function renderCartPage() {
  const container = document.getElementById('cart-container');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <h2 style="font-size:1.4rem;font-weight:700;margin-bottom:8px;color:#1e293b;">Tu carrito está vacío</h2>
        <p style="color:#94a3b8;margin-bottom:24px;">Agrega productos desde nuestro catálogo</p>
        <a href="/catalogo.html" class="btn btn-primary">Ver productos</a>
      </div>
    `;
    return;
  }

  let html = '';
  cart.forEach(item => {
    const total = item.precio * item.cantidad;
    html += `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.imagen || 'https://via.placeholder.com/100'}" alt="${item.nombre}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/100'">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.nombre}</div>
          <div class="cart-item-precio">S/ ${item.precio.toFixed(2)} c/u</div>
        </div>
        <div class="cantidad-selector">
          <button onclick="updateQuantity('${item.id}', ${item.cantidad - 1})">−</button>
          <input type="number" value="${item.cantidad}" min="1" onchange="updateQuantity('${item.id}', parseInt(this.value) || 1)">
          <button onclick="updateQuantity('${item.id}', ${item.cantidad + 1})">+</button>
        </div>
        <div class="cart-item-total">${total.toFixed(2)}</div>
        <button class="btn btn-danger btn-sm" onclick="removeFromCart('${item.id}')">🗑️</button>
      </div>
    `;
  });

  const total = getCartTotal();
  const subtotal = total;
  const envio = total >= 200 ? 0 : 15;

  html += `
    <div class="cart-summary">
      <div class="cart-summary-row">
        <span>Subtotal</span>
        <span>S/ ${subtotal.toFixed(2)}</span>
      </div>
      <div class="cart-summary-row">
        <span>Envío</span>
        <span>${envio === 0 ? 'Gratis' : 'S/ ' + envio.toFixed(2)}</span>
      </div>
      <div class="cart-summary-row total">
        <span>Total</span>
        <span>S/ ${(subtotal + envio).toFixed(2)}</span>
      </div>
      <div style="display:flex;gap:12px;margin-top:24px;flex-wrap:wrap;">
        <a href="/catalogo.html" class="btn btn-secondary">Seguir comprando</a>
        <a href="/checkout.html" class="btn btn-primary" style="flex:1;">Proceder al pago</a>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// ============ TOAST NOTIFICATION ============
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) {
    const div = document.createElement('div');
    div.id = 'toast-container';
    div.className = 'toast-container';
    document.body.appendChild(div);
  }

  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}
