// ============================================================
// CHATBOT INTELIGENTE - PremiumStore
// ============================================================
// Sistema híbrido: respuestas predefinidas + IA opcional.
// Para activar la IA, agrega tu API Key de OpenAI en
// la sección CONFIG más abajo.
// ============================================================

(function () {

    // ---------- CONFIG ----------
    const CONFIG_AI = {
        enabled: false,         // Cambia a true y agrega tu key
        apiKey: '',             // OpenAI API Key
        model: 'gpt-4o-mini',   // Modelo a usar
        systemPrompt: 'Eres un asistente de ventas de PremiumStore, una tienda online premium. Responde de forma amable, profesional y concisa en español. Si no sabes algo, sugiere contactar al equipo de soporte.'
    };

    // ---------- PREGUNTAS FRECUENTES ----------
    const FAQ = {
        envio: {
            keywords: ['envío', 'envio', 'shipping', 'entrega', 'llegar', 'demora', 'tarda', 'cuándo', 'cuando', 'días', 'dias'],
            answer: `🚚 **Información de Envíos**\n\n• Envío gratis en compras mayores a **$100 USD**\n• Tiempo de entrega estimado: **3-7 días hábiles**\n• Envíos a todo México y principales ciudades de Latinoamérica\n• Recibirás un número de seguimiento una vez enviado tu pedido\n\n¿Necesitas algo más específico?`
        },
        pago: {
            keywords: ['pago', 'pagar', 'tarjeta', 'crédito', 'credito', 'débito', 'debito', 'paypal', 'transferencia', 'metodo', 'método'],
            answer: `💳 **Métodos de Pago**\n\n• **Tarjetas de crédito/débito**: Visa, Mastercard, American Express\n• **PayPal**: Pago seguro con tu cuenta PayPal\n• **Transferencia bancaria**: Depósito directo a nuestra cuenta\n\n✅ Todos los pagos son 100% seguros y encriptados.\n\n¿Te ayudo con algo más?`
        },
        devolucion: {
            keywords: ['devolución', 'devolucion', 'return', 'reembolso', 'reembols', 'cambio', 'cancelar', 'cancelación', 'cancelacion', 'garantía', 'garantia'],
            answer: `🔄 **Política de Devoluciones**\n\n• **30 días** para devolver cualquier producto\n• El producto debe estar en su estado original\n• Reembolso completo en tu método de pago\n• Cambios gratuitos por talla o color\n• Para iniciar, contáctanos en la página de Contacto\n\n¿Necesitas más detalles?`
        },
        pedido: {
            keywords: ['pedido', 'orden', 'order', 'estado', 'status', 'seguimiento', 'tracking', 'rastrear', 'dónde', 'donde', 'mi compra'],
            answer: `📦 **Seguimiento de Pedidos**\n\n1. Inicia sesión en tu cuenta\n2. Ve a **"Mis Pedidos"** en el menú de usuario\n3. Allí verás el estado actualizado de tu orden\n4. Cada pedido tiene un número único de seguimiento\n\nSi tienes problemas, escríbenos en la página de Contacto.`
        },
        producto: {
            keywords: ['producto', 'product', 'disponible', 'stock', 'agotado', 'precio', 'cuánto', 'cuanto', 'categoría', 'categoria', 'recomiendas', 'sugieres'],
            answer: `🛍️ **Sobre nuestros Productos**\n\n• Todos nuestros productos son seleccionados con los más altos estándares de calidad\n• Puedes filtrar por categoría, precio y buscar por nombre en nuestro Catálogo\n• El stock se actualiza en tiempo real\n• Si un producto está agotado, puedes consultarnos para saber cuándo estará disponible\n\n¿Quieres que te recomiende algo?`
        },
        cuenta: {
            keywords: ['cuenta', 'registro', 'registrarme', 'login', 'sesión', 'sesion', 'usuario', 'contraseña', 'contrasena', 'olvidé', 'olvide', 'perfil'],
            answer: `👤 **Gestión de Cuenta**\n\n• **Registrarte** es rápido y gratuito\n• Solo necesitas un email y una contraseña\n• Desde tu perfil puedes ver tus pedidos y datos\n• Si olvidaste tu contraseña, puedes restablecerla desde la pantalla de inicio de sesión\n\n¿Necesitas ayuda con algo de tu cuenta?`
        },
        contacto: {
            keywords: ['contacto', 'contactar', 'hablar', 'soporte', 'ayuda', 'teléfono', 'telefono', 'whatsapp', 'email', 'correo', 'dirección', 'direccion', 'ubicación', 'ubicacion'],
            answer: `📞 **¿Cómo contactarnos?**\n\n• **Email**: hola@premiumstore.mx\n• **Teléfono**: +52 (55) 1234-5678\n• **WhatsApp**: +52 55 1234 5678\n• **Horario**: Lun-Vie 9AM-7PM, Sáb 10AM-4PM\n• **Dirección**: Av. Principal 1234, Col. Centro, CDMX\n\nTambién puedes usar nuestro formulario de Contacto. ¡Te responderemos en menos de 24h!`
        },
        saludo: {
            keywords: ['hola', 'buenos días', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'saludos', 'qué tal', 'que tal', 'buen día', 'buen dia'],
            answer: `¡Hola! 👋 Soy el asistente virtual de **PremiumStore**.\n\nEstoy aquí para ayudarte con:\n✅ Información de productos\n✅ Estado de tu pedido\n✅ Envíos y devoluciones\n✅ Métodos de pago\n✅ Cualquier otra duda\n\n¿En qué puedo ayudarte hoy?`
        },
        gracias: {
            keywords: ['gracias', 'thank', 'thanks', 'graci', 'muchas gracias', 'muchas gracia', 'te agradezco'],
            answer: `¡De nada! 😊 Me alegra mucho poder ayudarte.\n\nSi tienes cualquier otra duda, aquí estoy. ¡Que tengas un excelente día! 🌟`
        },
        horario: {
            keywords: ['horario', 'horarios', 'abierto', 'abren', 'cierran', 'atención', 'atencion', 'días', 'dias laborales'],
            answer: `🕐 **Horario de Atención**\n\n• **Lunes a Viernes**: 9:00 AM - 7:00 PM\n• **Sábados**: 10:00 AM - 4:00 PM\n• **Domingos**: Cerrado\n\nFuera de horario, déjanos tu mensaje y te responderemos al siguiente día hábil.`
        }
    };

    // ---------- RESPUESTA POR DEFECTO ----------
    const DEFAULT_RESPONSE = `No estoy seguro de haber entendido tu pregunta. 🤔\n\nPuedo ayudarte con:\n\n• **Envíos** 🚚 — Costos, tiempos y cobertura\n• **Pagos** 💳 — Métodos y seguridad\n• **Devoluciones** 🔄 — Política y cambios\n• **Pedidos** 📦 — Estado y seguimiento\n• **Productos** 🛍️ — Disponibilidad y recomendaciones\n• **Cuenta** 👤 — Registro y acceso\n• **Contacto** 📞 — Cómo contactarnos\n\nO escríbeme con más detalle y con gusto te ayudo.`;

    // ---------- ESTADO DEL CHAT ----------
    let messages = [];
    let isOpen = false;

    // ---------- FUNCIONES DE RESPUESTA ----------
    function findBestAnswer(userMessage) {
        const msg = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Buscar coincidencia por palabras clave
        let bestMatch = null;
        let bestScore = 0;

        for (const [key, faq] of Object.entries(FAQ)) {
            const score = faq.keywords.filter(kw => msg.includes(kw)).length;
            if (score > bestScore) {
                bestScore = score;
                bestMatch = faq;
            }
        }

        if (bestMatch && bestScore > 0) {
            return bestMatch.answer;
        }

        return DEFAULT_RESPONSE;
    }

    // ---------- CHATBOT UI ----------
    function createChatbot() {
        if (document.getElementById('ps-chatbot')) return;

        const container = document.createElement('div');
        container.id = 'ps-chatbot';
        container.innerHTML = `
            <div class="ps-chatbot-toggle" id="ps-chat-toggle" role="button" tabindex="0"
                aria-label="Abrir asistente virtual" title="Abrir chat">
                <i class="fas fa-comment-dots"></i>
            </div>
            <div class="ps-chatbot-window" id="ps-chat-window" role="dialog" aria-label="Ventana de chat con asistente virtual">
                <div class="ps-chatbot-header">
                    <div class="ps-chatbot-header-info">
                        <div class="ps-chatbot-avatar" aria-hidden="true">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div>
                            <div class="ps-chatbot-name">PremiumBot</div>
                            <div class="ps-chatbot-status" aria-live="polite">● En línea</div>
                        </div>
                    </div>
                    <button class="ps-chatbot-close" id="ps-chat-close" aria-label="Cerrar chat">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="ps-chatbot-messages" id="ps-chat-messages" role="log" aria-label="Mensajes del chat" aria-live="polite">
                    <div class="ps-message ps-message-bot">
                        <div class="ps-message-content">
                            ¡Hola! 👋 Soy el asistente virtual de <strong>PremiumStore</strong>.<br><br>
                            ¿En qué puedo ayudarte hoy?
                        </div>
                        <div class="ps-message-time">Ahora</div>
                    </div>
                </div>
                <div class="ps-chatbot-quick-actions" id="ps-quick-actions" role="group" aria-label="Acciones rápidas">
                    <button onclick="Chatbot.sendQuick('¿Cuánto tarda el envío?')" aria-label="Consultar envíos">🚚 Envíos</button>
                    <button onclick="Chatbot.sendQuick('¿Qué métodos de pago aceptan?')" aria-label="Consultar métodos de pago">💳 Pagos</button>
                    <button onclick="Chatbot.sendQuick('¿Cómo hago una devolución?')" aria-label="Consultar devoluciones">🔄 Devoluciones</button>
                    <button onclick="Chatbot.sendQuick('¿Dónde está mi pedido?')" aria-label="Consultar estado del pedido">📦 Pedido</button>
                </div>
                <div class="ps-chatbot-input">
                    <input type="text" id="ps-chat-input" placeholder="Escribe tu mensaje..." maxlength="500"
                        aria-label="Escribe tu mensaje">
                    <button id="ps-chat-send" aria-label="Enviar mensaje">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // Eventos
        const toggleBtn = document.getElementById('ps-chat-toggle');
        toggleBtn.addEventListener('click', toggleChat);
        toggleBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleChat();
            }
        });
        document.getElementById('ps-chat-close').addEventListener('click', toggleChat);
        document.getElementById('ps-chat-send').addEventListener('click', sendMessage);
        document.getElementById('ps-chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    function toggleChat() {
        isOpen = !isOpen;
        const window = document.getElementById('ps-chat-window');
        const toggle = document.getElementById('ps-chat-toggle');
        window.classList.toggle('active', isOpen);
        toggle.classList.toggle('active', isOpen);
        if (isOpen) {
            setTimeout(() => {
                document.getElementById('ps-chat-input')?.focus();
                scrollToBottom();
            }, 300);
        }
    }

    function sendMessage() {
        const input = document.getElementById('ps-chat-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        addMessage(text, 'user');
        showTyping();

        // Obtener respuesta
        setTimeout(() => {
            const response = findBestAnswer(text);
            hideTyping();
            addMessage(response, 'bot');
        }, 800 + Math.random() * 600);
    }

    function addMessage(text, sender) {
        const container = document.getElementById('ps-chat-messages');
        const div = document.createElement('div');
        div.className = `ps-message ps-message-${sender}`;
        div.innerHTML = `
            <div class="ps-message-content">${formatMessage(text)}</div>
            <div class="ps-message-time">${getCurrentTime()}</div>
        `;
        container.appendChild(div);
        scrollToBottom();
    }

    function formatMessage(text) {
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/✅/g, '✅')
            .replace(/•/g, '•');
    }

    function showTyping() {
        const container = document.getElementById('ps-chat-messages');
        const div = document.createElement('div');
        div.className = 'ps-message ps-message-bot ps-typing-indicator';
        div.id = 'ps-typing';
        div.innerHTML = `
            <div class="ps-message-content">
                <span class="ps-typing-dot"></span>
                <span class="ps-typing-dot"></span>
                <span class="ps-typing-dot"></span>
            </div>
        `;
        container.appendChild(div);
        scrollToBottom();
    }

    function hideTyping() {
        const typing = document.getElementById('ps-typing');
        if (typing) typing.remove();
    }

    function scrollToBottom() {
        const container = document.getElementById('ps-chat-messages');
        container.scrollTop = container.scrollHeight;
    }

    function getCurrentTime() {
        const now = new Date();
        return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    }

    // ---------- API PÚBLICA ----------
    window.Chatbot = {
        open() {
            if (!isOpen) toggleChat();
        },
        close() {
            if (isOpen) toggleChat();
        },
        sendQuick(text) {
            if (!isOpen) toggleChat();
            setTimeout(() => {
                const input = document.getElementById('ps-chat-input');
                if (input) {
                    input.value = text;
                    sendMessage();
                }
            }, 400);
        }
    };

    // ---------- INICIALIZAR ----------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createChatbot);
    } else {
        createChatbot();
    }

})();
