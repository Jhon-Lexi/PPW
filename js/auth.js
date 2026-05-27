// ============================================
// AUTENTICACIÓN - Supabase Auth
// ============================================

let currentUser = null;

// Escuchar cambios de autenticación
function listenAuth() {
  if (!supabaseClient) return;
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
      getUserProfile(session.user);
    } else {
      currentUser = null;
      updateUI();
    }
  });
}

// Obtener sesión actual
async function getSession() {
  if (!supabaseClient) return null;
  const { data } = await supabaseClient.auth.getSession();
  return data.session;
}

// Obtener perfil del usuario
async function getUserProfile(user) {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!error && data) {
    currentUser = { ...user, ...data };
  } else {
    currentUser = user;
  }
  updateUI();
  return currentUser;
}

// Inicializar auth al cargar la página
async function initAuth() {
  if (!supabaseClient) {
    // Esperar a que supabase esté disponible
    setTimeout(initAuth, 100);
    return;
  }

  const session = await getSession();
  if (session) {
    await getUserProfile(session.user);
  }
  listenAuth();
}

// Registrar usuario
async function registerUser(email, password, nombre) {
  if (!supabaseClient) return { error: 'Supabase no configurado' };

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { nombre } }
  });

  if (error) return { error: error.message };
  return { data, success: true };
}

// Iniciar sesión
async function loginUser(email, password) {
  if (!supabaseClient) return { error: 'Supabase no configurado' };

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) return { error: error.message };

  await getUserProfile(data.user);
  return { data, success: true };
}

// Cerrar sesión
async function logoutUser() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  currentUser = null;
  updateUI();
  window.location.href = '/';
}

// Verificar si es admin
function isAdmin() {
  return currentUser && currentUser.rol === 'admin';
}

// Verificar si está autenticado
function isAuthenticated() {
  return currentUser !== null;
}

// Redirigir si no es admin
function requireAdmin() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  if (!isAdmin()) {
    window.location.href = '/';
    return false;
  }
  return true;
}

// Redirigir si no está autenticado
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
}

// Actualizar UI según estado de auth
function updateUI() {
  const authContainer = document.getElementById('auth-container');
  if (!authContainer) return;

  if (currentUser) {
    const nombre = currentUser.nombre || currentUser.email?.split('@')[0] || 'Usuario';
    const inicial = nombre.charAt(0).toUpperCase();
    const isAdm = isAdmin();

    authContainer.innerHTML = `
      <div class="user-badge" onclick="toggleUserMenu(event)">
        <div class="avatar">${inicial}</div>
        <span>${nombre}</span>
      </div>
      <div id="user-menu" style="display:none;position:absolute;top:100%;right:0;background:white;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.15);min-width:200px;z-index:100;overflow:hidden;">
        ${isAdm ? '<a href="/admin/dashboard.html" style="display:block;padding:12px 20px;font-size:0.9rem;color:#334155;transition:all 0.2s;">📊 Dashboard Admin</a>' : ''}
        <a href="/carrito.html" style="display:block;padding:12px 20px;font-size:0.9rem;color:#334155;transition:all 0.2s;">🛒 Mis compras</a>
        <div style="border-top:1px solid #e2e8f0;"></div>
        <a href="#" onclick="logoutUser();return false;" style="display:block;padding:12px 20px;font-size:0.9rem;color:#ef4444;transition:all 0.2s;">🚪 Cerrar sesión</a>
      </div>
    `;
    updateCartCount();
  } else {
    authContainer.innerHTML = `
      <a href="/login.html" class="btn btn-outline btn-sm">Ingresar</a>
      <a href="/registro.html" class="btn btn-primary btn-sm">Registrarse</a>
    `;
  }
}

// Mostrar menú de usuario
function toggleUserMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('user-menu');
  if (menu) {
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
  }
}

// Cerrar menú al hacer clic fuera
document.addEventListener('click', () => {
  const menu = document.getElementById('user-menu');
  if (menu) menu.style.display = 'none';
});

// ============ COMPONENTE HEADER COMPARTIDO ============
// Inyectar el header en todas las páginas que tengan <header>

function loadHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  header.innerHTML = `
    <nav class="navbar">
      <a href="/" class="navbar-brand">
        <div class="navbar-logo">🛍️</div>
        <span>Shop</span>Express
      </a>
      <button class="hamburger" onclick="toggleMenu()" aria-label="Menú">
        <span></span><span></span><span></span>
      </button>
      <div class="nav-links" id="navLinks">
        <a href="/" class="${currentPath === 'index.html' || currentPath === '' ? 'active' : ''}">Inicio</a>
        <a href="/catalogo.html" class="${currentPath === 'catalogo.html' ? 'active' : ''}">Tienda</a>
        <a href="/nosotros.html" class="${currentPath === 'nosotros.html' ? 'active' : ''}">Nosotros</a>
        <a href="/contacto.html" class="${currentPath === 'contacto.html' ? 'active' : ''}">Contacto</a>
        <a href="/carrito.html" class="btn-cart">
          🛒 <span id="cart-count-header" class="cart-count">0</span>
        </a>
        <div class="nav-auth" id="auth-container"></div>
      </div>
    </nav>
  `;
}

function toggleMenu() {
  document.getElementById('navLinks')?.classList.toggle('open');
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
  initAuth();
  updateCartCount();
});
