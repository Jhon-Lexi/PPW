// ============================================================
// CONFIGURACIÓN DE SUPABASE
// ============================================================
// Reemplaza estos valores con los de tu proyecto en supabase.com

const SUPABASE_URL = 'https://rvfmtznvkpbmjxfknnmf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FtHd64Vu38npOYaUK8ReJg_vpFG3e2w';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// FUNCIONES DE AYUDA PARA SUPABASE
// ============================================================

/**
 * Obtiene la sesión actual del usuario
 */
async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error('Error obteniendo sesión:', error.message);
  return data?.session || null;
}

/**
 * Obtiene el usuario actual
 */
async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Obtiene el perfil del usuario actual
 */
async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) {
    console.error('Error obteniendo perfil:', error.message);
    return null;
  }
  return data;
}

/**
 * Verifica si el usuario actual es administrador
 */
async function isAdmin() {
  const profile = await getCurrentProfile();
  return profile && (profile.rol === 'admin' || profile.rol === 'superadmin');
}
