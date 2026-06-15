// ============================================================
// FUNCIONES COMPARTIDAS - NAVBAR, TOAST, UTILIDADES
// ============================================================

// ---------- TOAST ----------
const Toast = {
    show(message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// ---------- FORMATO MONEDA ----------
function formatPrice(price) {
    return `$${Number(price).toFixed(2)}`;
}

// ---------- LOADING SPINNER ----------
function showSpinner(container) {
    container.innerHTML = `
        <div class="flex justify-center items-center py-20">
            <div class="spinner"></div>
        </div>
    `;
}

// ---------- RENDER NAVBAR ----------
function renderNavbar() {
    const header = document.getElementById('main-header');
    if (!header) return;

    const cartCount = Cart.getCount();

    header.innerHTML = `
        <nav class="navbar">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <a href="index.html" class="flex items-center gap-2 text-xl font-extrabold tracking-tight">
                        <span class="text-amber-500">✦</span>
                        <span>PREMIUM<span class="text-amber-500">STORE</span></span>
                    </a>

                    <div class="nav-links flex items-center gap-6" id="nav-links">
                        <a href="index.html" class="nav-link ${window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/ecommerce/') ? 'active' : ''}">Inicio</a>
                        <a href="catalog.html" class="nav-link ${window.location.pathname.includes('catalog') ? 'active' : ''}">Catálogo</a>
                        <a href="about.html" class="nav-link ${window.location.pathname.includes('about') ? 'active' : ''}">Nosotros</a>
                        <a href="contact.html" class="nav-link ${window.location.pathname.includes('contact') ? 'active' : ''}">Contacto</a>
                    </div>

                    <div class="flex items-center gap-4">
                        <a href="cart.html" class="relative text-gray-300 hover:text-white transition-colors">
                            <i class="fas fa-shopping-bag text-lg"></i>
                            <span class="cart-badge" style="display: ${cartCount > 0 ? 'flex' : 'none'}">${cartCount}</span>
                        </a>

                        <div id="auth-controls">
                            <div class="flex items-center gap-3">
                                <div class="spinner-sm" style="width:16px;height:16px;border:2px solid #333;border-top-color:#f59e0b;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block"></div>
                            </div>
                        </div>

                        <div class="a11y-toolbar hide-mobile">
                            <button id="a11y-theme-btn" onclick="Accessibility.toggleTheme()"
                                title="Activar modo claro" aria-label="Cambiar tema claro/oscuro">
                                <i class="fas fa-sun"></i>
                            </button>
                            <div class="separator"></div>
                            <button id="a11y-guide-btn" onclick="Accessibility.toggleReadingGuide()"
                                title="Activar lectura guiada" aria-label="Activar/desactivar lectura guiada">
                                <i class="fas fa-low-vision"></i>
                            </button>
                            <div class="separator"></div>
                            <button id="a11y-text-dec" onclick="Accessibility.decreaseTextScale()"
                                title="Reducir tamaño de texto" aria-label="Reducir tamaño de texto">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span id="a11y-text-value" class="a11y-text-display"
                                title="Tamaño de texto actual" aria-live="polite" aria-atomic="true">100%</span>
                            <button id="a11y-text-inc" onclick="Accessibility.increaseTextScale()"
                                title="Aumentar tamaño de texto" aria-label="Aumentar tamaño de texto">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button id="a11y-text-reset" onclick="Accessibility.resetTextScale()"
                                title="Restaurar tamaño original" aria-label="Restaurar tamaño de texto original">
                                <i class="fas fa-undo-alt"></i>
                            </button>
                            <div class="separator"></div>
                            <button id="a11y-contrast-btn" onclick="Accessibility.toggleHighContrast()"
                                title="Activar alto contraste" aria-label="Activar/desactivar alto contraste">
                                <i class="fas fa-circle-half-stroke"></i>
                            </button>
                            <div class="separator"></div>
                            <button id="a11y-tts-btn" onclick="TTS.togglePanel()"
                                title="Lectura por voz" aria-label="Abrir panel de lectura por voz">
                                <i class="fas fa-volume-up"></i>
                            </button>
                            <button id="a11y-reset-btn" onclick="Accessibility.resetAll()"
                                title="Restablecer accesibilidad" aria-label="Restablecer toda la configuración de accesibilidad">
                                <i class="fas fa-eraser"></i>
                            </button>
                        </div>

                        <button id="a11y-mobile-btn" class="a11y-mobile-btn"
                            onclick="Accessibility.toggleMobilePanel()"
                            title="Accesibilidad" aria-label="Abrir panel de accesibilidad">
                            <i class="fas fa-universal-access"></i>
                        </button>

                        <button id="mobile-menu-btn" class="mobile-menu-btn" aria-label="Abrir menú de navegación">
                            <i class="fas fa-bars"></i>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    `;
}

// ---------- RENDER AUTH CONTROLS ----------
async function renderAuthControls() {
    const container = document.getElementById('auth-controls');
    if (!container) return;

    try {
        const { user } = await Auth.getCurrentUser();

        if (user) {
            const isAdmin = await Auth.isAdmin();
            const displayName = user.email?.split('@')[0] || 'Usuario';

            container.innerHTML = `
                <div class="relative" id="user-menu">
                    <button onclick="document.getElementById('user-dropdown').classList.toggle('hidden')" class="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                        <i class="fas fa-user-circle text-xl"></i>
                        <span class="text-sm hidden sm:inline">${displayName}</span>
                        <i class="fas fa-chevron-down text-xs"></i>
                    </button>
                    <div id="user-dropdown" class="hidden absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl py-2 z-50 animate-slide-down">
                        <div class="px-4 py-2 text-sm text-gray-400 border-b border-zinc-700 truncate">${user.email}</div>
                        <a href="orders.html" class="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 transition-colors">
                            <i class="fas fa-receipt mr-2"></i> Mis Pedidos
                        </a>
                        ${isAdmin ? '<a href="admin/dashboard.html" class="block px-4 py-2 text-sm text-amber-500 hover:bg-zinc-800 transition-colors"><i class="fas fa-shield-alt mr-2"></i> Admin Panel</a>' : ''}
                        <button onclick="handleLogout()" class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 transition-colors">
                            <i class="fas fa-sign-out-alt mr-2"></i> Cerrar Sesión
                        </button>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="flex items-center gap-2">
                    <a href="login.html" class="btn btn-secondary btn-sm">Ingresar</a>
                    <a href="register.html" class="btn btn-primary btn-sm hidden sm:inline-flex">Registrarse</a>
                </div>
            `;
        }
    } catch {
        container.innerHTML = `
            <div class="flex items-center gap-2">
                <a href="login.html" class="btn btn-secondary btn-sm">Ingresar</a>
                <a href="register.html" class="btn btn-primary btn-sm hidden sm:inline-flex">Registrarse</a>
            </div>
        `;
    }
}

// ---------- CERRAR SESIÓN ----------
async function handleLogout() {
    await Auth.signOut();
    Toast.show('Sesión cerrada', 'info');
    window.location.reload();
}

// ---------- SCROLL NAVBAR ----------
function initScrollNav() {
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        }
    });
}

