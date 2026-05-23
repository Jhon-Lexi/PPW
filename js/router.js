import { renderHome } from './pages/home.js';
import { renderCatalog } from './pages/catalog.js';
import { renderContact } from './pages/contact.js';
import { renderAuth } from './pages/authView.js';
import { renderAdmin } from './pages/admin.js';
import { getCurrentUser } from './services/auth.js';

const routes = {
    home: renderHome,
    catalog: renderCatalog,
    contact: renderContact,
    auth: renderAuth,
    admin: renderAdmin
};

// Pon aquí tu correo para que el sistema te reconozca como Administrador
const ADMIN_EMAILS = ['mcfly.admin@hillvalley.com', 'tu-correo-admin@gmail.com'];

export function initRouter() {
    // Escuchar el cambio de hash en la barra de direcciones
    window.addEventListener('hashchange', () => {
        const route = window.location.hash.replace('#/', '') || 'home';
        handleRoute(route);
    });

    // Delegación de eventos para los enlaces del menú de navegación
    document.querySelectorAll('.nav-links [data-route]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const route = link.getAttribute('data-route');
            window.location.hash = `#/${route}`;
        });
    });

    // Carga de la ruta inicial al refrescar la página
    const initialRoute = window.location.hash.replace('#/', '') || 'home';
    handleRoute(initialRoute);
}

async function handleRoute(route) {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    // 🛡️ CONTROL DE ACCESO AL DASHBOARD DEL ADMINISTRADOR
    if (route === 'admin') {
        const user = await getCurrentUser();
        const sessionToken = localStorage.getItem('supabase_session');

        if (!sessionToken || !user || !ADMIN_EMAILS.includes(user.email)) {
            alert("🚨 ¡Paradoja Temporal! No cuentas con autorización gubernamental de Hill Valley para este panel.");
            window.location.hash = '#/catalog';
            return;
        }
    }

    // Renderizar la vista correspondiente
    const renderFunction = routes[route] || renderHome;
    appContainer.innerHTML = ''; 
    await renderFunction(appContainer);
    
    // Evaluar la visibilidad de la pestaña admin cada vez que cambie de vista
    await checkAdminNavbarVisibility();
}

export async function checkAdminNavbarVisibility() {
    const adminNavLi = document.getElementById('admin-nav');
    if (!adminNavLi) return;

    const user = await getCurrentUser();
    const sessionToken = localStorage.getItem('supabase_session');

    if (sessionToken && user && ADMIN_EMAILS.includes(user.email)) {
        adminNavLi.style.display = 'block';
    } else {
        adminNavLi.style.display = 'none';
    }
}