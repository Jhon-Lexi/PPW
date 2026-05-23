// Simulación de base de datos de productos (Posteriormente vendrán de Supabase)
const mockProducts = [
    { id: 1,
    name: "Capacitor de Flujo", 
    price: 1200,
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1nqDrOu5iF7S02P35fzuG6Ot5q-A6D0SLYA&s", 
    desc: "Hace posible los viajes en el tiempo." },
    { id: 2, 
    name: "Hoverboard (2015)", 
    price: 350, 
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKvbdWOIKTUO7UY3WImHpjq4L4SF8LFYnJNA&s", 
    desc: "¡Vuela! No funciona sobre el agua a menos que tengas potencia." },
    { id: 3, 
    name: "Plutonio ", 
    price: 5000, 
    img: "https://preview.redd.it/would-the-radiation-from-the-plutonium-have-on-an-effect-on-v0-r15bn0azs6df1.jpg?width=640&crop=smart&auto=webp&s=0f8245bdf48ef7bda0c0a3514f7e55f25f20e7e1", 
    desc: "Genera los 1.21 GW necesarios." }
];

let cart = JSON.parse(localStorage.getItem('bttf_cart')) || [];

export function renderCatalog(container) {
    let productsHtml = mockProducts.map(p => `
        <div class="product-card">
            <img src="${p.img}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>${p.desc}</p>
            <span class="price">$${p.price} USD</span>
            <button class="btn-add-cart" data-id="${p.id}">Añadir al Carrito</button>
        </div>
    `).join('');

    container.innerHTML = `
        <h2 class="neon-text">Catálogo del Pasado, Presente y Futuro</h2>
        <div class="catalog-grid">${productsHtml}</div>
        
        <div class="cart-preview" id="cart-preview">
            <h3>Tu Orden de Compra</h3>
            <div id="cart-items"></div>
            <button id="btn-checkout" class="btn-neon">Procesar Compra</button>
        </div>
    `;

    // Escuchadores de eventos para los botones de compra
    container.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            addToCart(id);
        });
    });

    document.getElementById('btn-checkout').addEventListener('click', handleCheckout);
    updateCartUI();
}

function addToCart(id) {
    const product = mockProducts.find(p => p.id === id);
    cart.push(product);
    localStorage.setItem('bttf_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const countContainer = document.getElementById('cart-count');
    if(countContainer) countContainer.innerText = cart.length;
}

function handleCheckout() {
    // Comprobamos si el usuario tiene sesión activa en Supabase / LocalStorage
    const userSession = localStorage.getItem('supabase_session'); 
    if (!userSession) {
        alert("🚨 ¡Error de paradoja temporal! Debes iniciar sesión o registrarte para realizar la compra.");
        window.location.hash = '#/auth';
    } else {
        alert("⚡ ¡Compra exitosa! Tus productos han sido enviados a través de una grieta espacio-temporal.");
        cart = [];
        localStorage.removeItem('bttf_cart');
        updateCartUI();
    }
}