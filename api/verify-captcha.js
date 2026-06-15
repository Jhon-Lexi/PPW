// ============================================================
// API: Verificar token de reCAPTCHA v2
// Ejecutado como Vercel Serverless Function
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

    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ success: false, error: 'Token requerido' });
    }

    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                secret: secretKey,
                response: token
            })
        });

        const data = await response.json();

        if (data.success) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(400).json({
                success: false,
                error: data['error-codes']?.join(', ') || 'Verificación fallida'
            });
        }
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
}
