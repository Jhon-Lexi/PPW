import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// !!! REEMPLAZA ESTOS DOS VALORES CON LOS DE TU PANEL DE SUPABASE !!!
const SUPABASE_URL = "https://rvfmtznvkpbmjxfknnmf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_FtHd64Vu38npOYaUK8ReJg_vpFG3e2w";

export let supabaseClient = null;

try {
    // Evitamos inicializar si el usuario no ha cambiado las credenciales por defecto
    if (SUPABASE_URL.includes("tu-proyecto-id")) {
        console.warn("⚠️ Advertencia: Configura tus credenciales reales de Supabase en 'js/supabase-config.js'. Usando modo local simulado.");
    } else {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (error) {
    console.error("No se pudo iniciar el cliente de Supabase:", error);
}