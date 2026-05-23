import { supabaseClient } from '../supabase-config.js';

export async function getProducts() {
    if (!supabaseClient) return { success: false, data: [] };
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('id', { ascending: true });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message, data: [] };
    }
}

export async function addProduct(productData) {
    if (!supabaseClient) return { success: false, error: "Modo simulador activo. Conecta tu base de datos real." };
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .insert([productData])
            .select();
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}