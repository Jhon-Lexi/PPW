// ============================================================
// AUTENTICACIÓN CON SUPABASE AUTH
// ============================================================

const Auth = {
    // Registrar nuevo usuario
    async signUp(email, password) {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;

        // Esperar a que el trigger cree el perfil
        if (data.user) {
            await new Promise(r => setTimeout(r, 1000));
        }
        return data;
    },

    // Iniciar sesión
    async signIn(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    // Cerrar sesión
    async signOut() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        localStorage.removeItem('cart');
    },

    // Obtener usuario actual
    getCurrentUser() {
        return supabaseClient.auth.getUser();
    },

    // Obtener perfil del usuario
    async getProfile(userId) {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data;
    },

    // Verificar si el usuario es admin
    async isAdmin() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return false;
            const profile = await this.getProfile(user.id);
            return profile?.role === 'admin';
        } catch {
            return false;
        }
    },

    // Escuchar cambios de autenticación
    onAuthChange(callback) {
        return supabaseClient.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }
};
