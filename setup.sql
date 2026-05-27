-- ============================================
-- SCRIPT DE CONFIGURACIÓN PARA SUPABASE
-- ============================================
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. CREAR TABLAS

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  rol TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  precio DECIMAL(10,2) NOT NULL,
  imagen TEXT DEFAULT '',
  categoria TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
  direccion TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de items del pedido
CREATE TABLE IF NOT EXISTS pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio DECIMAL(10,2) NOT NULL
);

-- 2. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);

-- 3. CONFIGURAR ROW LEVEL SECURITY (RLS)
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS

-- Perfiles: cada usuario puede leer/actualizar su propio perfil; admin puede todo
CREATE POLICY perfiles_select_own ON perfiles
  FOR SELECT USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY perfiles_update_own ON perfiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY perfiles_insert_own ON perfiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Productos: todos pueden leer (incluso sin autenticación); solo admin puede insertar/actualizar/eliminar
CREATE POLICY productos_select_all ON productos
  FOR SELECT USING (true);

CREATE POLICY productos_insert_admin ON productos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY productos_update_admin ON productos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY productos_delete_admin ON productos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Pedidos: usuarios pueden ver sus propios pedidos; admin puede ver todos
CREATE POLICY pedidos_select_own ON pedidos
  FOR SELECT USING (
    usuario_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY pedidos_insert_own ON pedidos
  FOR INSERT WITH CHECK (usuario_id = auth.uid());

CREATE POLICY pedidos_update_admin ON pedidos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Pedido items: mismos permisos que pedidos
CREATE POLICY pedido_items_select_own ON pedido_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM pedidos WHERE id = pedido_id AND (
      usuario_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
    ))
  );

CREATE POLICY pedido_items_insert_own ON pedido_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM pedidos WHERE id = pedido_id AND usuario_id = auth.uid())
  );

-- 5. CREAR FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nombre', ''), 'cliente');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TRIGGER PARA NUEVOS USUARIOS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. INSERTAR PRODUCTOS DE EJEMPLO
INSERT INTO productos (nombre, descripcion, precio, imagen, categoria) VALUES
('Auriculares Bluetooth Pro', 'Auriculares inalámbricos con cancelación de ruido y 30h de batería', 89.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 'electronica'),
('Reloj Inteligente Deportivo', 'Smartwatch con GPS, monitor cardíaco y resistente al agua', 199.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 'electronica'),
('Mochila Urbana Premium', 'Mochila impermeable con compartimento para laptop de 15"', 59.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 'accesorios'),
('Zapatillas Running Ultra', 'Zapatillas ligeras con amortiguación avanzada para máximo confort', 129.99, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 'deportes'),
('Cámara Digital 4K', 'Cámara mirrorless con sensor de 24MP y grabación 4K', 449.99, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400', 'electronica'),
('Bolso de Cuero Artesanal', 'Bolso elaborado en cuero genuino con diseño clásico y elegante', 79.99, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400', 'accesorios'),
('Kit de Yoga Completo', 'Incluye esterilla, bloques, correa y bolsa de transporte', 39.99, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400', 'deportes'),
('Botella Térmica Acero', 'Botella de acero inoxidable que mantiene la temperatura 24h', 34.99, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', 'accesorios')
ON CONFLICT DO NOTHING;

-- 8. CREAR USUARIOS DE PRUEBA (ejecutar solo si no existen)
-- NOTA: Los usuarios deben crearse desde la interfaz de Supabase Auth o mediante API
-- después ejecutar este SQL para asignarles rol de admin:
-- UPDATE perfiles SET rol = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@prueba.com');
-- UPDATE perfiles SET nombre = 'Cliente Prueba' WHERE id = (SELECT id FROM auth.users WHERE email = 'cliente@prueba.com');
-- UPDATE perfiles SET nombre = 'Admin Prueba' WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@prueba.com');
