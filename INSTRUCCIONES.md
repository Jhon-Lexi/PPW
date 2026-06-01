# 🛍️ MiTiendaOnline - Documentación Completa

## 📋 Estructura del Proyecto

```
proyect/
├── index.html              # Página de inicio
├── nosotros.html           # Página "Sobre Nosotros"
├── catalogo.html           # Catálogo de productos con búsqueda y filtros
├── contacto.html           # Formulario de contacto + Google Maps
├── login.html              # Inicio de sesión (email + Google)
├── registro.html           # Registro de nuevos usuarios
├── carrito.html            # Carrito de compras
├── vercel.json             # Configuración para deploy en Vercel
│
├── css/
│   └── style.css           # Estilos globales (responsive, dark mode, accesibilidad)
│
├── js/
│   ├── supabase-config.js  # Configuración del cliente de Supabase
│   ├── auth.js             # Autenticación (registro, login, Google, logout)
│   ├── cart.js             # Carrito de compras (localStorage)
│   ├── chatbot.js          # Chatbot con respuestas predefinidas
│   ├── productos.js        # Carga de productos y filtros
│   ├── eventos.js          # Carga de eventos
│   └── admin.js            # CRUD de productos, eventos, usuarios
│
├── admin/
│   ├── index.html          # Dashboard del panel admin
│   ├── productos.html      # CRUD de productos
│   ├── eventos.html        # CRUD de eventos
│   └── usuarios.html       # Gestión de usuarios (solo superadmin)
│
├── img/                    # Carpeta para imágenes locales
│
└── supabase/
    └── schema.sql          # Esquema completo de la base de datos
```

---

## ⚙️ Configuración de Supabase

### 1. Crear proyecto en Supabase
1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Copia la URL del proyecto y la Anon Key

### 2. Configurar las credenciales
Abre `js/supabase-config.js` y reemplaza:
```js
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key';
```

### 3. Ejecutar el schema SQL
1. En Supabase, ve a **SQL Editor**
2. Abre `supabase/schema.sql`
3. Copia todo el contenido y pégalo en el editor
4. Haz clic en **Run** para crear todas las tablas y políticas RLS

### 4. Habilitar Autenticación
- **Email/Password**: Ve a Authentication > Providers > Email y habilítalo
- **Google**: 
  - Ve a Authentication > Providers > Google
  - Sigue las instrucciones para configurar OAuth (necesitas credenciales de Google Cloud Console)
  - En la URL de redirección de Google Cloud, usa: `https://tu-proyecto.supabase.co/auth/v1/callback`

### 5. Crear usuarios de prueba
En Authentication > Users, crea estos usuarios:

| Email | Password | Rol en tabla perfiles |
|-------|----------|----------------------|
| admin@tienda.com | Admin123! | superadmin |
| cliente@test.com | Cliente123! | cliente |

> **Importante**: Después de crear los usuarios en Auth, ve a la tabla `perfiles` en Table Editor y cambia el rol de `admin@tienda.com` a `superadmin`.

---

## 🚀 Subir a Vercel

### Opción 1: Deploy automático (recomendado)
1. Sube el proyecto a un repositorio de GitHub
2. Ve a [https://vercel.com](https://vercel.com)
3. Haz clic en **Add New > Project**
4. Conecta tu repositorio de GitHub
5. Vercel detectará automáticamente que es un sitio estático
6. Haz clic en **Deploy**

### Opción 2: Deploy con Vercel CLI
```bash
# Instalar Vercel CLI
npm install -g vercel

# Ir a la carpeta del proyecto
cd proyect

# Deploy
vercel

# Para producción
vercel --prod
```

### Notas para Vercel:
- No necesita configuración adicional (el archivo `vercel.json` ya está listo)
- Las rutas de las páginas se resuelven automáticamente
- El sitio es 100% estático; toda la lógica dinámica va contra Supabase

---

## 🔑 Funcionalidades

### Usuarios
- **Registro**: Crea tu cuenta con nombre, email y contraseña
- **Login**: Inicia sesión con email o con Google
- **Protección de rutas**: Solo usuarios logueados pueden agregar al carrito

### Carrito
- Usa **localStorage** para persistencia
- Agregar, eliminar y cambiar cantidad de productos
- Total dinámico actualizado automáticamente
- Checkout simulado (solo para usuarios logueados)

### Panel Admin
Accesible desde el enlace "Admin" en el header (solo para admins)
- **Dashboard**: Estadísticas generales y mensajes recientes
- **Productos**: CRUD completo (crear, leer, actualizar, eliminar)
- **Eventos**: CRUD completo de eventos
- **Usuarios**: Gestión de roles (solo superadmin)

### Chatbot
- Botón flotante en la esquina inferior derecha
- Responde preguntas sobre horarios, envíos, pagos, devoluciones, etc.
- Respuestas predefinidas en JavaScript

### Accesibilidad
- Modo oscuro/claro con persistencia en localStorage
- Navegación completa por teclado (Tab, Enter, Escape)
- Botón "Saltar al contenido principal"
- Atributos ARIA en todos los componentes
- Texto alternativo en todas las imágenes
- Alto contraste de colores en ambos modos
- Compatible con lectores de pantalla
- Soporte para `prefers-reduced-motion`
- Tamaños mínimos táctiles de 44px

---

## 📦 Tablas de Supabase

| Tabla | Descripción |
|-------|-------------|
| `productos` | Catálogo de productos (nombre, precio, stock, categoría, imagen) |
| `perfiles` | Perfiles de usuario (nombre, rol: cliente/admin/superadmin) |
| `eventos` | Eventos destacados (título, fecha, lugar) |
| `pedidos` | Órdenes de compra |
| `detalle_pedidos` | Detalle de cada pedido |
| `contactos` | Mensajes del formulario de contacto |
| `categorias` | Categorías de productos |

---

## 💡 Notas adicionales

- El proyecto es **100% responsive** con enfoque mobile-first
- Usa **CSS Grid y Flexbox** para el layout
- Las imágenes de ejemplo usan Unsplash (placeholder funcional)
- El mapa de Google Maps tiene coordenadas de ejemplo (Lima, Perú) - cámbialas por las reales
- Para imágenes propias, usa la URL de Supabase Storage o un servicio como Cloudinary
