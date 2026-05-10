const express = require('express');
const cors = require('cors'); // Para permitir que el front se comunique con el back
const app = express();
const PORT = 3000;

// Middleware (Unidad 4.4 - Manejo de Objetos del Servidor)
app.use(cors());
app.use(express.json()); // Para que el servidor entienda datos en formato JSON

// Datos de ejemplo (Luego vendrán de PostgreSQL en la Unidad 4.6)
let productosRopa = [
    { id: 1, nombre: "Chaqueta de Cuero", precio: 1500, categoria: "Ropa", stock: 5 },
    { id: 2, nombre: "Collar de Plata", precio: 800, categoria: "Accesorios", stock: 12 }
];

// Ruta para obtener productos (Unidad 4.3 - Tratamiento de datos)
app.get('/api/productos', (req, res) => {
    res.json(productosRopa);
});

// Ruta para procesar una compra
app.post('/api/comprar', (req, res) => {
    const pedido = req.body; // Aquí recibimos lo que el usuario tiene en su carrito
    console.log("Pedido recibido:", pedido);
    res.status(201).send({ mensaje: "Compra procesada con éxito" });
});

app.listen(PORT, () => {
    console.log(`Servidor de la tienda corriendo en http://localhost:${PORT}`);
});