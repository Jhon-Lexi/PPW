// ============================================================
// SISTEMA DE CARRITO Y ÓRDENES (localStorage + Supabase)
// ============================================================

const Cart = {
    KEY: 'ecommerce_cart',

    // --- CARRITO ---
    get() {
        try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
        catch { return []; }
    },
    save(cart) {
        localStorage.setItem(this.KEY, JSON.stringify(cart));
        this.updateBadge();
        document.dispatchEvent(new CustomEvent('cartUpdated'));
    },
    add(product) {
        const cart = this.get();
        const existing = cart.find(item => item.id === product.id);
        if (existing) { existing.quantity += 1; }
        else { cart.push({ ...product, quantity: 1 }); }
        this.save(cart);
        Toast.show(`${product.name} agregado al carrito`, 'success');
    },
    remove(productId) {
        this.save(this.get().filter(item => item.id !== productId));
    },
    updateQuantity(productId, qty) {
        const cart = this.get();
        const item = cart.find(i => i.id === productId);
        if (item) { item.quantity = Math.max(1, Math.min(qty, 99)); this.save(cart); }
    },
    clear() { this.save([]); },
    getCount() { return this.get().reduce((sum, item) => sum + item.quantity, 0); },
    getTotal() { return this.get().reduce((sum, item) => sum + (item.price * item.quantity), 0); },
    getShipping() { return this.getTotal() >= 100 ? 0 : 9.99; },

    updateBadge() {
        const count = this.getCount();
        document.querySelectorAll('.cart-badge').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });
        document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; });
    },

    // --- RENDER CARRITO ---
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

    renderSummary(container) {
        if (!container) return;
        const cart = this.get();
        const subtotal = this.getTotal();
        const shipping = this.getShipping();
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
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn && cart.length > 0) {
            checkoutBtn.addEventListener('click', () => Checkout.open());
        }
    }
};

