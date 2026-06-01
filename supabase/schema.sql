-- ============================================================
-- ESQUEMA COMPLETO DE SUPABASE PARA TIENDA ONLINE
-- ============================================================
-- Ejecuta este SQL en el Editor SQL de tu proyecto Supabase

-- 1. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  imagen_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  categoria VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE USUARIOS (perfil extendido)
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(255),
  telefono VARCHAR(20),
  direccion TEXT,
  rol VARCHAR(20) DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE EVENTOS
CREATE TABLE IF NOT EXISTS eventos (
  id BIGSERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  hora TIME,
  lugar VARCHAR(255),
  imagen_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  total DECIMAL(10, 2) NOT NULL,
  estado VARCHAR(50) DEFAULT 'pendiente',
  direccion_envio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE DETALLE DE PEDIDOS
CREATE TABLE IF NOT EXISTS detalle_pedidos (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id BIGINT NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL
);

-- 6. TABLA DE CONTACTOS (mensajes del formulario)
CREATE TABLE IF NOT EXISTS contactos (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE CATEGORÍAS
CREATE TABLE IF NOT EXISTS categorias (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INSERTAR CATEGORÍAS POR DEFECTO
INSERT INTO categorias (nombre) VALUES
  ('Electrónica'),
  ('Ropa'),
  ('Hogar'),
  ('Deportes'),
  ('Libros')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- PRODUCTOS: todos pueden leer, solo admin puede insertar/actualizar/eliminar
CREATE POLICY "Productos - lectura pública" ON productos
  FOR SELECT USING (true);
CREATE POLICY "Productos - inserción admin" ON productos
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin')));
CREATE POLICY "Productos - actualización admin" ON productos
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin')));
CREATE POLICY "Productos - eliminación admin" ON productos
  FOR DELETE USING (auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin')));

-- PERFILES: cada usuario ve su propio perfil, admin ve todos
CREATE POLICY "Perfiles - lectura propia" ON perfiles
  FOR SELECT USING (auth.uid() = id OR auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin')));
CREATE POLICY "Perfiles - inserción propia" ON perfiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Perfiles - actualización propia" ON perfiles
  FOR UPDATE USING (auth.uid() = id OR auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin')));

-- EVENTOS: todos pueden leer, solo admin puede escribir
CREATE POLICY "Eventos - lectura pública" ON eventos
  FOR SELECT USING (true);
CREATE POLICY "Eventos - inserción admin" ON eventos
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin')));
CREATE POLICY "Eventos - actualización admin" ON eventos
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin')));
CREATE POLICY "Eventos - eliminación admin" ON eventos
  FOR DELETE USING (auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin')));

-- PEDIDOS: usuario ve sus pedidos, admin ve todos
CREATE POLICY "Pedidos - lectura propia" ON pedidos
  FOR SELECT USING (auth.uid() = usuario_id OR auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin')));
CREATE POLICY "Pedidos - inserción propia" ON pedidos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- CONTACTOS: cualquiera puede insertar, solo admin lee
CREATE POLICY "Contactos - inserción pública" ON contactos
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Contactos - lectura admin" ON contactos
  FOR SELECT USING (auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin')));

-- CATEGORÍAS: todos pueden leer, solo admin escribe
CREATE POLICY "Categorías - lectura pública" ON categorias
  FOR SELECT USING (true);
CREATE POLICY "Categorías - inserción admin" ON categorias
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM perfiles WHERE rol IN ('admin', 'superadmin')));

-- ============================================================
-- TRIGGER: Crear perfil automáticamente al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION crear_perfil()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', ''), 'cliente');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION crear_perfil();

-- ============================================================
-- INSERTAR PRODUCTOS DE EJEMPLO
-- ============================================================
INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url) VALUES
  ('Auriculares Bluetooth', 'Auriculares inalámbricos con cancelación de ruido', 59.99, 50, 'Electrónica', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'),
  ('Camiseta Algodón', 'Camiseta de algodón orgánico, cómoda y fresca', 19.99, 100, 'Ropa', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'),
  ('Lámpara LED', 'Lámpara de escritorio LED con regulador de intensidad', 34.99, 30, 'Hogar', 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400'),
  ('Balón de Fútbol', 'Balón oficial tamaño 5, costura reforzada', 29.99, 80, 'Deportes', 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=400'),
  ('Libro: JavaScript Moderno', 'Guía completa de ES6+ para desarrolladores', 24.99, 60, 'Libros', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400')
ON CONFLICT DO NOTHING;

-- ============================================================
-- INSERTAR EVENTOS DE EJEMPLO
-- ============================================================
INSERT INTO eventos (titulo, descripcion, fecha, hora, lugar) VALUES
  ('Lanzamiento Nuevos Productos', 'Presentación de nuestra nueva colección de verano', '2026-07-15', '18:00', 'Centro de Convenciones, Lima'),
  ('Taller de Tecnología', 'Aprende sobre las últimas tendencias en gadgets', '2026-08-20', '10:00', 'Auditorio Principal')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CREAR USUARIOS DE PRUEBA (desde la interfaz de Supabase Auth)
-- ============================================================
-- Crea estos usuarios manualmente en Authentication > Users > Add User:
--
-- ADMIN:
--   Email: admin@tienda.com
--   Password: Admin123!
--   Luego en la tabla perfiles, cambia su rol a 'superadmin'
--
-- CLIENTE:
--   Email: cliente@test.com
--   Password: Cliente123!
--   El rol se asigna automáticamente como 'cliente'
