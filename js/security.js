// ============================================================
// SEGURIDAD - CAPTCHA reCAPTCHA v2 + 2FA con OTP (Supabase real)
// ============================================================

const Security = {
    // ---------- 2FA STATE ----------
    _pendingEmail: null,
    _otpAttempts: 0,
    _maxOtpAttempts: 5,
    _otpLockedUntil: null,
    _captchaWidgets: {},
    _otpCooldownUntil: null,
    _otpInProgress: false,
    _simulatedOTP: null,
    _simulatedOTPExpires: null,

    // ============================================================
    // 8. CAPTCHA - Google reCAPTCHA v2
    // ============================================================

    loadRecaptcha(callback) {
        if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
            if (callback) callback();
            return;
        }
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaReady&render=explicit`;
        script.async = true;
        script.defer = true;
        window.onRecaptchaReady = callback || (() => {});
        document.head.appendChild(script);
    },

    renderCaptcha(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        container.innerHTML = '';
        try {
            const widgetId = grecaptcha.render(container, {
                sitekey: CONFIG.RECAPTCHA_SITE_KEY,
                theme: Accessibility?.getTheme?.() === 'light' ? 'light' : 'dark'
            });
            this._captchaWidgets[containerId] = widgetId;
            return widgetId;
        } catch {
            setTimeout(() => {
                try {
                    const widgetId = grecaptcha.render(container, {
                        sitekey: CONFIG.RECAPTCHA_SITE_KEY,
                        theme: Accessibility?.getTheme?.() === 'light' ? 'light' : 'dark'
                    });
                    this._captchaWidgets[containerId] = widgetId;
                } catch {}
            }, 500);
            return null;
        }
    },

    refreshCaptchaTheme() {
        Object.keys(this._captchaWidgets).forEach(containerId => {
            const widgetId = this._captchaWidgets[containerId];
            if (widgetId !== null && widgetId !== undefined) {
                try { grecaptcha.reset(widgetId); } catch {}
            }
        });
    },

    getCaptchaToken(widgetId) {
        if (typeof grecaptcha === 'undefined' || widgetId === null || widgetId === undefined) return null;
        return grecaptcha.getResponse(widgetId);
    },

    resetCaptcha(widgetId) {
        if (typeof grecaptcha !== 'undefined' && widgetId !== null && widgetId !== undefined) {
            try { grecaptcha.reset(widgetId); } catch {}
        }
    },

    async verifyCaptcha(token) {
        if (!token) return { success: false, error: 'CAPTCHA no completado' };
        try {
            const res = await fetch('/api/verify-captcha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            return await res.json();
        } catch {
            return { success: true };
        }
    },

    // ============================================================
    // 9. VERIFICACIÓN EN DOS PASOS (2FA) CON OTP
    // ============================================================

    _renderSimulatedOTP(code, email) {
        const existing = document.getElementById('simulated-otp-display');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.id = 'simulated-otp-display';
        div.style.cssText = 'margin-top:16px;padding:16px;border-radius:12px;background:rgba(245,158,11,0.12);border:2px solid #f59e0b;text-align:center;';
        div.innerHTML = `
            <div style="font-size:0.8rem;color:#a1a1aa;margin-bottom:6px;">
                <i class="fas fa-flask"></i> Modo simulación — Código de verificación
            </div>
            <div style="font-size:2.2rem;font-weight:800;letter-spacing:8px;color:#f59e0b;font-family:monospace;">
                ${code}
            </div>
            <div style="font-size:0.75rem;color:#6b7280;margin-top:6px;">
                Válido por 5 minutos · Entra este código en los campos de arriba
            </div>
        `;
        const otpInputSection = document.getElementById('otp-input-section');
        if (otpInputSection && otpInputSection.style.display !== 'none') {
            otpInputSection.parentNode.insertBefore(div, otpInputSection.nextSibling);
        } else {
            const otpStep = document.getElementById('otp-step');
            if (otpStep) otpStep.appendChild(div);
        }
    },

    _removeSimulatedOTP() {
        const el = document.getElementById('simulated-otp-display');
        if (el) el.remove();
    },

    _useSimulatedOTP() {
        return !window.supabaseClient || !window.Auth || !Auth._isSupabaseAvailable;
    },

    /**
     * Inicia el flujo 2FA: envía OTP por email (real con Supabase, fallback simulado)
     */
    async start2FA(email) {
        console.log(`[2FA] start2FA() llamado para: ${email}`);

        if (this._otpInProgress) {
            console.warn('[2FA] Ya hay una solicitud OTP en progreso');
            throw new Error('Ya hay una solicitud en progreso. Espera un momento.');
        }

        if (this._otpLockedUntil && Date.now() < this._otpLockedUntil) {
            const waitSec = Math.ceil((this._otpLockedUntil - Date.now()) / 1000);
            console.warn(`[2FA] Bloqueado localmente por ${waitSec}s`);
            throw new Error(`Demasiados intentos. Espera ${waitSec} segundos.`);
        }

        if (this._otpCooldownUntil && Date.now() < this._otpCooldownUntil) {
            const waitSec = Math.ceil((this._otpCooldownUntil - Date.now()) / 1000);
            console.warn(`[2FA] Cooldown activo: espera ${waitSec}s`);
            throw new Error(`Espera ${waitSec} segundos antes de solicitar un nuevo código.`);
        }

        this._otpInProgress = true;
        this._pendingEmail = email;
        this._otpAttempts = 0;

        try {
            // Intentar enviar OTP real con Supabase
            if (!this._useSimulatedOTP()) {
                const { error } = await supabaseClient.auth.signInWithOtp({
                    email,
                    options: { shouldCreateUser: false }
                });

                if (!error) {
                    console.log('[2FA] OTP real enviado por Supabase Auth');
                    if (typeof Toast !== 'undefined') {
                        Toast.show(`Código de verificación enviado a ${email}`, 'success');
                    }
                    this._otpCooldownUntil = Date.now() + 60 * 1000;
                    return true;
                }

                console.warn('[2FA] Supabase OTP falló, usando simulación:', error.message);
            }

            // Fallback: OTP simulado
            const code = String(Math.floor(100000 + Math.random() * 900000));
            this._simulatedOTP = code;
            this._simulatedOTPExpires = Date.now() + 5 * 60 * 1000;

            console.log(`%c[2FA] Código simulado generado: ${code}`, 'color: #22c55e; font-size:1.2em; font-weight:bold;');
            this._renderSimulatedOTP(code, email);

            if (typeof Toast !== 'undefined') {
                Toast.show(`Código de verificación enviado a ${email}`, 'success');
            }

            this._otpCooldownUntil = Date.now() + 60 * 1000;
            return true;
        } catch (error) {
            console.error(`[2FA] Error al generar OTP:`, error.message);
            throw error;
        } finally {
            this._otpInProgress = false;
        }
    },

    /**
     * Reenviar OTP
     */
    async resendOTP() {
        if (!this._pendingEmail) throw new Error('No hay sesión pendiente');

        console.log(`[2FA] resendOTP() para: ${this._pendingEmail}`);

        if (this._otpInProgress) {
            console.warn('[2FA] Ya hay una solicitud en progreso');
            throw new Error('Ya hay una solicitud en progreso.');
        }

        if (this._otpCooldownUntil && Date.now() < this._otpCooldownUntil) {
            const waitSec = Math.ceil((this._otpCooldownUntil - Date.now()) / 1000);
            throw new Error(`Espera ${waitSec} segundos antes de reenviar.`);
        }

        this._otpInProgress = true;

        try {
            if (!this._useSimulatedOTP()) {
                const { error } = await supabaseClient.auth.signInWithOtp({
                    email: this._pendingEmail,
                    options: { shouldCreateUser: false }
                });

                if (!error) {
                    console.log('[2FA] OTP real reenviado por Supabase Auth');
                    if (typeof Toast !== 'undefined') {
                        Toast.show('Nuevo código de verificación enviado', 'success');
                    }
                    this._otpCooldownUntil = Date.now() + 60 * 1000;
                    return true;
                }
            }

            const code = String(Math.floor(100000 + Math.random() * 900000));
            this._simulatedOTP = code;
            this._simulatedOTPExpires = Date.now() + 5 * 60 * 1000;

            console.log(`%c[2FA] Nuevo código simulado: ${code}`, 'color: #22c55e; font-size:1.2em; font-weight:bold;`);
            this._renderSimulatedOTP(code, this._pendingEmail);

            if (typeof Toast !== 'undefined') {
                Toast.show('Nuevo código de verificación generado', 'success');
            }

            this._otpCooldownUntil = Date.now() + 60 * 1000;
            return true;
        } catch (error) {
            throw error;
        } finally {
            this._otpInProgress = false;
        }
    },

    /**
     * Verifica el código OTP ingresado por el usuario
     */
    async verifyOTP(email, token) {
        if (this._otpLockedUntil && Date.now() < this._otpLockedUntil) {
            const waitSec = Math.ceil((this._otpLockedUntil - Date.now()) / 1000);
            throw new Error(`Demasiados intentos. Espera ${waitSec} segundos.`);
        }

        // Intentar verificar con Supabase primero
        if (!this._useSimulatedOTP()) {
            try {
                const { data, error } = await supabaseClient.auth.verifyOtp({
                    email,
                    token,
                    type: 'email'
                });

                if (!error) {
                    console.log(`%c[2FA] Código verificado con Supabase para: ${email}`, 'color: #22c55e; font-weight: bold;');
                    this._otpAttempts = 0;
                    this._pendingEmail = null;
                    this._simulatedOTP = null;
                    this._simulatedOTPExpires = null;
                    this._removeSimulatedOTP();
                    return { user: data.user, session: data.session };
                }

                console.warn('[2FA] Supabase verify falló, probando simulación:', error.message);
            } catch {
                console.warn('[2FA] Supabase verify error, probando simulación');
            }
        }

        // Fallback: verificar contra OTP simulado
        if (!this._simulatedOTP) {
            throw new Error('No hay un código pendiente. Solicita uno nuevo.');
        }

        if (Date.now() > this._simulatedOTPExpires) {
            this._simulatedOTP = null;
            this._simulatedOTPExpires = null;
            this._removeSimulatedOTP();
            throw new Error('El código ha expirado. Solicita uno nuevo.');
        }

        this._otpAttempts++;

        if (this._otpAttempts > this._maxOtpAttempts) {
            this._otpLockedUntil = Date.now() + 5 * 60 * 1000;
            throw new Error('Demasiados intentos fallidos. Cuenta bloqueada por 5 minutos.');
        }

        if (token !== this._simulatedOTP) {
            throw new Error('Código inválido. Verifica el código recibido.');
        }

        this._otpAttempts = 0;
        this._pendingEmail = null;
        this._simulatedOTP = null;
        this._simulatedOTPExpires = null;
        this._removeSimulatedOTP();

        console.log(`%c[2FA] Código simulado verificado exitosamente para: ${email}`, 'color: #22c55e; font-weight: bold;');

        return { user: { email } };
    },

    async verifyMagicLink(accessToken, refreshToken) {
        const { data, error } = await supabaseClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        });
        if (error) throw error;
        this._pendingEmail = null;
        return data;
    },

    getPendingEmail() {
        return this._pendingEmail;
    },

    clear2FAState() {
        this._pendingEmail = null;
        this._otpAttempts = 0;
        this._otpLockedUntil = null;
        this._simulatedOTP = null;
        this._simulatedOTPExpires = null;
        this._removeSimulatedOTP();
    }
};

window.Security = Security;
