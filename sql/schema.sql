-- ============================================================
-- E-Commerce Supabase Schema
-- Ejecutar en SQL Editor de Supabase Dashboard
-- ============================================================

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

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

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
-- SEED DATA (opcional)
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
