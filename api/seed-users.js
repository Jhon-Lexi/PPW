// ============================================================
// API: Crear usuarios iniciales del sistema (Admin + Test)
// Crea automáticamente el administrador y el usuario de prueba
// usando la API de administración de Supabase.
// ============================================================
// Uso:
//   POST /api/seed-users
//   Body: { force?: boolean } (force=true recrea si ya existen)
//
// Variables de entorno requeridas (Vercel):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Los correos y contraseñas se definen en las siguientes
// variables de entorno. Si no están configuradas, se usan
// los valores por defecto definidos en CONFIG (js/config.js).
//
//   ADMIN_EMAIL       (defecto: admin@ejemplo.com)
//   ADMIN_PASSWORD    (defecto: Admin123*)
//   TEST_USER_EMAIL   (defecto: usuario@ejemplo.com)
//   TEST_USER_PASSWORD (defecto: Usuario123*)
// ============================================================

// Valores por defecto (coinciden con js/config.js)
const DEFAULT_ADMIN_EMAIL = 'admin@ejemplo.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin123*';
const DEFAULT_TEST_EMAIL = 'usuario@ejemplo.com';
const DEFAULT_TEST_PASSWORD = 'Usuario123*';

/**
 * Crea o actualiza un usuario en Supabase Auth y su perfil.
 * Retorna { created, updated, error }
 */
async function ensureUser(supabase, email, password, role, force) {
    // 1. Buscar si el usuario ya existe en profiles
    const { data: existing } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', email)
        .limit(1);

    const alreadyExists = existing && existing.length > 0;

    if (alreadyExists && !force) {
        // Asegurar que tenga el rol correcto
        if (existing[0].role !== role) {
            await supabase.from('profiles').update({ role }).eq('id', existing[0].id);
            return { created: false, updated: true, id: existing[0].id };
        }
        return { created: false, updated: false, id: existing[0].id };
    }

    // Si force=true y ya existe, eliminar perfil
    if (alreadyExists && force) {
        await supabase.from('profiles').delete().eq('email', email);
    }

    // 2. Intentar crear en Auth usando Admin API
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role }
    });

    if (createError) {
        // Si el error es "already exists", buscar y actualizar
        if (createError.message?.toLowerCase().includes('already exists')) {
            const { data: usersList } = await supabase.auth.admin.listUsers();
            const found = usersList?.users?.find(u => u.email === email);
            if (found) {
                // Actualizar contraseña
                await supabase.auth.admin.updateUserById(found.id, { password });
                // Asegurar perfil
                await supabase.from('profiles').upsert({
                    id: found.id, email, role
                }, { onConflict: 'id' });
                return { created: false, updated: true, id: found.id, note: 'Usuario actualizado en Auth' };
            }
        }
        return { created: false, error: createError.message };
    }

    if (!newUser?.user) {
        return { created: false, error: 'No se pudo crear el usuario' };
    }

    // 3. Crear perfil con el rol indicado
    await new Promise(r => setTimeout(r, 1500));
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: newUser.user.id, email, role }, { onConflict: 'id' });

    if (profileError) {
        // Reintentar una vez
        await new Promise(r => setTimeout(r, 1000));
        const { error: retryError } = await supabase
            .from('profiles')
            .upsert({ id: newUser.user.id, email, role }, { onConflict: 'id' });
        if (retryError) {
            return { created: true, id: newUser.user.id, warning: 'Perfil no creado: ' + retryError.message };
        }
    }

    return { created: true, id: newUser.user.id };
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Método no permitido' });
    }

    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(400).json({
            success: false,
            error: 'Faltan variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
        });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Leer credenciales desde env vars, con fallback a valores por defecto
        const adminEmail = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
        const testEmail = process.env.TEST_USER_EMAIL || DEFAULT_TEST_EMAIL;
        const testPassword = process.env.TEST_USER_PASSWORD || DEFAULT_TEST_PASSWORD;

        const force = req.body?.force === true;

        // Crear administrador
        const adminResult = await ensureUser(supabase, adminEmail, adminPassword, 'admin', force);

        // Crear usuario de prueba
        const testResult = await ensureUser(supabase, testEmail, testPassword, 'user', force);

        const errors = [];
        if (adminResult.error) errors.push(`Admin: ${adminResult.error}`);
        if (testResult.error) errors.push(`Test: ${testResult.error}`);

        const success = !adminResult.error && !testResult.error;

        return res.status(success ? 200 : 500).json({
            success,
            message: success
                ? 'Usuarios inicializados correctamente'
                : 'Error al crear algunos usuarios',
            users: {
                admin: {
                    email: adminEmail,
                    role: 'admin',
                    created: adminResult.created,
                    updated: adminResult.updated,
                    warning: adminResult.warning || null
                },
                test: {
                    email: testEmail,
                    role: 'user',
                    created: testResult.created,
                    updated: testResult.updated,
                    warning: testResult.warning || null
                }
            },
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err) {
        console.error('Error in seed-users:', err);
        return res.status(500).json({
            success: false,
            error: `Error al inicializar usuarios: ${err.message}`
        });
    }
}
