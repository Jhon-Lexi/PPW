import { supabaseClient } from '../supabase-config.js';

export async function registerUser(email, password, metadataName) {
    if (!supabaseClient) return { success: false, error: "Supabase no está configurado." };
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { full_name: metadataName } }
        });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function loginUser(email, password) {
    if (!supabaseClient) {
        // Modo simulador offline por seguridad si no hay credenciales puestas
        if (email.includes("admin") || email === "mcfly.admin@hillvalley.com") {
            const fakeUser = { email: email, id: "12345" };
            localStorage.setItem('supabase_session', JSON.stringify({ user: fakeUser }));
            return { success: true };
        }
        return { success: false, error: "Servidor offline. Usa el correo de administrador de prueba." };
    }
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        localStorage.setItem('supabase_session', JSON.stringify(data.session));
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function logoutUser() {
    localStorage.removeItem('supabase_session');
    if (!supabaseClient) {
        window.location.hash = '#/home';
        return { success: true };
    }
    try {
        await supabaseClient.auth.signOut();
        window.location.hash = '#/home';
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getCurrentUser() {
    const session = localStorage.getItem('supabase_session');
    if (!session) return null;
    
    if (!supabaseClient) {
        // Retornar usuario simulado si estamos en modo local de pruebas
        const parsed = JSON.parse(session);
        return parsed.user || { email: 'mcfly.admin@hillvalley.com' };
    }
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) return null;
        return user;
    } catch {
        return null;
    }
}