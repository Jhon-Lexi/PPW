async function cargarProductosDesdeServidor() {
    try {
        // Hacemos la petición a nuestro servidor de Node.js
        const respuesta = await fetch('http://localhost:3000/api/productos');
        const productos = await respuesta.json();
        
        const grid = document.getElementById('product-grid');
        grid.innerHTML = ''; // Limpiar grid

        productos.forEach(prod => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            card.innerHTML = `
                <h3>${prod.nombre}</h3>
                <p>$${prod.precio}</p>
                <button class="btn-add" onclick="agregarAlCarrito(${prod.id})">Agregar</button>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
    }
}

document.addEventListener('DOMContentLoaded', cargarProductosDesdeServidor);