// ============================================================
// CONFIGURACIÓN DE SUPABASE
// ============================================================
// PASOS PARA CONFIGURAR:
// 1. Ve a https://supabase.com → New project
// 2. En Settings > API, copia tu Project URL y anon key
// 3. Pega los valores abajo
// 4. Ejecuta el contenido de sql/schema.sql en el SQL Editor
// ============================================================

const CONFIG = {
    SUPABASE_URL: 'https://rvfmtznvkpbmjxfknnmf.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_FtHd64Vu38npOYaUK8ReJg_vpFG3e2w',

    // Google reCAPTCHA v2 - Obtén tus llaves en https://www.google.com/recaptcha/admin
    RECAPTCHA_SITE_KEY: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
    RECAPTCHA_SECRET_KEY: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',

    // ============================================================
    // USUARIOS INICIALES (Seed)
    // ============================================================
    // Estos usuarios se crean automáticamente en Supabase Auth
    // mediante la API /api/seed-users la primera vez que se
    // carga la aplicación.
    //
    // En producción, las credenciales deben configurarse como
    // variables de entorno en Vercel:
    //   ADMIN_EMAIL, ADMIN_PASSWORD
    //   TEST_USER_EMAIL, TEST_USER_PASSWORD
    //
    // Los valores aquí definidos SOLO se usan como fallback
    // cuando la API no está disponible (desarrollo local sin
    // servidor, o cuando las variables de entorno no existen).
    // ============================================================
    SEED_ADMIN_EMAIL: 'admin@ejemplo.com',
    SEED_ADMIN_PASSWORD: 'Admin123*',
    SEED_USER_EMAIL: 'usuario@ejemplo.com',
    SEED_USER_PASSWORD: 'Usuario123*'
};
