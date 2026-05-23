import { addProduct } from '../services/products.js';

export function renderAdmin(container) {
    container.innerHTML = `
        <div class="admin-dashboard">
            <h2 class="neon-text">PANEL DE CONTROL - MCFLY ENTERPRISES</h2>
            <div class="metrics-grid">
                <div class="metric-card"><h4>Ventas en 1985</h4><p>$15,430 USD</p></div>
                <div class="metric-card"><h4>Ventas en 2015</h4><p>$84,120 Credits</p></div>
                <div class="metric-card"><h4>Estado del Generador</h4><p style="color: var(--bttf-cyan);">1.21 GW [ESTABLE]</p></div>
            </div>
            
            <div class="add-product-admin">
                <h3>Insertar Nuevo Artefacto al Catálogo</h3>
                <form id="admin-product-form">
                    <input type="text" id="admin-p-name" placeholder="Nombre del Objeto" required>
                    <input type="number" id="admin-p-price" placeholder="Precio en USD" required>
                    <input type="text" id="admin-p-img" placeholder="URL de la Imagen (ej: https://picsum.photos/id/237/280/180)" required>
                    <textarea id="admin-p-desc" placeholder="Descripción de las propiedades temporales del artefacto..." style="background: #0d0d13; border: 1px solid #444; color: #fff; padding: 12px; border-radius: 4px; resize: vertical; min-height:80px;" required></textarea>
                    <button type="submit" class="btn-neon" style="width:100%;">Inyectar en Base de Datos</button>
                </form>
                <div id="admin-msg" style="margin-top:15px; font-weight:bold;"></div>
            </div>
        </div>
    `;

    const form = container.querySelector('#admin-product-form');
    const msg = container.querySelector('#admin-msg');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msg.style.color = 'var(--bttf-yellow)';
        msg.innerText = "Sincronizando registros con Supabase...";

        const newProduct = {
            name: container.querySelector('#admin-p-name').value,
            price: parseFloat(container.querySelector('#admin-p-price').value),
            image_url: container.querySelector('#admin-p-img').value,
            description: container.querySelector('#admin-p-desc').value
        };

        const result = await addProduct(newProduct);
        if (result.success) {
            msg.style.color = 'var(--bttf-cyan)';
            msg.innerText = "⚡ ¡Artefacto guardado con éxito en el continuo espacio-tiempo!";
            form.reset();
        } else {
            msg.style.color = 'red';
            msg.innerText = `🚨 Error de Inserción: ${result.error}`;
        }
    });
}