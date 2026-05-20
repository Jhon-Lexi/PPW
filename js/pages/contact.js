export function renderContact(container) {
    container.innerHTML = `
        <div class="contact-container">
            <h2 class="neon-text">Contáctanos en el Tiempo</h2>
            <form id="contact-form">
                <input type="text" placeholder="Tu Nombre" required>
                <input type="email" placeholder="Tu Email Temporal" required>
                <textarea placeholder="¿En qué año te quedaste varado?" required></textarea>
                <button type="submit" class="btn-neon">Enviar Señal de Radio</button>
            </form>

            <div class="map-container">
                <h3>Nuestras Oficinas Centrales (Hill Valley Clock Tower)</h3>
                <!-- Mapa de Google Maps integrado -->
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3305.514781483863!2d-118.3414987!3d34.1370848!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2be37a13c9e9b%3A0x6b7722ab9122a6!2sUniversal%20Studios%20Hollywood!5e0!3m2!1ses!2smx!4v1700000000000!5m2!1ses!2smx" 
                    width="100%" 
                    height="300" 
                    style="border:0; border-radius: 8px; margin-top: 20px;" 
                    allowfullscreen="" 
                    loading="lazy">
                </iframe>
            </div>
        </div>
    `;
}