// ==========================================
// CONFIGURACIÓN DE SUPABASE CLIENT VIA CDN
// ==========================================

// REEMPLAZA ESTOS DATOS CON LOS DE TU PROYECTO REAL EN SUPABASE
const SUPABASE_URL = "https://rvfmtznvkpbmjxfknnmf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_FtHd64Vu38npOYaUK8ReJg_vpFG3e2w";

// Inicializamos el cliente usando la librería global cargada en el index.html
// La CDN de Supabase inyecta un objeto global llamado 'supabase'
export const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);