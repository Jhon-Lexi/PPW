// ============================================================
// CONTACTO - VALIDACIÓN Y ENVÍO DEL FORMULARIO
// ============================================================

const ContactForm = {
    _captchaWidgetId: null,

    async init() {
        const form = document.getElementById('contact-form');
        if (!form) return;

        // Load reCAPTCHA if not already loaded
        if (typeof Security !== 'undefined') {
            Security.loadRecaptcha(() => {
                this._captchaWidgetId = Security.renderCaptcha('contact-captcha');
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = form.querySelector('#name').value.trim();
            const email = form.querySelector('#email').value.trim();
            const subject = form.querySelector('#subject').value.trim();
            const message = form.querySelector('#message').value.trim();

            // Validación
            if (!name || !email || !message) {
                Toast.show('Completa todos los campos obligatorios', 'error');
                return;
            }

            if (!this.isValidEmail(email)) {
                Toast.show('Correo electrónico inválido', 'error');
                return;
            }

            // CAPTCHA validation
            const captchaToken = Security.getCaptchaToken(this._captchaWidgetId);
            if (!captchaToken) {
                Toast.show('Completa la verificación de seguridad (CAPTCHA)', 'error');
                return;
            }

            // Verify CAPTCHA server-side
            const captchaResult = await Security.verifyCaptcha(captchaToken);
            if (!captchaResult.success) {
                Toast.show('Error en la verificación de seguridad', 'error');
                Security.resetCaptcha(this._captchaWidgetId);
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            try {
                const { error } = await supabaseClient
                    .from('contacts')
                    .insert([{ name, email, subject, message }]);

                if (error) throw error;

                Toast.show('Mensaje enviado con éxito', 'success');
                form.reset();
                Security.resetCaptcha(this._captchaWidgetId);
            } catch (err) {
                Toast.show('Error al enviar: ' + err.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensaje';
            }
        });
    },

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ContactForm.init();
});
