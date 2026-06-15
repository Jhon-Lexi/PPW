// ============================================================
// ACCESIBILIDAD - Modo nocturno, lectura guiada, escalado,
// skip link, imágenes, foco visible
// ============================================================

const Accessibility = {
    // ---------- CONFIG ----------
    STORAGE_KEY: 'ps_a11y_prefs',
    defaults: {
        theme: 'dark',          // 'dark' | 'light'
        readingGuide: false,
        textScale: 100,         // 100 | 125 | 150 | 175 | 200
        highContrast: false
    },

    // ---------- INICIALIZAR ----------
    init() {
        this.loadPrefs();
        this.applyTheme();
        this.applyTextScale();
        this.applyHighContrast();
        this.setupSkipLink();
        this.setupImageFallback();
        this.setupFocusIndicator();
        this.setupReadingGuide();
        this.setupBackToTop();
        this.setupMobilePanel();
        if (this.prefs.readingGuide) this.toggleReadingGuide(true);
    },

    // ---------- PREFERENCIAS ----------
    loadPrefs() {
        try {
            const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
            this.prefs = { ...this.defaults, ...saved };
        } catch {
            this.prefs = { ...this.defaults };
        }
    },

    savePrefs() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.prefs));
    },

    // ============================================================
    // 1. MODO NOCTURNO (DARK / LIGHT)
    // ============================================================
    toggleTheme() {
        this.prefs.theme = this.prefs.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.savePrefs();
        this.updateThemeButton();
        // Refresh CAPTCHA theme if reCAPTCHA is loaded
        if (typeof Security !== 'undefined' && Security.refreshCaptchaTheme) {
            Security.refreshCaptchaTheme();
        }
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.prefs.theme);
    },

    getTheme() {
        return this.prefs.theme;
    },

    updateThemeButton() {
        const btn = document.getElementById('a11y-theme-btn');
        if (!btn) return;
        const isLight = this.prefs.theme === 'light';
        btn.innerHTML = isLight
            ? '<i class="fas fa-moon"></i>'
            : '<i class="fas fa-sun"></i>';
        btn.title = isLight ? 'Activar modo oscuro' : 'Activar modo claro';
        btn.setAttribute('aria-label', btn.title);
        btn.classList.toggle('active-a11y', isLight);
    },

    // ============================================================
    // 2. LECTURA GUIADA
    // ============================================================
    setupReadingGuide() {
        // Create the guide element if it doesn't exist
        if (document.getElementById('reading-guide')) return;
        const guide = document.createElement('div');
        guide.id = 'reading-guide';
        document.body.appendChild(guide);

        // Track mouse/touch
        let ticking = false;
        const moveHandler = (e) => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const y = e.touches ? e.touches[0].clientY : e.clientY;
                    guide.style.top = `${y - 14}px`;
                    ticking = false;
                });
                ticking = true;
            }
        };

        this._guideMoveHandler = moveHandler;
    },

    toggleReadingGuide(forceState) {
        const guide = document.getElementById('reading-guide');
        if (!guide) return;

        const active = forceState !== undefined ? forceState : !this.prefs.readingGuide;
        this.prefs.readingGuide = active;
        this.savePrefs();

        guide.classList.toggle('active', active);

        if (active) {
            document.addEventListener('mousemove', this._guideMoveHandler);
            document.addEventListener('touchmove', this._guideMoveHandler, { passive: true });
        } else {
            document.removeEventListener('mousemove', this._guideMoveHandler);
            document.removeEventListener('touchmove', this._guideMoveHandler);
        }

        this.updateReadingGuideButton();
    },

    updateReadingGuideButton() {
        const btn = document.getElementById('a11y-guide-btn');
        if (!btn) return;
        btn.classList.toggle('active-a11y', this.prefs.readingGuide);
        btn.title = this.prefs.readingGuide ? 'Desactivar lectura guiada' : 'Activar lectura guiada';
        btn.setAttribute('aria-label', btn.title);
        btn.innerHTML = this.prefs.readingGuide
            ? '<i class="fas fa-eye"></i>'
            : '<i class="fas fa-low-vision"></i>';
    },

    // ============================================================
    // 3. ESCALADO DE TEXTO PROGRESIVO (100% - 200%)
    // ============================================================
    _textScaleLevels: [100, 125, 150, 175, 200],

    /** Obtiene el nivel de escalado actual */
    getTextScale() {
        return this.prefs.textScale;
    },

    /** Lista completa de niveles disponibles */
    getTextScaleLevels() {
        return [...this._textScaleLevels];
    },

    /** Incrementa un nivel (máximo 200%) */
    increaseTextScale() {
        const levels = this._textScaleLevels;
        const idx = levels.indexOf(this.prefs.textScale);
        if (idx < levels.length - 1) {
            this.prefs.textScale = levels[idx + 1];
        } else {
            Toast.show('Ya estás al máximo de zoom (200%)', 'info');
        }
        this.applyTextScale();
        this.savePrefs();
        this.updateTextScaleDisplay();
    },

    /** Decrementa un nivel (mínimo 100%) */
    decreaseTextScale() {
        const levels = this._textScaleLevels;
        const idx = levels.indexOf(this.prefs.textScale);
        if (idx > 0) {
            this.prefs.textScale = levels[idx - 1];
        } else {
            Toast.show('Ya estás al tamaño original (100%)', 'info');
        }
        this.applyTextScale();
        this.savePrefs();
        this.updateTextScaleDisplay();
    },

    /** Restaura al tamaño original (100%) */
    resetTextScale() {
        if (this.prefs.textScale === 100) return;
        this.prefs.textScale = 100;
        this.applyTextScale();
        this.savePrefs();
        this.updateTextScaleDisplay();
        Toast.show('Tamaño de texto restaurado (100%)', 'success');
    },

    /** Aplica el escalado al documento */
    applyTextScale() {
        const pct = this.prefs.textScale;
        document.documentElement.style.fontSize = `${pct}%`;
        // Evitar desbordamiento horizontal en escalas grandes
        document.body.style.overflowX = pct > 150 ? 'auto' : '';
        // Añadir clase de utilidad para ajustes finos de layout
        document.documentElement.classList.toggle('text-scaled', pct !== 100);
        document.documentElement.classList.toggle('text-scaled-lg', pct >= 150);
        document.documentElement.classList.toggle('text-scaled-xl', pct >= 200);
    },

    /** Actualiza el indicador visual de porcentaje y los botones */
    updateTextScaleDisplay() {
        const display = document.getElementById('a11y-text-value');
        if (display) {
            display.textContent = `${this.prefs.textScale}%`;
            display.setAttribute('aria-label', `Tamaño de texto al ${this.prefs.textScale} por ciento`);
        }

        // Botón de disminuir
        const decBtn = document.getElementById('a11y-text-dec');
        if (decBtn) {
            decBtn.disabled = this.prefs.textScale <= 100;
            decBtn.classList.toggle('opacity-40', this.prefs.textScale <= 100);
            decBtn.setAttribute('aria-disabled', this.prefs.textScale <= 100 ? 'true' : 'false');
        }

        // Botón de aumentar
        const incBtn = document.getElementById('a11y-text-inc');
        const atMax = this.prefs.textScale >= this._textScaleLevels[this._textScaleLevels.length - 1];
        if (incBtn) {
            incBtn.disabled = atMax;
            incBtn.classList.toggle('opacity-40', atMax);
            incBtn.setAttribute('aria-disabled', atMax ? 'true' : 'false');
        }

        // Botón de reset
        const resetBtn = document.getElementById('a11y-text-reset');
        if (resetBtn) {
            resetBtn.disabled = this.prefs.textScale <= 100;
            resetBtn.classList.toggle('opacity-40', this.prefs.textScale <= 100);
            resetBtn.setAttribute('aria-disabled', this.prefs.textScale <= 100 ? 'true' : 'false');
        }
    },

    // ============================================================
    // 11. RESTAURAR CONFIGURACIÓN DE ACCESIBILIDAD
    // ============================================================
    resetAll() {
        this.prefs = { ...this.defaults };
        localStorage.removeItem(this.STORAGE_KEY);

        // Aplicar todos los valores por defecto visualmente
        this.applyTheme();
        this.applyTextScale();
        this.applyHighContrast();

        // Desactivar lectura guiada si estaba activa
        if (document.getElementById('reading-guide')?.classList.contains('active')) {
            this.toggleReadingGuide(false);
        }

        // Reset TTS
        if (typeof TTS !== 'undefined') {
            TTS.reset();
        }

        // Cerrar panel móvil si está abierto
        this.closeMobilePanel();

        // Actualizar todos los botones e indicadores
        this.updateThemeButton();
        this.updateReadingGuideButton();
        this.updateTextScaleDisplay();
        this.updateHighContrastButton();
        this.updateMobilePanel();

        Toast.show('Configuración de accesibilidad restablecida', 'success');
    },

    // ============================================================
    // 12. ALTO CONTRASTE
    // ============================================================
    toggleHighContrast() {
        this.prefs.highContrast = !this.prefs.highContrast;
        this.applyHighContrast();
        this.savePrefs();
        this.updateHighContrastButton();
    },

    applyHighContrast() {
        document.documentElement.classList.toggle('high-contrast', this.prefs.highContrast);
    },

    updateHighContrastButton() {
        const btn = document.getElementById('a11y-contrast-btn');
        if (!btn) return;
        btn.classList.toggle('active-a11y', this.prefs.highContrast);
        btn.title = this.prefs.highContrast ? 'Desactivar alto contraste' : 'Activar alto contraste';
        btn.setAttribute('aria-label', btn.title);
        btn.innerHTML = this.prefs.highContrast
            ? '<i class="fas fa-adjust"></i>'
            : '<i class="fas fa-circle-half-stroke"></i>';
    },

    // ============================================================
    // 4. SKIP LINK
    // ============================================================
    setupSkipLink() {
        // Skip link is added directly in HTML for each page
        // This function handles the focus management
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById('main-content');
                if (target) {
                    target.setAttribute('tabindex', '-1');
                    target.focus({ preventScroll: false });
                    target.scrollIntoView({ behavior: 'smooth' });
                    // Remove tabindex after blur so it doesn't stay focusable
                    target.addEventListener('blur', () => {
                        target.removeAttribute('tabindex');
                    }, { once: true });
                }
            });
        }
    },

    // ============================================================
    // 5. TEXTO ALTERNATIVO - FALLBACK IMÁGENES
    // ============================================================
    setupImageFallback() {
        // Global error handler for images
        document.addEventListener('error', (e) => {
            const img = e.target;
            if (img.tagName !== 'IMG') return;
            // If already handled, skip
            if (img.dataset.a11yHandled) return;
            img.dataset.a11yHandled = 'true';

            const alt = img.getAttribute('alt') || 'Imagen no disponible';
            const container = img.parentElement;
            const fallback = document.createElement('div');
            fallback.className = 'img-fallback';
            fallback.setAttribute('role', 'img');
            fallback.setAttribute('aria-label', alt);
            fallback.innerHTML = `<div><i class="fas fa-image"></i><br><span>${alt}</span></div>`;

            // Try to keep layout from jumping
            if (img.width) fallback.style.minHeight = img.height ? `${img.height}px` : '120px';
            fallback.style.width = img.width ? `${img.width}px` : '100%';

            container.replaceChild(fallback, img);
        }, true);
    },

    // ============================================================
    // 7. FOCO VISIBLE
    // ============================================================
    setupFocusIndicator() {
        // Remove the default outline only when using mouse
        document.addEventListener('mousedown', () => {
            document.body.style.setProperty('--focus-outline-style', 'none');
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.style.setProperty('--focus-outline-style', '');
            }
        });
    },

    // ============================================================
    // 13. BOTÓN VOLVER AL INICIO
    // ============================================================
    setupBackToTop() {
        if (document.getElementById('back-to-top')) return;

        const btn = document.createElement('button');
        btn.id = 'back-to-top';
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', 'Volver al inicio de la página');
        btn.title = 'Volver al inicio';
        btn.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Devolver foco al inicio para lectores de pantalla
            const skipLink = document.querySelector('.skip-link');
            if (skipLink) setTimeout(() => skipLink.focus(), 500);
        });

        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });

        document.body.appendChild(btn);

        // Mostrar/ocultar según scroll
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    btn.classList.toggle('visible', window.scrollY > 400);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    },

    // ============================================================
    // 14. PANEL DE ACCESIBILIDAD MÓVIL (bottom sheet)
    // ============================================================
    setupMobilePanel() {
        if (document.getElementById('a11y-mobile-panel')) return;

        const overlay = document.createElement('div');
        overlay.id = 'a11y-mobile-panel-overlay';
        overlay.className = 'a11y-mobile-panel-overlay';
        document.body.appendChild(overlay);

        const panel = document.createElement('div');
        panel.id = 'a11y-mobile-panel';
        panel.className = 'a11y-mobile-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Panel de accesibilidad');
        panel.setAttribute('aria-modal', 'true');
        panel.innerHTML = `
            <div class="panel-header">
                <span class="panel-title"><i class="fas fa-universal-access"></i> Accesibilidad</span>
                <button class="panel-close" id="a11y-mobile-close"
                    aria-label="Cerrar panel de accesibilidad">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="a11y-grid">
                <button class="a11y-grid-btn" id="a11y-mob-theme"
                    onclick="Accessibility.toggleTheme(); Accessibility.updateMobilePanel()"
                    aria-label="Cambiar tema">
                    <i class="fas fa-sun"></i>
                    <span>Tema</span>
                </button>
                <button class="a11y-grid-btn" id="a11y-mob-guide"
                    onclick="Accessibility.toggleReadingGuide(); Accessibility.updateMobilePanel()"
                    aria-label="Activar lectura guiada">
                    <i class="fas fa-low-vision"></i>
                    <span>Guía</span>
                </button>
                <button class="a11y-grid-btn" id="a11y-mob-contrast"
                    onclick="Accessibility.toggleHighContrast(); Accessibility.updateMobilePanel()"
                    aria-label="Activar alto contraste">
                    <i class="fas fa-circle-half-stroke"></i>
                    <span>Contraste</span>
                </button>
                <button class="a11y-grid-btn" id="a11y-mob-tts"
                    onclick="TTS.togglePanel(); Accessibility.closeMobilePanel()"
                    aria-label="Lectura por voz">
                    <i class="fas fa-volume-up"></i>
                    <span>Voz</span>
                </button>
                <button class="a11y-grid-btn" id="a11y-mob-reset"
                    onclick="Accessibility.resetAll(); Accessibility.updateMobilePanel()"
                    aria-label="Restablecer accesibilidad">
                    <i class="fas fa-eraser"></i>
                    <span>Reset</span>
                </button>
            </div>
            <div class="text-scale-row">
                <button id="a11y-mob-dec" onclick="Accessibility.decreaseTextScale(); Accessibility.updateMobilePanel()"
                    aria-label="Reducir texto">−</button>
                <span class="scale-value" id="a11y-mob-value">100%</span>
                <button id="a11y-mob-inc" onclick="Accessibility.increaseTextScale(); Accessibility.updateMobilePanel()"
                    aria-label="Aumentar texto">+</button>
                <button id="a11y-mob-reset-scale" onclick="Accessibility.resetTextScale(); Accessibility.updateMobilePanel()"
                    aria-label="Restaurar tamaño de texto">↩</button>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('a11y-mobile-close').addEventListener('click', () => this.closeMobilePanel());
        overlay.addEventListener('click', () => this.closeMobilePanel());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel.classList.contains('active')) {
                this.closeMobilePanel();
            }
        });
    },

    toggleMobilePanel() {
        const panel = document.getElementById('a11y-mobile-panel');
        const overlay = document.getElementById('a11y-mobile-panel-overlay');
        if (!panel) return;
        const active = !panel.classList.contains('active');
        panel.classList.toggle('active', active);
        if (overlay) overlay.classList.toggle('active', active);
        document.body.style.overflow = active ? 'hidden' : '';
        if (active) {
            this.updateMobilePanel();
            panel.querySelector('.panel-close')?.focus();
        }
    },

    closeMobilePanel() {
        const panel = document.getElementById('a11y-mobile-panel');
        const overlay = document.getElementById('a11y-mobile-panel-overlay');
        if (panel) panel.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    },

    updateMobilePanel() {
        // Theme button
        const themeBtn = document.getElementById('a11y-mob-theme');
        if (themeBtn) {
            const isLight = this.prefs.theme === 'light';
            themeBtn.innerHTML = isLight
                ? '<i class="fas fa-moon"></i><span>Tema</span>'
                : '<i class="fas fa-sun"></i><span>Tema</span>';
            themeBtn.classList.toggle('active-a11y', isLight);
        }
        // Guide button
        const guideBtn = document.getElementById('a11y-mob-guide');
        if (guideBtn) {
            guideBtn.classList.toggle('active-a11y', this.prefs.readingGuide);
            guideBtn.innerHTML = this.prefs.readingGuide
                ? '<i class="fas fa-eye"></i><span>Guía</span>'
                : '<i class="fas fa-low-vision"></i><span>Guía</span>';
        }
        // Contrast button
        const contrastBtn = document.getElementById('a11y-mob-contrast');
        if (contrastBtn) {
            contrastBtn.classList.toggle('active-a11y', this.prefs.highContrast);
            contrastBtn.innerHTML = this.prefs.highContrast
                ? '<i class="fas fa-adjust"></i><span>Contraste</span>'
                : '<i class="fas fa-circle-half-stroke"></i><span>Contraste</span>';
        }
        // Text scale value
        const val = document.getElementById('a11y-mob-value');
        if (val) val.textContent = `${this.prefs.textScale}%`;
        // Text scale buttons
        const dec = document.getElementById('a11y-mob-dec');
        const inc = document.getElementById('a11y-mob-inc');
        const reset = document.getElementById('a11y-mob-reset-scale');
        const levels = this._textScaleLevels;
        if (dec) {
            dec.disabled = this.prefs.textScale <= levels[0];
            dec.style.opacity = dec.disabled ? '0.3' : '1';
        }
        if (inc) {
            inc.disabled = this.prefs.textScale >= levels[levels.length - 1];
            inc.style.opacity = inc.disabled ? '0.3' : '1';
        }
        if (reset) {
            reset.disabled = this.prefs.textScale <= levels[0];
            reset.style.opacity = reset.disabled ? '0.3' : '1';
        }
    }
};

// Global access for inline use
window.Accessibility = Accessibility;

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Accessibility.init());
} else {
    Accessibility.init();
}
