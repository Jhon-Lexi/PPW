// ============================================================
// API: Verificar código OTP y gestionar tasa de intentos
// Ejecutado como Vercel Serverless Function
//
// NOTA: La verificación principal del OTP la realiza Supabase
// directamente. Esta función se usa para:
// 1. Rate limiting adicional del lado servidor
// 2. Auditoría de intentos
// 3. Protección contra fuerza bruta
// ============================================================
// Petición esperada (frontend → API):
//   POST /api/verify-otp
//   Content-Type: application/json
//   Body: { email, action: 'check_rate_limit' }
//      o: { email, action: 'log_attempt', otp_action, metadata }
//
// Respuesta esperada (API → frontend):
//   { success: true, allowed: true/false, remaining: N, resetAfter: N }
//      o: { success: true }
//      o: { success: false, error: '...' }
// ============================================================

import { createClient } from '@supabase/supabase-js';

function setCORS(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
    // Manejar preflight CORS
    if (req.method === 'OPTIONS') {
        setCORS(res);
        return res.status(200).end();
    }

    setCORS(res);

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Método no permitido' });
    }

    const { email, action } = req.body;

    if (!email || !action) {
        return res.status(400).json({ success: false, error: 'Email y acción requeridos' });
    }

    const validActions = ['log_attempt', 'check_rate_limit'];
    if (!validActions.includes(action)) {
        return res.status(400).json({ success: false, error: 'Acción no válida' });
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.log('[verify-otp] Modo desarrollo: sin service role key, se omite validación');
            return res.status(200).json({ success: true, mode: 'development', allowed: true });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

        console.log(`[verify-otp] Acción: ${action}, email: ${email}, ip: ${ip}`);

        if (action === 'log_attempt') {
            const { error: logError } = await supabase
                .from('otp_logs')
                .insert([{
                    email,
                    action: req.body.otp_action || 'sent',
                    ip_address: ip,
                    metadata: req.body.metadata || {}
                }]);

            if (logError) {
                console.error('[verify-otp] Error al registrar en otp_logs:', logError.message);
            } else {
                console.log(`[verify-otp] Registrado: ${email} / ${req.body.otp_action || 'sent'}`);
            }

            return res.status(200).json({ success: true });
        }

        if (action === 'check_rate_limit') {
            const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

            const { count, error: countError } = await supabase
                .from('otp_logs')
                .select('*', { count: 'exact', head: true })
                .eq('email', email)
                .in('action', ['sent', 'failed'])
                .gte('created_at', fifteenMinAgo);

            if (countError) {
                console.error('[verify-otp] Error al consultar rate limit:', countError.message);
                return res.status(200).json({ success: true, allowed: true, mode: 'fallback' });
            }

            const allowed = (count || 0) < 5;
            console.log(`[verify-otp] Rate limit: ${email} → ${count || 0} intentos, ${allowed ? 'permitido' : 'BLOQUEADO'}`);

            return res.status(200).json({
                success: true,
                allowed,
                remaining: Math.max(0, 5 - (count || 0)),
                resetAfter: allowed ? 0 : 15 * 60
            });
        }

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error('[verify-otp] Error interno:', err.message);
        return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
}
