# 🛍️ ShopExpress - E-commerce Vanilla JS + Supabase

E-commerce completo desarrollado con **Vanilla JavaScript (ES6+)**, **HTML5**, **CSS3** y **Supabase** como backend.

## 📁 Estructura del proyecto

```
ecommerce-vanilla/
├── index.html               # Home
├── nosotros.html            # Nosotros
├── catalogo.html            # Tienda con filtros
├── producto.html            # Detalle de producto
├── contacto.html            # Contacto
├── ubicacion.html           # Ubicación con mapa
├── carrito.html             # Carrito de compras
├── login.html               # Inicio de sesión
├── registro.html            # Registro
├── checkout.html            # Checkout
├── admin/
│   ├── dashboard.html       # Dashboard admin
│   ├── productos.html       # CRUD productos
│   └── pedidos.html         # Gestión pedidos
├── css/
│   └── style.css            # Estilos globales
├── js/
│   ├── supabase-client.js   # Config Supabase
│   ├── auth.js              # Autenticación
│   ├── cart.js              # Carrito (localStorage)
│   ├── products.js          # Catálogo y productos
│   └── admin.js             # CRUD admin
├── vercel.json              # Config Vercel
├── setup.sql                # Script SQL para Supabase
└── README.md                # Este archivo
```

---

## 🚀 Guía de configuración

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta o inicia sesión.
2. Crea un nuevo proyecto. Toma nota de la **URL** y la **anon key** (Project Settings > API).
3. En el SQL Editor, pega y ejecuta el contenido completo de `setup.sql`.

### 2. Configurar Supabase Client

Abre `js/supabase-client.js` y reemplaza las variables:

```js
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key';
```

### 3. Crear usuarios de prueba

#### Opción A: Desde Supabase Dashboard (recomendado)

1. En Supabase, ve a **Authentication > Users**.
2. Haz clic en **"Invite user"** o **"Add user"** y crea los dos usuarios manualmente:

**Cliente:**
- Email: `cliente@prueba.com`
- Password: `123456`

**Admin:**
- Email: `admin@prueba.com`
- Password: `admin123`

3. Luego ve al **SQL Editor** y ejecuta:

```sql
-- Asignar rol admin al usuario admin
UPDATE perfiles 
SET rol = 'admin', nombre = 'Admin Prueba' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@prueba.com');

-- Asignar nombre al cliente
UPDATE perfiles 
SET nombre = 'Cliente Prueba' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'cliente@prueba.com');
```

#### Opción B: Usar la API de administración (avanzado)

Ejecuta en el SQL Editor:

```sql
-- Crear usuario cliente (el trigger creará el perfil automáticamente)
SELECT supabase_auth.sign_up('cliente@prueba.com', '123456', '{"nombre":"Cliente Prueba"}');

-- Crear usuario admin
SELECT supabase_auth.sign_up('admin@prueba.com', 'admin123', '{"nombre":"Admin Prueba"}');

-- Asignar admin manualmente
UPDATE perfiles SET rol = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@prueba.com');
```

> **Nota:** Si usas `sign_up`, es posible que necesites deshabilitar la confirmación de email en Authentication > Settings > "Confirm email" = OFF.

### 4. Verificar productos de ejemplo

El script `setup.sql` ya inserta 8 productos de ejemplo. Verifica en Supabase **Table Editor > productos** que los datos estén cargados.

### 5. Probar localmente

Abre `index.html` directamente en tu navegador o usa un servidor local:

**Con VS Code:** Instala "Live Server", haz clic derecho en `index.html` > "Open with Live Server"

**Con Python:**
```bash
python -m http.server 8000
```

**Con Node:**
```bash
npx serve .
```

---

## 🌍 Desplegar en Vercel

### Paso 1: Subir el proyecto a GitHub

```bash
git init
git add .
git commit -m "Initial commit: ShopExpress e-commerce"
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

### Paso 2: Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta.
2. Haz clic en **"Add New > Project"**.
3. Importa el repositorio de GitHub.
4. **No cambies nada en la configuración** (el `vercel.json` ya está configurado).
5. Haz clic en **"Deploy"**.

✅ **Tu tienda estará online en minutos.**

---

## 🧪 Usuarios de prueba

| Rol    | Email                | Contraseña |
|--------|---------------------|------------|
| Admin  | admin@prueba.com    | admin123   |
| Cliente| cliente@prueba.com  | 123456     |

---

## 📧 Configurar envío real del formulario de contacto

Por defecto, el formulario de contacto funciona en **modo demostración** (simula el envío). Para que los mensajes lleguen a un correo real:

1. Ve a [formspree.io](https://formspree.io) y crea una cuenta gratis
2. Crea un nuevo formulario y copia el **Form ID** (ej: `xyzabc123`)
3. Abre `contacto.html` y en la línea `const FORMSPREE_ID = '';` reemplaza con tu ID:
   ```js
   const FORMSPREE_ID = 'xyzabc123';
   ```
4. ¡Listo! Los mensajes del formulario llegarán al correo que registraste en Formspree

> Formspree gratis permite hasta **50 envíos/mes**. No requiere ninguna librería JS externa.

---

## 🛠️ Funcionalidades

### Clientes
- Registro e inicio de sesión
- Catálogo con filtros por categoría, búsqueda y ordenamiento
- Carrito de compras persistente (localStorage)
- Checkout con registro de pedidos en Supabase
- Detalle de producto con selector de cantidad

### Administradores
- Dashboard con estadísticas
- CRUD completo de productos (crear, editar, eliminar)
- Gestión de pedidos (cambiar estado: pendiente → pagado → enviado → entregado)

---

## 📦 API de Supabase (tablas)

| Tabla          | Descripción                     |
|---------------|---------------------------------|
| `perfiles`    | Datos del usuario (nombre, rol) |
| `productos`   | Catálogo de productos           |
| `pedidos`     | Órdenes de compra               |
| `pedido_items`| Productos dentro de cada pedido |

### RLS (Row Level Security)
- `productos`: Lectura para autenticados, escritura solo admin
- `pedidos`: Lectura propia, escritura propia, admin todo
- `pedido_items`: Mismo que pedidos
- `perfiles`: Lectura/actualización propia
- Trigger: Al registrarse un usuario se crea automáticamente su perfil

---

## 🎨 Diseño y UX

- Diseño moderno con paleta de colores profesional
- 100% responsive (mobile, tablet, desktop)
- Navbar sticky con menú desplegable en móvil
- Toast notifications para feedback visual
- Formularios con validación
- Footer completo con información de contacto

---

## 📄 Licencia

MIT
