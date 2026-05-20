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
                    <input type="text" placeholder="Nombre del Objeto" required>
                    <input type="number" placeholder="Precio" required>
                    <input type="text" placeholder="URL de la Imagen" required>
                    <button type="submit" class="btn-neon">Inyectar en la Base de Datos</button>
                </form>
            </div>
        </div>
    `;
}