// ---------- ACTUALIZAR A11Y BUTTONS DESPUÉS DE RENDER ----------
function updateA11yButtons() {
    if (typeof Accessibility !== 'undefined') {
        Accessibility.updateThemeButton();
        Accessibility.updateReadingGuideButton();
        Accessibility.updateTextScaleDisplay();
        Accessibility.updateHighContrastButton();
    }
}

// ---------- MOBILE MENU TOGGLE ----------
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('nav-links');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        btn.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
        btn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        document.body.style.overflow = isOpen ? 'hidden' : '';
        // Cerrar panel de accesibilidad móvil si está abierto
        if (isOpen && typeof Accessibility !== 'undefined') {
            Accessibility.closeMobilePanel();
        }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (nav.classList.contains('open') && !nav.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
            nav.classList.remove('open');
            btn.setAttribute('aria-label', 'Abrir menú de navegación');
            btn.innerHTML = '<i class="fas fa-bars"></i>';
            document.body.style.overflow = '';
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('open')) {
            nav.classList.remove('open');
            btn.setAttribute('aria-label', 'Abrir menú de navegación');
            btn.innerHTML = '<i class="fas fa-bars"></i>';
            document.body.style.overflow = '';
            btn.focus();
        }
    });

    // Close nav link click
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('open');
            btn.setAttribute('aria-label', 'Abrir menú de navegación');
            btn.innerHTML = '<i class="fas fa-bars"></i>';
            document.body.style.overflow = '';
        });
    });
}

// ---------- USER DROPDOWN MOBILE ----------
function initUserDropdown() {
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('user-menu');
        const dropdown = document.getElementById('user-dropdown');
        if (menu && dropdown && !menu.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const dropdown = document.getElementById('user-dropdown');
            if (dropdown) dropdown.classList.add('hidden');
        }
    });
}

// ---------- INICIALIZAR USUARIOS (SEED) ----------
async function initSeedUsers() {
    // Ejecutar solo una vez por sesión
    const SEED_SENTINEL = 'ps_seed_done';
    if (sessionStorage.getItem(SEED_SENTINEL)) return;
    sessionStorage.setItem(SEED_SENTINEL, '1');

    try {
        const result = await Auth.seedUsers();
        if (result.success && result.users) {
            const details = Object.values(result.users)
                .map(u => `${u.email} (${u.created ? 'creado' : u.updated ? 'actualizado' : 'existente'})`)
                .join(', ');
            console.log(`[Seed] Usuarios inicializados: ${details}`);
        } else if (result.success) {
            console.log('[Seed] Usuarios listos');
        }
    } catch {
        // Silencioso — los usuarios pueden ya existir
    }
}

// ---------- INICIALIZAR ADMIN ----------
async function initAdminOnLoad() {
    // Solo en páginas de admin
    if (window.location.pathname.includes('/admin/')) {
        try {
            const result = await Auth.initAdmin();
            if (result.success && result.users) {
                const adminInfo = result.users.admin;
                console.log(`[Admin] ${adminInfo.email} (${adminInfo.updated ? 'actualizado' : 'listo'})`);
            }
        } catch {}
    }
}

// ---------- INICIALIZACIÓN GLOBAL ----------
document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
    renderAuthControls();
    Cart.updateBadge();
    initScrollNav();
    initMobileMenu();
    initUserDropdown();
    initSeedUsers();
    initAdminOnLoad();
    // Wait a tick for navbar to render, then update a11y buttons
    setTimeout(updateA11yButtons, 50);
});

// Sync mobile panel when a11y buttons are updated
function updateMobilePanelFromDesktop() {
    if (typeof Accessibility !== 'undefined' && Accessibility.updateMobilePanel) {
        const panel = document.getElementById('a11y-mobile-panel');
        if (panel && panel.classList.contains('active')) {
            Accessibility.updateMobilePanel();
        }
    }
}

// Re-run when auth changes (user logs in/out)
document.addEventListener('authRendered', updateA11yButtons);
