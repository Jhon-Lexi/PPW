// ============================================================
// AUTENTICACIÓN CON SUPABASE AUTH
// ============================================================

const Auth = {
    // Usuarios de respaldo para modo simulación (solo cuando Supabase no responde)
    _FALLBACK_USERS: [
        { email: 'admin@ejemplo.com', password: 'Admin123*', role: 'admin' },
        { email: 'usuario@ejemplo.com', password: 'Usuario123*', role: 'user' }
    ],

    _isSupabaseAvailable: true,
    _cachedFallbackRole: null,

    _getFallbackUser(email, password) {
        return this._FALLBACK_USERS.find(u => u.email === email && u.password === password);
    },

    _getFallbackUserByEmail(email) {
        return this._FALLBACK_USERS.find(u => u.email === email);
    },

    // --- MÉTODOS PÚBLICOS ---

    /**
     * Obtiene el usuario actual desde Supabase Auth
     */
    async getCurrentUser() {
        try {
            const { data, error } = await supabaseClient.auth.getUser();
            if (error) throw error;
            if (data?.user) {
                this._isSupabaseAvailable = true;
                return data;
            }
        } catch {
            this._isSupabaseAvailable = false;
        }
        return { user: null };
    },

    /**
     * Obtiene el rol del usuario desde la tabla profiles en Supabase
     */
    async getUserRole() {
        try {
            const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
            if (userError) throw userError;
            if (!user) return null;

            const { data: profile, error: profileError } = await supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;
            if (profile?.role) {
                this._isSupabaseAvailable = true;
                this._cachedFallbackRole = null;
                return profile.role;
            }
        } catch {
            this._isSupabaseAvailable = false;
        }
        return this._cachedFallbackRole || null;
    },

    /**
     * Verifica si el usuario actual es administrador
     */
    async isAdmin() {
        const role = await this.getUserRole();
        return role === 'admin';
    },

    /**
     * Obtiene perfil completo
     */
    async getProfile(userId) {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data;
    },

    /**
     * Registrar nuevo usuario en Supabase Auth
     */
    async signUp(email, password) {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        if (!data?.user) throw new Error('No se pudo crear la cuenta');

        // Esperar a que el trigger cree el perfil automáticamente
        await new Promise(r => setTimeout(r, 2000));

        // Intentar crear perfil directamente por si el trigger falló
        try {
            await supabaseClient.from('profiles').insert({
                id: data.user.id, email, role: 'user'
            });
        } catch {
            // El trigger ya pudo haberlo creado, ignorar error
        }

        return data;
    },

    /**
     * Iniciar sesión con 2FA (paso 1: validar credenciales contra Supabase)
     */
    async signInWith2FA(email, password) {
        // 1. Intentar validar contra Supabase Auth
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email, password
            });
            if (error) throw error;

            // Cerrar sesión inmediatamente para forzar 2FA
            await supabaseClient.auth.signOut();

            this._isSupabaseAvailable = true;
            return { email };
        } catch (err) {
            // 2. Si Supabase no está disponible, intentar con fallback local
            const fbUser = this._getFallbackUser(email, password);
            if (!fbUser) {
                throw new Error(
                    err.message === 'Invalid login credentials'
                        ? 'Credenciales inválidas'
                        : err.message || 'Credenciales inválidas'
                );
            }

            this._isSupabaseAvailable = false;
            this._cachedFallbackRole = fbUser.role;
            console.warn('[Auth] Supabase no disponible, usando validación local');
            return { email };
        }
    },

    /**
     * Completa el inicio de sesión después del 2FA exitoso
     */
    async completeSignIn(email) {
        // 1. Intentar restaurar sesión en Supabase
        if (this._isSupabaseAvailable) {
            const fbUser = this._getFallbackUserByEmail(email);
            if (fbUser) {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: fbUser.email,
                    password: fbUser.password
                });
                if (!error && data?.user) {
                    return { email: data.user.email, user: data.user };
                }
            }
        }

        // 2. Fallback: sesión simulada solo cuando Supabase no está disponible
        if (!this._isSupabaseAvailable) {
            const fbUser = this._getFallbackUserByEmail(email);
            if (fbUser) {
                console.warn('[Auth] Usando sesión simulada (Supabase no disponible)');
                return { email: fbUser.email, user: { id: 'fallback-' + fbUser.email, email: fbUser.email } };
            }
        }

        throw new Error('No se pudo establecer la sesión');
    },

    /**
     * Iniciar sesión directa (sin 2FA)
     */
    async signIn(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        this._isSupabaseAvailable = true;
        return data;
    },

    /**
     * Cerrar sesión en Supabase
     */
    async signOut() {
        localStorage.removeItem('cart');
        try {
            await supabaseClient.auth.signOut();
        } catch {}
        this._cachedFallbackRole = null;
    },

    /**
     * Inicializar usuarios seed
     */
    async seedUsers(force = false) {
        try {
            const res = await fetch('/api/seed-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ force })
            });
            return await res.json();
        } catch {
            console.log('[Seed] API no disponible');
            return { success: false, mode: 'unavailable' };
        }
    },

    async initAdmin(force = false) {
        return this.seedUsers(force);
    },

    onAuthChange(callback) {
        return supabaseClient.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }
};

window.Auth = Auth;
