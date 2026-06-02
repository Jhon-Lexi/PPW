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

                        <button class="mobile-menu-btn text-gray-300 hover:text-white text-xl" onclick="document.getElementById('nav-links').classList.toggle('open')">
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
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (user) {
            // Verificar si es admin
            let isAdmin = false;
            try {
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                isAdmin = profile?.role === 'admin';
            } catch {}

            container.innerHTML = `
                <div class="relative" id="user-menu">
                    <button onclick="document.getElementById('user-dropdown').classList.toggle('hidden')" class="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                        <i class="fas fa-user-circle text-xl"></i>
                        <span class="text-sm hidden sm:inline">${user.email?.split('@')[0] || 'Usuario'}</span>
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

            // Cerrar dropdown al hacer click fuera
            document.addEventListener('click', (e) => {
                const menu = document.getElementById('user-menu');
                const dropdown = document.getElementById('user-dropdown');
                if (menu && dropdown && !menu.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            });
        } else {
            container.innerHTML = `
                <div class="flex items-center gap-2">
                    <a href="login.html" class="btn btn-secondary btn-sm">Ingresar</a>
                    <a href="register.html" class="btn btn-primary btn-sm hidden sm:inline-flex">Registrarse</a>
                </div>
            `;
        }
    } catch (err) {
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

// ---------- INICIALIZACIÓN GLOBAL ----------
document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
    renderAuthControls();
    Cart.updateBadge();
    initScrollNav();
});
