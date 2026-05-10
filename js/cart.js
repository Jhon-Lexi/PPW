// js/cart.js

// El "Estado" de nuestro carrito
let carrito = [];

// Función para agregar productos (Se llama desde el botón en main.js)
function agregarAlCarrito(id) {
    // Buscamos si el producto ya existe en los datos (simulados en main.js)
    const producto = productos.find(p => p.id === id);
    
    if (producto) {
        carrito.push(producto);
        actualizarInterfazCarrito();
        console.log(`Añadido: ${producto.nombre}`);
    }
}

// Función para actualizar la UI (Unidad 3.4 - Manipulación de Objetos)
function actualizarInterfazCarrito() {
    const contador = document.getElementById('cart-count');
    
    // Actualizamos el número en el icono del header
    contador.innerText = carrito.length;
    
    // Animación simple para que el usuario note el cambio
    contador.style.transform = "scale(1.2)";
    setTimeout(() => contador.style.transform = "scale(1)", 200);
}

// Función para calcular el total (útil para la Unidad 4 más adelante)
function calcularTotal() {
    return carrito.reduce((total, p) => total + p.price, 0);
}