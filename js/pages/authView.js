import { loginUser, registerUser, logoutUser } from '../services/auth.js';
import { checkAdminNavbarVisibility } from '../router.js';

export function renderAuth(container) {
    const session = localStorage.getItem('supabase_session');

    if (session) {
        container.innerHTML = `
            <div class="auth-box" style="text-align:center;">
                <h2 class="neon-text">Panel del Viajero</h2>
                <p style="margin: 20px 0; color:#aaa;">Tu sesión espacio-temporal se encuentra activa en esta terminal.</p>
                <button id="btn-logout" class="btn-neon" style="width:100%;">Cerrar Circuitos (Logout)</button>
            </div>
        `;
        container.querySelector('#btn-logout').addEventListener('click', async () => {
            await logoutUser();
            await checkAdminNavbarVisibility();
        });
        return;
    }

    container.innerHTML = `
        <div class="auth-box">
            <div class="auth-tabs">
                <button id="tab-login" class="active">Iniciar Sesión</button>
                <button id="tab-register">Crear Cuenta</button>
            </div>

            <form id="login-form" class="auth-form">
                <h3>Ingresar al Sistema</h3>
                <input type="email" id="login-email" placeholder="Email (ej. mcfly.admin@hillvalley.com)" required>
                <input type="password" id="login-pass" placeholder="Contraseña" required>
                <button type="submit">Activar Circuitos</button>
            </form>

            <form id="register-form" class="auth-form" style="display:none;">
                <h3>Registrar Nuevo Piloto</h3>
                <input type="text" id="reg-name" placeholder="Nombre Completo" required>
                <input type="email" id="reg-email" placeholder="Email" required>
                <input type="password" id="reg-pass" placeholder="Contraseña (Min. 6 caracteres)" required>
                <button type="submit">Generar Cuenta</button>
            </form>
        </div>
    `;

    const tLogin = container.querySelector('#tab-login');
    const tRegister = container.querySelector('#tab-register');
    const fLogin = container.querySelector('#login-form');
    const fRegister = container.querySelector('#register-form');

    tLogin.addEventListener('click', () => {
        fLogin.style.display = 'flex'; fRegister.style.display = 'none';
        tLogin.classList.add('active'); tRegister.classList.remove('active');
    });

    tRegister.addEventListener('click', () => {
        fLogin.style.display = 'none'; fRegister.style.display = 'flex';
        tRegister.classList.add('active'); tLogin.classList.remove('active');
    });

    fLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = container.querySelector('#login-email').value;
        const pass = container.querySelector('#login-pass').value;
        
        const res = await loginUser(email, pass);
        if (res.success) {
            alert("⚡ ¡Circuitos de tiempo encendidos!");
            await checkAdminNavbarVisibility();
            window.location.hash = '#/admin'; // Redirección automática al entrar
        } else {
            alert(`🚨 Error: ${res.error}`);
        }
    });

    fRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = container.querySelector('#reg-name').value;
        const email = container.querySelector('#reg-email').value;
        const pass = container.querySelector('#reg-pass').value;
        
        const res = await registerUser(email, pass, name);
        if (res.success) {
            alert("⚡ Piloto registrado en el continuo espacio-tiempo. Inicia sesión ahora.");
            tLogin.click();
        } else {
            alert(`🚨 Error: ${res.error}`);
        }
    });
}