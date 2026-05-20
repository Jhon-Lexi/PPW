export function renderAuth(container) {
    container.innerHTML = `
        <div class="auth-box">
            <div class="auth-tabs">
                <button id="tab-login" class="active">Iniciar Sesión</button>
                <button id="tab-register">Crear Cuenta</button>
            </div>

            <!-- Formulario Login -->
            <form id="login-form" class="auth-form">
                <h3>Ingresar al Sistema</h3>
                <input type="email" id="login-email" placeholder="Email" required>
                <input type="password" id="login-pass" placeholder="Contraseña" required>
                <button type="submit">Activar Circuitos del Tiempo</button>
            </form>

            <!-- Formulario Registro -->
            <form id="register-form" class="auth-form style="display:none;">
                <h3>Registrar Nuevo Viajero</h3>
                <input type="text" id="reg-name" placeholder="Nombre de Piloto" required>
                <input type="email" id="reg-email" placeholder="Email" required>
                <input type="password" id="reg-pass" placeholder="Contraseña (Mínimo 6 caracteres)" required>
                <button type="submit">Generar Identificación</button>
            </form>
        </div>
    `;

    // Lógica para alternar entre Login y Registro
    const tLogin = container.querySelector('#tab-login');
    const tRegister = container.querySelector('#tab-register');
    const fLogin = container.querySelector('#login-form');
    const fRegister = container.querySelector('#register-form');

    tLogin.addEventListener('click', () => {
        fLogin.style.display = 'block'; fRegister.style.display = 'none';
        tLogin.classList.add('active'); tRegister.classList.remove('active');
    });

    tRegister.addEventListener('click', () => {
        fLogin.style.display = 'none'; fRegister.style.display = 'block';
        tRegister.classList.add('active'); tLogin.classList.remove('active');
    });

    // Simular el guardado de sesión para pruebas locales antes de conectar Supabase Client
    fLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        localStorage.setItem('supabase_session', 'active_user_token');
        alert("¡Sesión iniciada!");
        window.location.hash = '#/catalog';
    });
}