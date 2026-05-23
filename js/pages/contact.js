export function renderContact(container) {
    container.innerHTML = `
        <div class="contact-container">
            <div>
                <h2 class="neon-text" style="margin-bottom:20px;">Contáctanos en el Tiempo</h2>
                <form id="contact-form">
                    <input type="text" placeholder="Tu Nombre" required>
                    <input type="email" placeholder="Tu Email Temporal" required>
                    <textarea placeholder="¿En qué año te quedaste varado y qué piezas necesitas?" rows="5" style="background: #0d0d13; border: 1px solid #444; color: #fff; padding: 12px; border-radius: 4px; resize:none;" required></textarea>
                    <button type="submit" class="btn-neon">Enviar Señal de Radio</button>
                </form>
            </div>

            <div>
                <h3 class="cyan-neon" style="margin-bottom:20px;">Ubicación: Hill Valley Clock Tower</h3>
                <div style="width: 100%; height: 320px; background: #111; border: 2px solid var(--bttf-cyan); border-radius:8px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:20px;">
                    <i class="fas fa-clock" style="font-size:3rem; color:var(--bttf-yellow); margin-bottom:15px;"></i>
                    <p style="font-weight:bold;">Hill Valley, CA 95420</p>
                    <p style="color:#666; font-size:0.85rem; margin-top:5px;">Nota: Rayo previsto para el sábado a las 10:04 PM</p>
                </div>
            </div>
        </div>
    `;
    
    container.querySelector('#contact-form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert("📡 ¡Señal enviada con éxito! Espera el Delorean de soporte.");
        e.target.reset();
    });
}