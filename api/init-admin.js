// ============================================================
// API: Inicializar administrador del sistema
// Crea el primer administrador usando variables de entorno
// ADMIN_EMAIL y ADMIN_PASSWORD definidas en Vercel.
// ============================================================
// Uso:
//   POST /api/init-admin
//   Body: { force?: boolean } (force=true recrea si ya existe)
//
// Variables de entorno requeridas (Vercel):
//   ADMIN_EMAIL       - Correo del administrador
//   ADMIN_PASSWORD    - Contraseña del administrador
//   SUPABASE_URL      - URL del proyecto Supabase
//   SUPABASE_SERVICE_ROLE_KEY - Service Role Key de Supabase
// ============================================================

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Método no permitido' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Verificar que las variables de entorno estén configuradas
    const missing = [];
    if (!adminEmail) missing.push('ADMIN_EMAIL');
    if (!adminPassword) missing.push('ADMIN_PASSWORD');
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missing.length > 0) {
        return res.status(400).json({
            success: false,
            error: `Faltan variables de entorno: ${missing.join(', ')}`
        });
    }

    try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Verificar si el administrador ya existe en auth.users
        const { data: existingUsers, error: searchError } = await supabase
            .from('profiles')
            .select('id, email, role')
            .eq('email', adminEmail)
            .limit(1);

        if (searchError) {
            console.error('Error searching for existing admin:', searchError);
        }

        const force = req.body?.force === true;

        if (existingUsers && existingUsers.length > 0 && !force) {
            // Asegurar que tenga rol admin
            if (existingUsers[0].role !== 'admin') {
                await supabase
                    .from('profiles')
                    .update({ role: 'admin' })
                    .eq('id', existingUsers[0].id);
            }
            return res.status(200).json({
                success: true,
                message: 'El administrador ya existe',
                email: adminEmail
            });
        }

        // Si force=true y ya existe, eliminar perfil y recrear
        if (existingUsers && existingUsers.length > 0 && force) {
            await supabase.from('profiles').delete().eq('email', adminEmail);
        }

        // Crear usuario en auth.users usando la API de administración
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { role: 'admin' }
        });

        if (createError) {
            // Si el usuario ya existe en auth pero no en profiles
            if (createError.message?.includes('already exists')) {
                const { data: userByEmail } = await supabase.auth.admin.listUsers();
                const found = userByEmail?.users?.find(u => u.email === adminEmail);
                if (found) {
                    // Intentar resetear contraseña
                    await supabase.auth.admin.updateUserById(found.id, {
                        password: adminPassword
                    });
                    // Crear o actualizar perfil
                    const { error: upsertError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: found.id,
                            email: adminEmail,
                            role: 'admin'
                        }, { onConflict: 'id' });
                    if (upsertError) throw upsertError;
                    return res.status(200).json({
                        success: true,
                        message: 'Administrador actualizado exitosamente',
                        email: adminEmail
                    });
                }
            }
            throw createError;
        }

        if (!newUser?.user) {
            throw new Error('No se pudo crear el usuario administrador');
        }

        // Crear perfil con rol admin (el trigger crea uno con role=user, lo sobrescribimos)
        await new Promise(r => setTimeout(r, 1500));
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: newUser.user.id,
                email: adminEmail,
                role: 'admin'
            }, { onConflict: 'id' });

        if (profileError) {
            console.error('Error creating admin profile:', profileError);
            // Intentar una vez más
            await new Promise(r => setTimeout(r, 1000));
            const { error: retryError } = await supabase
                .from('profiles')
                .upsert({
                    id: newUser.user.id,
                    email: adminEmail,
                    role: 'admin'
                }, { onConflict: 'id' });
            if (retryError) throw retryError;
        }

        return res.status(201).json({
            success: true,
            message: 'Administrador creado exitosamente',
            email: adminEmail
        });

    } catch (err) {
        console.error('Error in init-admin:', err);
        return res.status(500).json({
            success: false,
            error: `Error al inicializar administrador: ${err.message}`
        });
    }
}
