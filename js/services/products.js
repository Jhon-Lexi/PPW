import { supabaseClient } from '../supabase-config.js';

// ==========================================
// SERVICIO DE PRODUCTOS (SUPABASE DATABASE)
// ==========================================

/**
 * Obtiene todos los artefactos temporales desde la tabla 'products'
 */
export async function getProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error obteniendo productos:", error.message);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Inserta un nuevo producto al catálogo (Lógica para el Dashboard Admin)
 * @param {Object} productData Objeto estructurado con { name, price, description, image_url }
 */
export async function addProduct(productData) {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .insert([productData])
            .select();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error guardando nuevo producto:", error.message);
        return { success: false, error: error.message };
    }
}