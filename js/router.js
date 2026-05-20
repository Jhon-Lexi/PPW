import { renderHome } from './pages/home.js';
import { renderCatalog } from './pages/catalog.js';
import { renderContact } from './pages/contact.js';
import { renderAuth } from './pages/authView.js';
import { renderAdmin } from './pages/admin.js';

const routes = {
    home: renderHome,
    catalog: renderCatalog,
    contact: renderContact,
    auth: renderAuth,
    admin: renderAdmin
};

export function initRouter() {
    window.addEventListener('hashchange', () => {
        const route = window.location.hash.replace('#/', '') || 'home';
        handleRoute(route);
    });

    // Manejar clics en el navbar
    document.querySelectorAll('[data-route]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const route = link.getAttribute('data-route');
            window.location.hash = `#/${route}`;
        });
    });

    // Carga inicial
    const initialRoute = window.location.hash.replace('#/', '') || 'home';
    handleRoute(initialRoute);
}

function handleRoute(route) {
    const renderFunction = routes[route] || renderHome;
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = ''; // Limpiar contenedor
    renderFunction(appContainer); // Renderizar la página actual
}