// ============================================================
// CHECKOUT MULTI-PASO
// ============================================================
const Checkout = {
    currentStep: 1,
    shippingData: {},
    paymentData: {},

    async open() {
        const { user } = await Auth.getCurrentUser();
        if (!user) {
            Toast.show('Debes iniciar sesión para comprar', 'error');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }
        this.currentStep = 1;
        this.shippingData = {};
        this.paymentData = {};
        // Resetear header del modal (puede haber quedado oculto tras compra exitosa)
        const closeBtn = document.querySelector('#checkout-header .modal-close');
        if (closeBtn) closeBtn.style.display = 'flex';
        const titleEl = document.querySelector('#checkout-header .modal-title');
        if (titleEl) titleEl.textContent = 'Finalizar Compra';
        const overlay = document.getElementById('checkout-overlay');
        overlay.classList.add('active');
        // Cerrar al hacer clic fuera del modal
        const closeHandler = (e) => {
            if (e.target === overlay) { this.close(); overlay.removeEventListener('click', closeHandler); }
        };
        overlay.addEventListener('click', closeHandler);
        this.renderStep(1);
    },

    close() {
        document.getElementById('checkout-overlay').classList.remove('active');
    },

    renderStep(step) {
        this.currentStep = step;
        const container = document.getElementById('checkout-content');
        const dots = document.querySelectorAll('.step-dot');
        const labels = document.querySelectorAll('.step-label');

        dots.forEach((d, i) => {
            d.className = 'step-dot w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ' +
                (i + 1 < step ? 'bg-amber-500 text-black' :
                 i + 1 === step ? 'bg-amber-500 text-black ring-2 ring-amber-500/40' :
                 'bg-zinc-700 text-gray-400');
            d.textContent = i + 1 < step ? '✓' : i + 1;
        });
        labels.forEach((l, i) => {
            l.className = 'step-label text-xs mt-1 transition-all ' +
                (i + 1 <= step ? 'text-amber-500 font-semibold' : 'text-gray-500');
        });

        if (step === 1) this.renderShippingForm(container);
        else if (step === 2) this.renderPaymentForm(container);
        else if (step === 3) this.renderReview(container);
    },

    // --- PASO 1: ENVÍO ---
    renderShippingForm(container) {
        const d = this.shippingData;
        container.innerHTML = `
            <h3 class="text-xl font-bold mb-6">Información de Envío</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="sm:col-span-2">
                    <label class="form-label">Nombre Completo *</label>
                    <input type="text" id="s-name" class="form-input" value="${d.fullName || ''}" placeholder="Juan Pérez" required>
                </div>
                <div class="sm:col-span-2">
                    <label class="form-label">Dirección *</label>
                    <input type="text" id="s-address" class="form-input" value="${d.address || ''}" placeholder="Calle y número" required>
                </div>
                <div class="sm:col-span-2">
                    <label class="form-label">Colonia / Referencia</label>
                    <input type="text" id="s-address2" class="form-input" value="${d.address2 || ''}" placeholder="Departamento, colonia, referencia">
                </div>
                <div>
                    <label class="form-label">Ciudad *</label>
                    <input type="text" id="s-city" class="form-input" value="${d.city || ''}" placeholder="Ciudad" required>
                </div>
                <div>
                    <label class="form-label">Estado *</label>
                    <input type="text" id="s-state" class="form-input" value="${d.state || ''}" placeholder="Estado" required>
                </div>
                <div>
                    <label class="form-label">Código Postal *</label>
                    <input type="text" id="s-zip" class="form-input" value="${d.zip || ''}" placeholder="12345" required>
                </div>
                <div>
                    <label class="form-label">País *</label>
                    <select id="s-country" class="form-select" required>
                        <option value="">Seleccionar...</option>
                        <option value="MX" ${d.country === 'MX' ? 'selected' : ''}>México</option>
                        <option value="US" ${d.country === 'US' ? 'selected' : ''}>Estados Unidos</option>
                        <option value="ES" ${d.country === 'ES' ? 'selected' : ''}>España</option>
                        <option value="AR" ${d.country === 'AR' ? 'selected' : ''}>Argentina</option>
                        <option value="CO" ${d.country === 'CO' ? 'selected' : ''}>Colombia</option>
                        <option value="PE" ${d.country === 'PE' ? 'selected' : ''}>Perú</option>
                        <option value="CL" ${d.country === 'CL' ? 'selected' : ''}>Chile</option>
                    </select>
                </div>
                <div class="sm:col-span-2">
                    <label class="form-label">Teléfono *</label>
                    <input type="tel" id="s-phone" class="form-input" value="${d.phone || ''}" placeholder="+52 55 1234 5678" required>
                </div>
            </div>
            <div class="flex justify-between mt-8">
                <button onclick="Checkout.close()" class="btn btn-secondary"><i class="fas fa-times"></i> Cancelar</button>
                <button onclick="Checkout.nextShipping()" class="btn btn-primary">
                    Continuar al Pago <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
    },

    nextShipping() {
        const fields = {
            fullName: document.getElementById('s-name')?.value.trim(),
            address: document.getElementById('s-address')?.value.trim(),
            address2: document.getElementById('s-address2')?.value.trim(),
            city: document.getElementById('s-city')?.value.trim(),
            state: document.getElementById('s-state')?.value.trim(),
            zip: document.getElementById('s-zip')?.value.trim(),
            country: document.getElementById('s-country')?.value,
            phone: document.getElementById('s-phone')?.value.trim()
        };
        if (!fields.fullName || !fields.address || !fields.city || !fields.state || !fields.zip || !fields.country || !fields.phone) {
            Toast.show('Completa todos los campos obligatorios', 'error');
            return;
        }
        this.shippingData = fields;
        this.renderStep(2);
    },

    // --- PASO 2: PAGO ---
    renderPaymentForm(container) {
        const p = this.paymentData;
        const method = p.method || 'card';
        container.innerHTML = `
            <h3 class="text-xl font-bold mb-6">Método de Pago</h3>
            <div class="space-y-4 mb-6">
                <label class="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all
                    ${method === 'card' ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 hover:border-zinc-500'}">
                    <input type="radio" name="payment" value="card" ${method === 'card' ? 'checked' : ''} onchange="Checkout.selectPayment('card')" class="accent-amber-500">
                    <i class="fas fa-credit-card text-xl text-amber-500"></i>
                    <div><div class="font-semibold">Tarjeta de Crédito / Débito</div><div class="text-xs text-gray-400">Visa, Mastercard, American Express</div></div>
                </label>
                <label class="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all
                    ${method === 'paypal' ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 hover:border-zinc-500'}">
                    <input type="radio" name="payment" value="paypal" ${method === 'paypal' ? 'checked' : ''} onchange="Checkout.selectPayment('paypal')" class="accent-amber-500">
                    <i class="fab fa-paypal text-xl text-blue-500"></i>
                    <div><div class="font-semibold">PayPal</div><div class="text-xs text-gray-400">Pago seguro con tu cuenta PayPal</div></div>
                </label>
                <label class="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all
                    ${method === 'transfer' ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 hover:border-zinc-500'}">
                    <input type="radio" name="payment" value="transfer" ${method === 'transfer' ? 'checked' : ''} onchange="Checkout.selectPayment('transfer')" class="accent-amber-500">
                    <i class="fas fa-university text-xl text-green-500"></i>
                    <div><div class="font-semibold">Transferencia Bancaria</div><div class="text-xs text-gray-400">Pago directo desde tu banco</div></div>
                </label>
            </div>
            <div id="payment-detail">
                ${method === 'card' ? this.cardForm(p) : method === 'paypal' ? this.paypalForm() : this.transferForm()}
            </div>
            <div class="flex justify-between mt-8">
                <button onclick="Checkout.renderStep(1)" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Volver</button>
                <button onclick="Checkout.nextPayment()" class="btn btn-primary">
                    Revisar Pedido <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
        if (method === 'card') this.initCardMask();
    },

    selectPayment(method) {
        this.paymentData.method = method;
        this.renderStep(2);
    },

    cardForm(p) {
        return `
            <div class="bg-zinc-800/50 rounded-xl p-6 space-y-4">
                <div>
                    <label class="form-label">Número de Tarjeta</label>
                    <input type="text" id="card-number" class="form-input font-mono" placeholder="1234 5678 9012 3456" maxlength="19"
                        value="${p.cardNumber || ''}" inputmode="numeric">
                </div>
                <div>
                    <label class="form-label">Titular de la Tarjeta</label>
                    <input type="text" id="card-name" class="form-input" placeholder="Como aparece en la tarjeta"
                        value="${p.cardName || ''}">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Vencimiento</label>
                        <input type="text" id="card-expiry" class="form-input font-mono" placeholder="MM/AA" maxlength="5"
                            value="${p.cardExpiry || ''}" inputmode="numeric">
                    </div>
                    <div>
                        <label class="form-label">CVV</label>
                        <input type="text" id="card-cvv" class="form-input font-mono" placeholder="123" maxlength="4"
                            value="${p.cardCvv || ''}" inputmode="numeric">
                    </div>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-400 mt-2">
                    <i class="fas fa-lock text-green-500"></i>
                    Pago 100% seguro. Tus datos están encriptados.
                </div>
            </div>
        `;
    },

    paypalForm() {
        return `
            <div class="bg-zinc-800/50 rounded-xl p-6 text-center">
                <i class="fab fa-paypal text-5xl text-blue-500 mb-4"></i>
                <p class="text-gray-400 text-sm">Serás redirigido a PayPal para completar el pago de forma segura.</p>
                <div class="mt-4 flex justify-center gap-3 text-gray-500 text-xs">
                    <span><i class="fas fa-check-circle text-green-500"></i> Pago protegido</span>
                    <span><i class="fas fa-check-circle text-green-500"></i> Sin compartir datos</span>
                </div>
            </div>
        `;
    },

    transferForm() {
        return `
            <div class="bg-zinc-800/50 rounded-xl p-6">
                <p class="text-gray-400 text-sm mb-4">Realiza el depósito a la siguiente cuenta:</p>
                <div class="space-y-2 text-sm bg-zinc-900 p-4 rounded-lg font-mono">
                    <div><span class="text-gray-500">Banco:</span> PremiumBank</div>
                    <div><span class="text-gray-500">Titular:</span> PremiumStore S.A. de C.V.</div>
                    <div><span class="text-gray-500">Cuenta:</span> 1234 5678 9012 3456</div>
                    <div><span class="text-gray-500">CLABE:</span> 012 345 678901234567</div>
                </div>
                <p class="text-xs text-gray-500 mt-4">Tu pedido se procesará una vez confirmado el pago.</p>
            </div>
        `;
    },

    initCardMask() {
        ['card-number', 'card-expiry', 'card-cvv'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', this.maskInput.bind(this, id));
        });
    },

    maskInput(id, e) {
        let val = e.target.value.replace(/\D/g, '');
        if (id === 'card-number') {
            val = val.replace(/(.{4})/g, '$1 ').trim().substring(0, 19);
        } else if (id === 'card-expiry') {
            if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
        } else if (id === 'card-cvv') {
            val = val.substring(0, 4);
        }
        e.target.value = val;
    },

    nextPayment() {
        const method = this.paymentData.method || 'card';
        if (method === 'card') {
            const cardNumber = document.getElementById('card-number')?.value.replace(/\s/g, '') || '';
            const cardName = document.getElementById('card-name')?.value.trim() || '';
            const cardExpiry = document.getElementById('card-expiry')?.value || '';
            const cardCvv = document.getElementById('card-cvv')?.value || '';
            if (cardNumber.length < 13 || !cardName || !cardExpiry || cardCvv.length < 3) {
                Toast.show('Completa todos los datos de la tarjeta', 'error');
                return;
            }
            this.paymentData = { method, cardNumber: cardNumber.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0, 19), cardName, cardExpiry, cardCvv: '***' };
        } else {
            this.paymentData.method = method;
        }
        this.renderStep(3);
    },

    // --- PASO 3: REVISAR Y CONFIRMAR ---
    renderReview(container) {
        const cart = Cart.get();
        const subtotal = Cart.getTotal();
        const shipping = Cart.getShipping();
        const total = subtotal + shipping;
        const s = this.shippingData;
        const p = this.paymentData;
        const countryName = { MX: 'México', US: 'Estados Unidos', ES: 'España', AR: 'Argentina', CO: 'Colombia', PE: 'Perú', CL: 'Chile' }[s.country] || s.country;

        const paymentLabels = {
            card: 'Tarjeta de Crédito/Débito',
            paypal: 'PayPal',
            transfer: 'Transferencia Bancaria'
        };

        container.innerHTML = `
            <h3 class="text-xl font-bold mb-6">Revisa tu Pedido</h3>
            <div class="space-y-6">
                <!-- Productos -->
                <div class="bg-zinc-800/50 rounded-xl p-4">
                    <h4 class="font-semibold mb-3 flex items-center gap-2"><i class="fas fa-box text-amber-500"></i> Productos (${cart.length})</h4>
                    <div class="space-y-3">
                        ${cart.map(item => `
                            <div class="flex justify-between text-sm">
                                <span>${item.name} <span class="text-gray-500">x${item.quantity}</span></span>
                                <span class="font-medium">$${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <!-- Envío -->
                <div class="bg-zinc-800/50 rounded-xl p-4">
                    <h4 class="font-semibold mb-3 flex items-center gap-2"><i class="fas fa-map-marker-alt text-amber-500"></i> Dirección de Envío</h4>
                    <p class="text-sm text-gray-300">${s.fullName}</p>
                    <p class="text-sm text-gray-400">${s.address}${s.address2 ? ', ' + s.address2 : ''}</p>
                    <p class="text-sm text-gray-400">${s.city}, ${s.state}, CP ${s.zip}</p>
                    <p class="text-sm text-gray-400">${countryName}</p>
                    <p class="text-sm text-gray-400">${s.phone}</p>
                </div>
                <!-- Pago -->
                <div class="bg-zinc-800/50 rounded-xl p-4">
                    <h4 class="font-semibold mb-3 flex items-center gap-2"><i class="fas fa-credit-card text-amber-500"></i> Método de Pago</h4>
                    <p class="text-sm text-gray-300">${paymentLabels[p.method] || p.method}</p>
                    ${p.method === 'card' ? `<p class="text-sm text-gray-400">${p.cardName} - ${p.cardNumber}</p>` : ''}
                </div>
                <!-- Totales -->
                <div class="bg-zinc-800/50 rounded-xl p-4">
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between"><span class="text-gray-400">Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
                        <div class="flex justify-between"><span class="text-gray-400">Envío</span><span>${shipping === 0 ? '<span class="text-green-500">Gratis</span>' : '$' + shipping.toFixed(2)}</span></div>
                        <div class="border-t border-zinc-700 pt-2 flex justify-between font-bold text-lg"><span>Total</span><span class="text-amber-500">$${total.toFixed(2)}</span></div>
                    </div>
                </div>
            </div>
            <div class="flex justify-between mt-8">
                <button onclick="Checkout.renderStep(2)" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Volver</button>
                <button onclick="Checkout.confirmOrder()" class="btn btn-primary btn-lg">
                    <i class="fas fa-check-circle"></i> Confirmar Pedido
                </button>
            </div>
        `;
    },

    async confirmOrder() {
        const btn = document.querySelector('#checkout-content .btn-primary');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'; }

        try {
            const { user } = await Auth.getCurrentUser();
            if (!user) throw new Error('Debes iniciar sesión');

            const cart = Cart.get();
            const subtotal = Cart.getTotal();
            const shipping = Cart.getShipping();
            const total = subtotal + shipping;
            const orderNumber = 'PS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

            const orderData = {
                orderNumber,
                date: new Date().toISOString(),
                items: cart,
                subtotal,
                shippingCost: shipping,
                total,
                shippingInfo: this.shippingData,
                paymentMethod: this.paymentData.method,
                status: 'confirmed',
                userId: user.id,
                userEmail: user.email
            };

            // Guardar en localStorage
            const ordersKey = 'ecommerce_orders_' + user.id;
            const existingOrders = JSON.parse(localStorage.getItem(ordersKey)) || [];
            existingOrders.unshift(orderData);
            localStorage.setItem(ordersKey, JSON.stringify(existingOrders));

            // Intentar guardar en Supabase
            try {
                await supabaseClient.from('orders').insert([{
                    user_id: user.id,
                    order_number: orderNumber,
                    items: cart,
                    subtotal,
                    shipping_cost: shipping,
                    total,
                    shipping_info: this.shippingData,
                    payment_method: this.paymentData.method,
                    status: 'confirmed'
                }]);
            } catch (supaErr) {
                // Fallback: solo localStorage
                console.log('Orden guardada localmente (Supabase no disponible)');
            }

            // Limpiar carrito
            Cart.clear();

            // Mostrar confirmación
            this.showConfirmation(orderData, cart);
        } catch (err) {
            Toast.show('Error al procesar: ' + err.message, 'error');
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Pedido'; }
        }
    },

    showConfirmation(order, items) {
        const container = document.getElementById('checkout-content');
        const dots = document.querySelectorAll('.step-dot, .step-label');
        dots.forEach(d => d.style.display = 'none');

        const subtotal = order.subtotal;
        const shipping = order.shippingCost;
        const total = order.total;

        container.innerHTML = `
            <div class="text-center py-6 animate-scale-in">
                <div class="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <i class="fas fa-check-circle text-5xl text-green-500"></i>
                </div>
                <h2 class="text-2xl font-extrabold mb-2">¡Pedido Confirmado!</h2>
                <p class="text-gray-400 mb-6">Gracias por tu compra, ${this.shippingData.fullName}.</p>
                <div class="bg-zinc-800/50 rounded-xl p-6 max-w-md mx-auto text-left mb-6">
                    <div class="flex justify-between items-center mb-4 pb-4 border-b border-zinc-700">
                        <span class="text-gray-400 text-sm">Nº de Pedido</span>
                        <span class="font-bold text-amber-500 text-lg">${order.orderNumber}</span>
                    </div>
                    <div class="space-y-2 text-sm">
                        ${order.items.map(item => `
                            <div class="flex justify-between">
                                <span>${item.name} <span class="text-gray-500">x${item.quantity}</span></span>
                                <span>$${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="border-t border-zinc-700 mt-4 pt-4 space-y-1 text-sm">
                        <div class="flex justify-between"><span class="text-gray-400">Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
                        <div class="flex justify-between"><span class="text-gray-400">Envío</span><span>${shipping === 0 ? '<span class="text-green-500">Gratis</span>' : '$' + shipping.toFixed(2)}</span></div>
                        <div class="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-zinc-700">
                            <span>Total</span><span class="text-amber-500">$${total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="mt-4 p-3 bg-amber-500/10 rounded-lg text-sm">
                        <p class="text-amber-500 font-semibold flex items-center gap-2">
                            <i class="fas fa-info-circle"></i> Simulación de compra
                        </p>
                        <p class="text-gray-400 text-xs mt-1">Este es un entorno de demostración. No se ha realizado ningún cobro real.</p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-3 justify-center">
                    <a href="orders.html" class="btn btn-primary">
                        <i class="fas fa-receipt"></i> Ver Mis Pedidos
                    </a>
                    <a href="catalog.html" class="btn btn-secondary">
                        <i class="fas fa-shopping-bag"></i> Seguir Comprando
                    </a>
                </div>
            </div>
        `;

        // Ocultar botón de cerrar y cambiar el header
        document.querySelector('#checkout-header .modal-close').style.display = 'none';
        document.querySelector('#checkout-header .modal-title').textContent = '✓ Compra Exitosa';
    }
};

// ============================================================
// ÓRDENES - GESTIÓN Y VISUALIZACIÓN
// ============================================================
const Orders = {
    // Obtener órdenes del usuario
    async getAll() {
        const { user } = await Auth.getCurrentUser();
        if (!user) return [];

        // Primero intentar desde Supabase
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            if (!error && data && data.length > 0) {
                return data.map(o => ({
                    orderNumber: o.order_number,
                    date: o.created_at,
                    items: o.items,
                    subtotal: o.subtotal,
                    shippingCost: o.shipping_cost,
                    total: o.total,
                    shippingInfo: o.shipping_info,
                    paymentMethod: o.payment_method,
                    status: o.status,
                    userId: o.user_id
                }));
            }
        } catch {}

        // Fallback a localStorage
        const localOrders = localStorage.getItem('ecommerce_orders_' + user.id);
        return localOrders ? JSON.parse(localOrders) : [];
    },

    // Renderizar lista de órdenes
    async render(container) {
        if (!container) return;
        showSpinner(container);

        const orders = await this.getAll();
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-20">
                    <i class="fas fa-receipt text-6xl text-gray-700 mb-6"></i>
                    <h3 class="text-xl font-semibold mb-2">No tienes pedidos aún</h3>
                    <p class="text-gray-400 mb-6">Realiza tu primera compra para ver tus pedidos aquí</p>
                    <a href="catalog.html" class="btn btn-primary"><i class="fas fa-shopping-bag"></i> Ir al Catálogo</a>
                </div>
            `;
            return;
        }

        const statusColors = {
            confirmed: 'bg-amber-500/20 text-amber-500',
            processing: 'bg-blue-500/20 text-blue-500',
            shipped: 'bg-purple-500/20 text-purple-500',
            delivered: 'bg-green-500/20 text-green-500',
            cancelled: 'bg-red-500/20 text-red-500'
        };
        const statusLabels = {
            confirmed: 'Confirmado',
            processing: 'Procesando',
            shipped: 'Enviado',
            delivered: 'Entregado',
            cancelled: 'Cancelado'
        };

        container.innerHTML = orders.map(o => `
            <div class="bg-card border border-zinc-800 rounded-xl p-6 hover:border-amber-500/30 transition-all animate-fade-in">
                <div class="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                        <span class="text-xs text-gray-500">PEDIDO</span>
                        <p class="font-bold text-amber-500">${o.orderNumber}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs text-gray-500">FECHA</span>
                        <p class="text-sm">${new Date(o.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                <div class="flex flex-wrap justify-between items-center gap-4">
                    <div class="text-sm text-gray-400">
                        ${o.items.length} producto(s) — Total: <span class="text-white font-semibold">$${Number(o.total).toFixed(2)}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColors[o.status] || 'bg-gray-500/20 text-gray-400'}">
                            ${statusLabels[o.status] || o.status}
                        </span>
                        <button onclick="Orders.showDetail('${o.orderNumber}')" class="btn btn-outline btn-sm">
                            <i class="fas fa-eye"></i> Detalle
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Mostrar detalle en modal
    async showDetail(orderNumber) {
        const orders = await this.getAll();
        const order = orders.find(o => o.orderNumber === orderNumber);
        if (!order) return;

        const overlay = document.getElementById('order-detail-overlay');
        if (!overlay) return;

        const s = order.shippingInfo || {};
        const countryName = { MX: 'México', US: 'Estados Unidos', ES: 'España', AR: 'Argentina', CO: 'Colombia', PE: 'Perú', CL: 'Chile' }[s.country] || s.country || '';

        const statusLabels = {
            confirmed: 'Confirmado', processing: 'Procesando', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado'
        };

        document.getElementById('order-detail-content').innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="text-xs text-gray-500">PEDIDO</span>
                        <p class="font-bold text-amber-500 text-lg">${order.orderNumber}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-500">${statusLabels[order.status] || order.status}</span>
                </div>
                <p class="text-sm text-gray-400">${new Date(order.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

                <div class="border-t border-zinc-700 pt-4">
                    <h4 class="font-semibold text-sm mb-2 flex items-center gap-2"><i class="fas fa-box text-amber-500"></i> Productos</h4>
                    <div class="space-y-2">
                        ${(order.items || []).map(item => `
                            <div class="flex justify-between text-sm">
                                <span>${item.name} <span class="text-gray-500">x${item.quantity}</span></span>
                                <span>$${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="border-t border-zinc-700 pt-4">
                    <h4 class="font-semibold text-sm mb-2 flex items-center gap-2"><i class="fas fa-map-marker-alt text-amber-500"></i> Envío</h4>
                    <p class="text-sm text-gray-300">${s.fullName || ''}</p>
                    <p class="text-sm text-gray-400">${s.address || ''}${s.address2 ? ', ' + s.address2 : ''}</p>
                    <p class="text-sm text-gray-400">${s.city || ''}${s.state ? ', ' + s.state : ''}${s.zip ? ', CP ' + s.zip : ''}</p>
                    <p class="text-sm text-gray-400">${countryName}</p>
                </div>

                <div class="border-t border-zinc-700 pt-4">
                    <div class="space-y-1 text-sm">
                        <div class="flex justify-between"><span class="text-gray-400">Subtotal</span><span>$${Number(order.subtotal).toFixed(2)}</span></div>
                        <div class="flex justify-between"><span class="text-gray-400">Envío</span><span>${Number(order.shippingCost) === 0 ? '<span class="text-green-500">Gratis</span>' : '$' + Number(order.shippingCost).toFixed(2)}</span></div>
                        <div class="flex justify-between font-bold text-lg border-t border-zinc-700 pt-2 mt-2">
                            <span>Total</span><span class="text-amber-500">$${Number(order.total).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div class="p-3 bg-amber-500/10 rounded-lg text-sm mt-2">
                    <p class="text-amber-500 font-semibold flex items-center gap-2">
                        <i class="fas fa-info-circle"></i> Simulación
                    </p>
                    <p class="text-gray-400 text-xs">Este es un entorno de demostración. No se ha realizado ningún cobro real.</p>
                </div>
            </div>
        `;
        overlay.classList.add('active');
    }
};

// Exponer globalmente para inline event handlers
window.Cart = Cart;
window.Checkout = Checkout;
window.Orders = Orders;
