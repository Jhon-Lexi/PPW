// ============================================
// SUPABASE CLIENT - CONFIGURACIÓN
// ============================================
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Supabase

const SUPABASE_URL = 'https://rvfmtznvkpbmjxfknnmf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FtHd64Vu38npOYaUK8ReJg_vpFG3e2w';

// Crear cliente de Supabase
let supabaseClient = null;

function initSupabase() {
  if (typeof supabase !== 'undefined' && !supabaseClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return supabaseClient;
  }
  return supabaseClient;
}

// Inicializar inmediatamente
initSupabase();
