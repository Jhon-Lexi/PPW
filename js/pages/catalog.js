import { getProducts } from '../services/products.js';

let cart = JSON.parse(localStorage.getItem('bttf_cart')) || [];

export async function renderCatalog(container) {
    container.innerHTML = `<h2 class="neon-text">Cargando inventario temporal...</h2>`;
    
    const response = await getProducts();
    
    // Fallback de datos de prueba usando el ID estable de picsum para que no se caigan las imágenes
    const products = response.success && response.data.length > 0 ? response.data : [
        { id: 1, name: "Capacitor de Flujo", 
        price: 1200, 
        image_url: "https://i.redd.it/kkmffuh6pl731.jpg", 
        description: "Hace posible los viajes en el tiempo. Requiere 1.21 GW." },

        { id: 2, name: "Hoverboard (2015)",
         price: 350, image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKvbdWOIKTUO7UY3WImHpjq4L4SF8LFYnJNA&s", 
         description: "¡Vuela! No funciona sobre el agua a menos que tengas potencia incorporada." },

        { id: 3, name: "Almanaque Deportivo",
         price: 45, image_url: "https://m.media-amazon.com/images/I/71HRDZ5Lm0L.jpg", 
         description: "Contiene todos los resultados deportivos de la segunda mitad del siglo XX." }
    ];

    let productsHtml = products.map(p => `
        <div class="product-card">
            <img src="${p.image_url}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>${p.description || p.desc || 'Sin descripción disponible.'}</p>
            <span class="price">$${p.price} USD</span>
            <button class="btn-add-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">Añadir al Carrito</button>
        </div>
    `).join('');

    container.innerHTML = `
        <h2 class="neon-text" style="margin-bottom: 20px;">Catálogo del Pasado, Presente y Futuro</h2>
        <div class="catalog-grid">${productsHtml}</div>
        
        <div class="cart-preview">
            <h3>Tu Orden de Compra Temporal</h3>
            <div id="cart-items" style="margin-top:15px;"></div>
            <button id="btn-checkout" class="btn-neon" style="margin-top:20px; width:100%;">Procesar Compra</button>
        </div>
    `;

    // Asignación corregida usando selectores del contenedor actual
    container.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const item = {
                id: e.target.getAttribute('data-id'),
                name: e.target.getAttribute('data-name'),
                price: parseFloat(e.target.getAttribute('data-price'))
            };
            cart.push(item);
            localStorage.setItem('bttf_cart', JSON.stringify(cart));
            updateCartUI();
        });
    });

    container.querySelector('#btn-checkout').addEventListener('click', () => {
        const userSession = localStorage.getItem('supabase_session'); 
        if (!userSession) {
            alert("🚨 ¡Error de paradoja! Debes iniciar sesión en tu cuenta para poder procesar la orden.");
            window.location.hash = '#/auth';
        } else {
            alert("⚡ ¡Compra procesada con éxito! La mercancía ha sido enviada a tu época correspondiente.");
            cart = [];
            localStorage.removeItem('bttf_cart');
            updateCartUI();
        }
    });

    updateCartUI();
}

function updateCartUI() {
    const countContainer = document.getElementById('cart-count');
    if (countContainer) countContainer.innerText = cart.length;

    const itemsContainer = document.getElementById('cart-items');
    if (itemsContainer) {
        itemsContainer.innerHTML = cart.length === 0 ? '<p style="color:#777;">El carrito está vacío.</p>' : 
            cart.map(i => `<div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #222; padding-bottom:4px;"><span>⚡ ${i.name}</span><span style="color:var(--bttf-yellow); font-family:var(--digital-font);">$${i.price}</span></div>`).join('');
    }
}