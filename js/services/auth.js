import { supabaseClient } from '../supabase-config.js';

// ==========================================
// SERVICIO DE AUTENTICACIÓN (SUPABASE AUTH)
// ==========================================

/**
 * Registra un nuevo usuario en Supabase Auth
 * @param {string} email 
 * @param {string} password 
 * @param {string} metadataName Nombre completo del piloto temporal
 */
export async function registerUser(email, password, metadataName) {
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: metadataName,
                    time_traveler_rank: "Novato"
                }
            }
        });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error en Registro:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Inicia sesión de un usuario existente
 * @param {string} email 
 * @param {string} password 
 */
export async function loginUser(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;
        
        // Guardar sesión en localStorage para mantener el estado en el frontend
        localStorage.setItem('supabase_session', JSON.stringify(data.session));
        return { success: true, data };
    } catch (error) {
        console.error("Error en Login:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Cierra la sesión activa en el cliente y remueve datos locales
 */
export async function logoutUser() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        
        localStorage.removeItem('supabase_session');
        window.location.hash = '#/home';
        return { success: true };
    } catch (error) {
        console.error("Error al cerrar sesión:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene el usuario actualmente autenticado
 */
export async function getCurrentUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}