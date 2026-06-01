// ============================================================
// CHATBOT CON RESPUESTAS PREDEFINIDAS
// ============================================================

const chatbotResponses = {
  'hola': '¡Hola! Bienvenido a nuestra tienda. ¿En qué puedo ayudarte?',
  'buenos dias': '¡Buenos días! ¿Cómo puedo ayudarte hoy?',
  'buenas tardes': '¡Buenas tardes! Estoy aquí para ayudarte.',
  'buenas noches': '¡Buenas noches! Si tienes alguna duda, estoy disponible.',
  'horario': 'Nuestro horario de atención es de lunes a sábado de 9:00 a 20:00 hrs.',
  'envio': 'Realizamos envíos a todo el país. El tiempo de entrega es de 3-7 días hábiles. Los envíos son gratuitos en compras mayores a $50.',
  'pago': 'Aceptamos tarjetas de crédito/débito, PayPal y transferencia bancaria.',
  'devolucion': 'Aceptamos devoluciones hasta 30 días después de la compra. El producto debe estar en su estado original.',
  'contacto': 'Puedes contactarnos a través del formulario en nuestra página de Contacto, o llamándonos al (123) 456-7890.',
  'precio': 'Los precios de nuestros productos varían. Puedes verlos todos en nuestro catálogo.',
  'catalogo': 'Puedes ver nuestro catálogo completo en la sección "Catálogo". Tenemos productos de electrónica, ropa, hogar, deportes y libros.',
  'registro': 'Para registrarte, ve a la página de Registro. Solo necesitas tu nombre, email y una contraseña.',
  'carrito': 'Para agregar productos al carrito, primero debes iniciar sesión. Luego solo haz clic en "Agregar al carrito" en cualquier producto.',
  'gracias': '¡De nada! Si tienes más preguntas, aquí estoy.',
  'adios': '¡Hasta luego! Gracias por visitarnos. 😊',
  'ayuda': 'Puedes preguntarme sobre: horarios, envíos, pagos, devoluciones, contacto, precios, catálogo, registro y carrito.',
  'default': 'Lo siento, no entendí tu pregunta. Prueba preguntando sobre: horarios, envíos, pagos, devoluciones, contacto, catálogo o registro.'
};

/**
 * Encuentra la mejor respuesta para un mensaje del usuario
 */
function getBotResponse(message) {
  const msg = message.toLowerCase().trim();

  // Buscar coincidencia exacta o parcial
  for (const [key, response] of Object.entries(chatbotResponses)) {
    if (key === 'default') continue;
    if (msg.includes(key)) {
      return response;
    }
  }

  return chatbotResponses.default;
}

/**
 * Agrega un mensaje al chat
 */
function addChatMessage(text, sender = 'bot') {
  const container = document.getElementById('chatbot-messages');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chatbot__msg chatbot__msg--${sender}`;
  msgDiv.textContent = text;
  msgDiv.setAttribute('role', 'listitem');
  container.appendChild(msgDiv);

  // Scroll al último mensaje
  container.scrollTop = container.scrollHeight;
}

/**
 * Maneja el envío de un mensaje
 */
function handleChatSend() {
  const input = document.getElementById('chatbot-input');
  const message = input.value.trim();
  if (!message) return;

  // Mostrar mensaje del usuario
  addChatMessage(message, 'user');
  input.value = '';

  // Mostrar indicador de escritura
  const typing = document.getElementById('chatbot-typing');
  if (typing) typing.style.display = 'block';

  // Responder después de un breve delay (simula procesamiento)
  setTimeout(() => {
    if (typing) typing.style.display = 'none';
    const response = getBotResponse(message);
    addChatMessage(response, 'bot');
  }, 600);
}

// Inicializar chatbot
document.addEventListener('DOMContentLoaded', () => {
  const chatbotBtn = document.getElementById('chatbot-btn');
  const chatbotWindow = document.getElementById('chatbot-window');
  const chatbotInput = document.getElementById('chatbot-input');
  const chatbotSend = document.getElementById('chatbot-send');

  if (!chatbotBtn || !chatbotWindow) return;

  // Toggle ventana del chatbot
  chatbotBtn.addEventListener('click', () => {
    const isOpen = chatbotWindow.classList.toggle('open');
    chatbotBtn.setAttribute('aria-expanded', isOpen);
    if (isOpen && chatbotInput) {
      chatbotInput.focus();
      // Mensaje de bienvenida si está vacío
      const messages = document.getElementById('chatbot-messages');
      if (messages && messages.children.length === 0) {
        addChatMessage('¡Hola! Soy el asistente virtual de la tienda. ¿En qué puedo ayudarte?');
      }
    }
  });

  // Enviar mensaje
  if (chatbotSend && chatbotInput) {
    chatbotSend.addEventListener('click', handleChatSend);

    chatbotInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleChatSend();
      }
    });
  }
});
