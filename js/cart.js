// ============================================================
// SISTEMA DE CARRITO (localStorage)
// ============================================================

const Cart = {
    KEY: 'ecommerce_cart',

    // Obtener carrito
    get() {
        try {
            return JSON.parse(localStorage.getItem(this.KEY)) || [];
        } catch {
            return [];
        }
    },

    // Guardar carrito
    save(cart) {
        localStorage.setItem(this.KEY, JSON.stringify(cart));
        this.updateBadge();
        document.dispatchEvent(new CustomEvent('cartUpdated'));
    },

    // Agregar producto
    add(product) {
        const cart = this.get();
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        this.save(cart);
        Toast.show(`${product.name} agregado al carrito`, 'success');
    },

    // Eliminar producto
    remove(productId) {
        const cart = this.get().filter(item => item.id !== productId);
        this.save(cart);
    },

    // Actualizar cantidad
    updateQuantity(productId, qty) {
        const cart = this.get();
        const item = cart.find(i => i.id === productId);
        if (item) {
            item.quantity = Math.max(1, Math.min(qty, 99));
            this.save(cart);
        }
    },

    // Vaciar carrito
    clear() {
        this.save([]);
    },

    // Total de items
    getCount() {
        return this.get().reduce((sum, item) => sum + item.quantity, 0);
    },

    // Total en dinero
    getTotal() {
        return this.get().reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    // Actualizar badge en navbar
    updateBadge() {
        const count = this.getCount();
        document.querySelectorAll('.cart-badge').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
        });
    },

    // Renderizar items del carrito
    renderItems(container) {
        const cart = this.get();
        if (!container) return;

        if (cart.length === 0) {
            container.innerHTML = `
                <div class="text-center py-20">
                    <i class="fas fa-shopping-cart text-6xl text-gray-700 mb-6"></i>
                    <h3 class="text-xl font-semibold mb-2">Tu carrito está vacío</h3>
                    <p class="text-gray-400 mb-6">Agrega productos para comenzar</p>
                    <a href="catalog.html" class="btn btn-primary">Ver Catálogo</a>
                </div>
            `;
            return;
        }

        container.innerHTML = cart.map(item => `
            <div class="cart-item animate-fade-in" data-id="${item.id}">
                <img src="${item.image_url || 'https://via.placeholder.com/100'}" alt="${item.name}" loading="lazy">
                <div class="details">
                    <h4>${item.name}</h4>
                    <div class="price">$${Number(item.price).toFixed(2)}</div>
                    <div class="qty-controls">
                        <button onclick="Cart.updateQuantity('${item.id}', ${item.quantity - 1}); Cart.renderItems(document.getElementById('cart-items')); Cart.renderSummary(document.getElementById('cart-summary'))">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${item.quantity}</span>
                        <button onclick="Cart.updateQuantity('${item.id}', ${item.quantity + 1}); Cart.renderItems(document.getElementById('cart-items')); Cart.renderSummary(document.getElementById('cart-summary'))">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-lg mb-2">$${(item.price * item.quantity).toFixed(2)}</div>
                    <button onclick="Cart.remove('${item.id}'); Cart.renderItems(document.getElementById('cart-items')); Cart.renderSummary(document.getElementById('cart-summary'))" class="remove-btn">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Renderizar resumen del carrito
    renderSummary(container) {
        if (!container) return;
        const cart = this.get();
        const subtotal = this.getTotal();
        const shipping = subtotal >= 100 ? 0 : 9.99;
        const total = subtotal + shipping;

        container.innerHTML = `
            <div class="bg-card p-6 rounded-xl border border-zinc-800">
                <h3 class="text-lg font-bold mb-4">Resumen</h3>
                <div class="space-y-3 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-400">Subtotal</span>
                        <span>$${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Envío</span>
                        <span>${shipping === 0 ? '<span class="text-green-500">Gratis</span>' : '$' + shipping.toFixed(2)}</span>
                    </div>
                    ${shipping > 0 ? '<div class="text-xs text-gray-500">Envío gratis en compras +$100</div>' : ''}
                    <div class="border-t border-zinc-700 pt-3 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                </div>
                <button id="checkout-btn" class="btn btn-primary w-full mt-6 ${cart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${cart.length === 0 ? 'disabled' : ''}>
                    <i class="fas fa-lock"></i> Finalizar Compra
                </button>
            </div>
        `;

        // Manejar checkout
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn && cart.length > 0) {
            checkoutBtn.addEventListener('click', async () => {
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (!user) {
                    Toast.show('Debes iniciar sesión para comprar', 'error');
                    setTimeout(() => window.location.href = 'login.html', 1500);
                    return;
                }
                Toast.show('¡Compra realizada con éxito!', 'success');
                Cart.clear();
                Cart.renderItems(document.getElementById('cart-items'));
                Cart.renderSummary(document.getElementById('cart-summary'));
            });
        }
    }
};
