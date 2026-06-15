-- ============================================================
-- E-Commerce Supabase Schema
-- Ejecutar en SQL Editor de Supabase Dashboard
-- ============================================================
-- HABILITAR EXTENSIONES
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    shipping_info JSONB NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. OTP LOGS TABLE (para auditoría de autenticación 2FA)
CREATE TABLE IF NOT EXISTS otp_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('sent', 'verified', 'failed', 'expired', 'resent')),
    ip_address TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas rápidas por email
CREATE INDEX IF NOT EXISTS idx_otp_logs_email ON otp_logs(email);
CREATE INDEX IF NOT EXISTS idx_otp_logs_created ON otp_logs(created_at);

-- 6. RATE LIMIT TABLE (para controlar intentos de OTP)
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL, -- email o IP
    action_type TEXT NOT NULL, -- 'otp_request', 'otp_verify', 'login_attempt'
    attempts INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    locked_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, action_type);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update profiles"
    ON profiles FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- PRODUCTS POLICIES
CREATE POLICY "Anyone can view products"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert products"
    ON products FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update products"
    ON products FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can delete products"
    ON products FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- CONTACTS POLICIES
CREATE POLICY "Anyone can insert contacts"
    ON contacts FOR INSERT
    WITH CHECK (true);

-- ORDERS POLICIES
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
    ON orders FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================================
-- TRIGGER: Create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED DATA: Productos
-- ============================================================
INSERT INTO products (name, description, price, image_url, category, stock) VALUES
('Auriculares Inalámbricos Pro', 'Sonido envolvente con cancelación de ruido activa', 79.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 'Electrónica', 50),
('SmartWatch Ultra', 'Reloj inteligente con GPS y monitoreo de salud', 199.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 'Electrónica', 30),
('Chaqueta de Cuero Premium', 'Cuero genuino italiano con forro de seda', 149.99, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', 'Ropa', 20),
('Zapatillas Deportivas Air', 'Amortiguación reactiva para máximo rendimiento', 89.99, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 'Deportes', 40),
('Cafetera Espresso', 'Café italiano auténtico en casa con vaporizador', 49.99, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400', 'Hogar', 25),
('Esterilla de Yoga Eco', 'Material ecológico antideslizante 6mm', 29.99, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400', 'Deportes', 60),
('Lámpara de Escritorio LED', 'Luz regulable con temperatura de color ajustable', 24.99, 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400', 'Hogar', 35),
('Set de Libros de Diseño', 'Colección esencial de teoría del diseño', 39.99, 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400', 'Libros', 15),
('Mochila Urbana 30L', 'Impermeable con compartido para laptop', 59.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 'Accesorios', 45),
('Altavoz Bluetooth Portátil', 'Sonido 360° con 20h de batería', 34.99, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', 'Electrónica', 55);

-- ============================================================
-- FUNCIÓN SEGURA PARA CREAR USUARIOS
-- ============================================================
-- Esta función maneja las diferencias entre versiones de Supabase
-- al crear usuarios. La estructura de auth.users cambia entre
-- versiones (nuevas columnas como is_sso_user, is_anonymous, etc.)
-- por lo que INSERT directo puede fallar.
--
-- La función intenta dos estrategias:
--   1. Usar auth.admin_create_user() si está disponible (Supabase >= 1.65)
--   2. Fallback a INSERT mínimo con las columnas más estables
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_create_user_safe(
    p_email TEXT,
    p_password TEXT,
    p_role TEXT DEFAULT 'user'
) RETURNS UUID
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_exists  UUID;
BEGIN
    -- Verificar si ya existe en auth.users
    SELECT id INTO v_exists FROM auth.users WHERE email = p_email;
    IF FOUND THEN
        -- Actualizar contraseña y asegurar perfil
        UPDATE auth.users
        SET encrypted_password = crypt(p_password, gen_salt('bf'))
        WHERE id = v_exists;
        INSERT INTO public.profiles (id, email, role)
        VALUES (v_exists, p_email, p_role)
        ON CONFLICT (id) DO UPDATE SET role = p_role, email = p_email;
        RETURN v_exists;
    END IF;

    -- Estrategia 1: Usar auth.admin_create_user() si existe
    BEGIN
        v_user_id := auth.admin_create_user(
            p_email,
            p_password,
            jsonb_build_object('role', p_role),
            'authenticated',
            true  -- email_confirm
        );
    EXCEPTION WHEN OTHERS THEN
        -- Estrategia 2: INSERT directo con columnas estables
        BEGIN
            INSERT INTO auth.users (
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                aud,
                role
            ) VALUES (
                p_email,
                crypt(p_password, gen_salt('bf')),
                NOW(),
                jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::text[]),
                jsonb_build_object('role', p_role),
                'authenticated',
                'authenticated'
            )
            RETURNING id INTO v_user_id;
        EXCEPTION WHEN OTHERS THEN
            -- Estrategia 3: Con columnas adicionales (versiones recientes)
            INSERT INTO auth.users (
                instance_id,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                aud,
                role,
                created_at,
                updated_at,
                is_sso_user,
                is_anonymous
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                p_email,
                crypt(p_password, gen_salt('bf')),
                NOW(),
                jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::text[]),
                jsonb_build_object('role', p_role),
                'authenticated',
                'authenticated',
                NOW(),
                NOW(),
                FALSE,
                FALSE
            )
            RETURNING id INTO v_user_id;
        END;
    END;

    -- Crear/actualizar perfil
    INSERT INTO public.profiles (id, email, role)
    VALUES (v_user_id, p_email, p_role)
    ON CONFLICT (id) DO UPDATE SET role = p_role, email = p_email;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DATA: Usuarios de prueba
-- ============================================================
-- Crea automáticamente el administrador y el usuario de prueba
-- usando la función segura fn_create_user_safe.
--
-- IMPORTANTE:
--   1. Antes de ejecutar este script, ve a Authentication > Settings
--      en Supabase Dashboard y deshabilita "Confirm email".
--   2. Si esta función falla, usa la API /api/seed-users desde
--      la aplicación o crea los usuarios manualmente desde
--      Authentication > Users en Supabase Dashboard.
--
-- Credenciales por defecto:
--   Admin:  admin@ejemplo.com     / Admin123*
--   Test:   usuario@ejemplo.com   / Usuario123*
-- ============================================================

DO $$
DECLARE
    v_id UUID;
BEGIN
    -- Crear administrador
    v_id := public.fn_create_user_safe('admin@ejemplo.com', 'Admin123*', 'admin');
    RAISE NOTICE 'Admin listo: admin@ejemplo.com / Admin123* (ID: %)', v_id;

    -- Crear usuario de prueba
    v_id := public.fn_create_user_safe('usuario@ejemplo.com', 'Usuario123*', 'user');
    RAISE NOTICE 'Usuario listo: usuario@ejemplo.com / Usuario123* (ID: %)', v_id;
END;
$$;

-- ============================================================
-- NOTA: Cambiar credenciales después de la creación inicial
-- ============================================================
-- Para cambiar el correo o contraseña de un usuario después
-- de creado, usa Supabase Dashboard:
--   1. Ve a Authentication > Users
--   2. Busca el usuario
--   3. Usa "Edit" para cambiar email o contraseña
--
-- O desde SQL:
--   UPDATE auth.users
--   SET email = 'nuevo@email.com',
--       encrypted_password = crypt('NuevaPass123!', gen_salt('bf'))
--   WHERE email = 'admin@ejemplo.com';
