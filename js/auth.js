// ============================================================
// MÓDULO DE AUTENTICACIÓN
// ============================================================

/**
 * Registro de nuevo usuario
 * @param {string} email - Correo electrónico
 * @param {string} password - Contraseña
 * @param {string} nombre - Nombre completo
 */
async function registrarUsuario(email, password, nombre) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre } // Se guarda en raw_user_meta_data
      }
    });

    if (error) throw error;

    // El trigger crear_perfil() crea automáticamente el perfil
    // Pero si el usuario ya existe, actualizamos el nombre
    const profileData = {
      id: data.user.id,
      nombre: nombre
    };

    const { error: profileError } = await supabase
      .from('perfiles')
      .upsert(profileData, { onConflict: 'id' });

    if (profileError) throw profileError;

    return { success: true, message: 'Registro exitoso. Revisa tu correo para confirmar.' };
  } catch (error) {
    console.error('Error de registro:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Inicio de sesión con email y contraseña
 */
async function iniciarSesion(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Error de login:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Inicio de sesión con Google
 */
async function iniciarSesionGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/index.html'
      }
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error con Google login:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Cerrar sesión
 */
async function cerrarSesion() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('carrito');
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Error al cerrar sesión:', error.message);
  }
}

/**
 * Escucha cambios en el estado de autenticación
 * Actualiza la UI automáticamente
 */
function escucharAuth() {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Estado de autenticación cambiado:', event);
    actualizarUI(session?.user || null);
  });
}

/**
 * Actualiza la interfaz según el estado de autenticación
 */
function actualizarUI(user) {
  const loginLink = document.getElementById('login-link');
  const registerLink = document.getElementById('register-link');
  const logoutBtn = document.getElementById('logout-btn');
  const adminLink = document.getElementById('admin-link');
  const userInfo = document.getElementById('user-info');

  if (user) {
    // Usuario logueado
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (userInfo) userInfo.textContent = user.email;

    // Verificar si es admin para mostrar enlace
    if (adminLink) {
      isAdmin().then(admin => {
        adminLink.style.display = admin ? 'inline-flex' : 'none';
      });
    }
  } else {
    // Usuario no logueado
    if (loginLink) loginLink.style.display = 'inline-flex';
    if (registerLink) registerLink.style.display = 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
    if (userInfo) userInfo.textContent = '';
  }
}

/**
 * Protege una ruta: redirige a login si no hay sesión
 */
async function protegerRuta() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
}

/**
 * Protege una ruta de admin
 */
async function protegerRutaAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
    return false;
  }
  const admin = await isAdmin();
  if (!admin) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

// ============================================================
// MANEJO DE FORMULARIOS DE AUTH
// ============================================================

// Login form
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const errorDiv = document.getElementById('login-error');

      if (!email || !password) {
        errorDiv.textContent = 'Todos los campos son obligatorios';
        errorDiv.style.display = 'block';
        return;
      }

      const result = await iniciarSesion(email, password);
      if (result.success) {
        // Redirigir a la página anterior o al home
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/index.html';
        window.location.href = redirect;
      } else {
        errorDiv.textContent = result.message;
        errorDiv.style.display = 'block';
      }
    });
  }

  // Register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('register-nombre').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm').value;
      const errorDiv = document.getElementById('register-error');

      if (!nombre || !email || !password || !confirmPassword) {
        errorDiv.textContent = 'Todos los campos son obligatorios';
        errorDiv.style.display = 'block';
        return;
      }

      if (password !== confirmPassword) {
        errorDiv.textContent = 'Las contraseñas no coinciden';
        errorDiv.style.display = 'block';
        return;
      }

      if (password.length < 6) {
        errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
        errorDiv.style.display = 'block';
        return;
      }

      const result = await registrarUsuario(email, password, nombre);
      if (result.success) {
        const successDiv = document.getElementById('register-success');
        successDiv.textContent = result.message;
        successDiv.style.display = 'block';
        registerForm.reset();
      } else {
        errorDiv.textContent = result.message;
        errorDiv.style.display = 'block';
      }
    });
  }

  // Google login button
  const googleBtn = document.getElementById('google-login-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      const result = await iniciarSesionGoogle();
      if (!result.success) {
        const errorDiv = document.getElementById('login-error');
        errorDiv.textContent = result.message;
        errorDiv.style.display = 'block';
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      cerrarSesion();
    });
  }

  // Inicializar UI de autenticación
  escucharAuth();

  // Verificar sesión actual al cargar
  getSession().then(session => {
    actualizarUI(session?.user || null);
  });
});
