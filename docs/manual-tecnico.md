# Manual Técnico - PremiumStore

## Índice

1. [Arquitectura del Proyecto](#1-arquitectura-del-proyecto)
2. [Tecnologías Utilizadas](#2-tecnologías-utilizadas)
3. [Estructura de Carpetas](#3-estructura-de-carpetas)
4. [Función de Cada Archivo](#4-función-de-cada-archivo)
5. [Flujo General de la Aplicación](#5-flujo-general-de-la-aplicación)
6. [Funcionalidades Detalladas](#6-funcionalidades-detalladas)
7. [Explicación del Código por Módulo](#7-explicación-del-código-por-módulo)
8. [Seguridad y Control de Acceso](#8-seguridad-y-control-de-acceso)
9. [Despliegue en Vercel](#9-despliegue-en-vercel)

---

## 1. Arquitectura del Proyecto

PremiumStore es una aplicación web **frontend estática** (HTML, CSS, JavaScript vanilla) que se conecta a **Supabase** como backend de base de datos y autenticación. Se despliega en **Vercel** como sitio estático con funciones serverless para operaciones sensibles.

### Principios de diseño

- **Sin framework frontend**: JavaScript vanilla para máxima compatibilidad y facilidad de mantenimiento.
- **Aditivo**: todas las modificaciones se añaden sin romper la funcionalidad existente.
- **Accesibilidad primero**: WCAG 2.1 AA como requisito base.
- **Responsive**: 6 breakpoints desde 320px hasta 1920px.

---

## 2. Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|---|---|---|
| HTML5 | — | Estructura de páginas |
| CSS3 + Tailwind CDN | 3.x | Estilos y diseño responsivo |
| JavaScript (ES6+) | — | Lógica de frontend |
| Supabase | js v2 | Autenticación, base de datos PostgreSQL, RLS |
| Google reCAPTCHA v2 | — | Protección contra bots |
| Web Speech API | Nativo | Lectura por voz (TTS) |
| Vercel Serverless Functions | Node.js 18+ | API para CAPTCHA, OTP, init-admin |
| YouTube IFrame API | — | Video incrustado con capturas |

---

## 3. Estructura de Carpetas

```
ecommerce/
├── about.html              # Página "Nosotros" con video YouTube
├── admin/
│   ├── dashboard.html       # Panel administrativo - inicio
│   ├── products.html        # CRUD de productos
│   └── users.html           # Gestión de usuarios
├── api/
│   ├── init-admin.js        # Creación automática de admin
│   ├── verify-captcha.js    # Verificación server-side de CAPTCHA
│   └── verify-otp.js        # Rate limiting y auditoría de OTP
├── assets/                  # Recursos estáticos
├── cart.html                # Carrito de compras
├── catalog.html             # Catálogo de productos
├── contact.html             # Formulario de contacto con CAPTCHA
├── css/
│   └── styles.css           # Todos los estilos (accesibilidad, TTS, responsive)
├── index.html               # Página principal
├── js/
│   ├── accessibility.js     # Módulo de accesibilidad (tema, contraste, guía, escalado)
│   ├── admin.js             # CRUD de administración y control de acceso
│   ├── auth.js              # Autenticación (login, registro, 2FA, init-admin)
│   ├── cart.js              # Gestión del carrito de compras
│   ├── chatbot.js           # Chatbot de atención al cliente
│   ├── config.js            # Configuración global (Supabase, reCAPTCHA, Admin)
│   ├── contact.js           # Lógica del formulario de contacto
│   ├── main.js              # Funciones compartidas (navbar, toast, mobile menu)
│   ├── security.js          # CAPTCHA + 2FA con OTP
│   ├── supabase.js          # Cliente de Supabase
│   └── tts.js               # Lectura por voz (Text-to-Speech)
├── login.html               # Inicio de sesión con 2FA
├── orders.html              # Historial de pedidos
├── register.html            # Registro de usuarios
├── sql/
│   └── schema.sql           # Esquema completo de base de datos + seed data
└── vercel.json              # Configuración de despliegue en Vercel
```

---

## 4. Función de Cada Archivo

### Páginas HTML

| Archivo | Propósito |
|---|---|
| `index.html` | Landing page con productos destacados |
| `catalog.html` | Catálogo completo con filtros |
| `cart.html` | Carrito de compras |
| `login.html` | Inicio de sesión con 2FA |
| `register.html` | Registro de nuevos usuarios |
| `about.html` | Información de la empresa + video YouTube |
| `contact.html` | Formulario de contacto con CAPTCHA |
| `orders.html` | Historial de pedidos del usuario |
| `admin/dashboard.html` | Dashboard administrativo |
| `admin/products.html` | CRUD de productos |
| `admin/users.html` | Gestión de usuarios y roles |

### JavaScript

| Archivo | Propósito |
|---|---|
| `config.js` | Variables de configuración (URLs, keys) |
| `supabase.js` | Inicializa el cliente de Supabase |
| `auth.js` | Funciones de autenticación (signUp, signIn, signOut, isAdmin, initAdmin) |
| `security.js` | reCAPTCHA v2 + flujo 2FA con OTP |
| `admin.js` | CRUD de administración + control de acceso |
| `main.js` | Componentes compartidos (navbar, toast, menú móvil, initAdmin en carga) |
| `cart.js` | Lógica del carrito de compras |
| `accessibility.js` | Tema oscuro/claro, lectura guiada, escalado texto, alto contraste |
| `tts.js` | Panel de lectura por voz (Web Speech API) |
| `contact.js` | Envío del formulario de contacto |
| `chatbot.js` | Chatbot interactivo |

### API (Vercel Serverless)

| Archivo | Propósito |
|---|---|
| `api/verify-captcha.js` | Proxy de verificación CAPTCHA contra Google |
| `api/verify-otp.js` | Rate limiting + auditoría de intentos OTP |
| `api/seed-users.js` | Creación automática de usuarios iniciales (admin + test) mediante Admin API de Supabase |
| `api/init-admin.js` | Creación automática del administrador inicial (reemplazado por seed-users, mantenido por compatibilidad) |

---

## 5. Flujo General de la Aplicación

```
Usuario → Navegador → HTML/CSS/JS (Frontend estático)
                           ↓
              Conexión a Supabase (Auth + Database)
                           ↓
              Operaciones sensibles → API Vercel → Supabase (Service Role)
```

### Flujo de autenticación completo

```
1. Usuario ingresa email + contraseña
2. auth.js: signInWithPassword() → valida contra Supabase Auth
3. auth.js: signOut() → cierra sesión temporal (fuerza 2FA)
4. security.js: start2FA() → envía OTP por email vía Supabase
5. Usuario ingresa código OTP de 6 dígitos
6. security.js: verifyOTP() → Supabase verifyOtp()
7. Sesión establecida → redirección a index.html
```

### Flujo de administración

```
1. auth.js: isAdmin() → verifica rol en tabla profiles
2. admin.js: checkAccess() → muestra/oculta contenido (pre-render guard)
3. admin.js: loadDashboard/Products/Users → CRUD via Supabase
4. init-admin API → crea admin automáticamente si no existe
```

---

## 6. Funcionalidades Detalladas

### 6.1 Inicio de Sesión (`login.html` + `js/auth.js` + `js/security.js`)

**¿Qué hace?**
Permite al usuario autenticarse con email y contraseña, seguido de verificación en dos pasos (2FA) mediante código OTP enviado por correo.

**¿Cómo funciona internamente?**
1. El formulario captura email y contraseña.
2. `Auth.signInWith2FA()` valida las credenciales con `signInWithPassword()`.
3. Si son válidas, cierra la sesión inmediatamente (forzar 2FA).
4. `Security.start2FA()` envía un OTP mediante `supabase.auth.signInWithOtp()`.
5. El usuario ingresa el código de 6 dígitos.
6. `Security.verifyOTP()` llama a `supabase.auth.verifyOtp()`.
7. Si el OTP es correcto, la sesión se establece y redirige a `index.html`.

**Archivos que intervienen:**
- `login.html` (líneas 114-353): UI del formulario + lógica de la página.
- `js/auth.js` (líneas 77-90): `signInWith2FA()`.
- `js/security.js` (líneas 150-243): `start2FA()`, `verifyOTP()`, `resendOTP()`.

**Dependencias:**
- Supabase Auth (signInWithPassword, signInWithOtp, verifyOtp).
- reCAPTCHA v2 para protección antes de enviar OTP.

**Cómo modificarlo:**
- Para cambiar el tiempo de expiración del OTP, modifica el `startCountdown(5 * 60)` en `login.html` línea 214.
- Para cambiar el lockout por intentos, modifica `_maxOtpAttempts` en `security.js` línea 9.
- Para cambiar de OTP a otro método 2FA (ej. TOTP), reemplaza `start2FA()` y `verifyOTP()`.

### 6.2 Registro de Usuarios (`register.html` + `js/auth.js`)

**¿Qué hace?**
Crea una cuenta nueva en Supabase Auth y automáticamente crea un perfil en la tabla `profiles`.

**¿Cómo funciona internamente?**
1. `Auth.signUp()` llama a `supabaseClient.auth.signUp()`.
2. Espera 2 segundos para que el trigger de base de datos cree el perfil.
3. Si el trigger falló, inserta el perfil manualmente.
4. Detecta si la confirmación de email está habilitada y muestra mensaje adecuado.

**Archivos que intervienen:**
- `register.html` (líneas 68-114): UI y lógica del formulario.
- `js/auth.js` (líneas 7-16): `signUp()`.

### 6.3 CAPTCHA (`js/security.js` + `api/verify-captcha.js`)

**¿Qué hace?**
Protege formularios contra bots usando Google reCAPTCHA v2.

**¿Cómo funciona internamente?**
1. `Security.loadRecaptcha()` carga el script de Google dinámicamente.
2. `Security.renderCaptcha()` renderiza el widget en un contenedor específico.
3. Al enviar, `Security.getCaptchaToken()` obtiene el token.
4. `Security.verifyCaptcha()` envía el token a `/api/verify-captcha`.
5. La API de Vercel reenvía a `https://www.google.com/recaptcha/api/siteverify`.
6. Devuelve `{ success: true/false }`.

**Archivos que intervienen:**
- `js/security.js` (líneas 20-106): funciones CAPTCHA.
- `api/verify-captcha.js`: proxy server-side.

**Dependencias:**
- Google reCAPTCHA v2 (script externo).
- Vercel Serverless Function.

### 6.4 Verificación en Dos Pasos (2FA) (`js/security.js` + `api/verify-otp.js`)

**¿Qué hace?**
Añade una segunda capa de seguridad mediante código OTP enviado por correo electrónico.

**¿Cómo funciona internamente?**
1. `Security.start2FA()` usa Supabase `signInWithOtp()` para enviar el código.
2. Incluye fallback `shouldCreateUser: true/false` para manejar diferentes configuraciones.
3. `Security.verifyOTP()` usa Supabase `verifyOtp()` para validar.
4. Cliente: máximo 5 intentos, luego bloqueo de 5 minutos.
5. Servidor: `/api/verify-otp` registra cada intento en `otp_logs` y verifica tasa máxima.
6. Auditoría: todas las acciones se registran en `otp_logs` para trazabilidad.

**Archivos que intervienen:**
- `js/security.js` (líneas 108-276): lógica 2FA.
- `api/verify-otp.js`: rate limiting server-side.
- `sql/schema.sql` (líneas 54-77): tablas `otp_logs` y `rate_limits`.

### 6.5 Dashboard de Administrador (`admin/dashboard.html` + `js/admin.js`)

**¿Qué hace?**
Panel protegido para administradores con estadísticas, CRUD de productos y gestión de usuarios.

**¿Cómo funciona internamente?**
1. `Admin.checkAccess()` verifica que el usuario tenga rol `admin` en `profiles`.
2. Usa un pre-render guard: el body empieza con `class="admin-checking"` (contenido oculto por CSS).
3. Si el usuario es admin, cambia a `class="admin-authorized"` (contenido visible).
4. Si no es admin, redirige a `index.html`.
5. Sidebar responsivo: en móvil se desliza con overlay.

**Archivos que intervienen:**
- `admin/dashboard.html`, `admin/products.html`, `admin/users.html`: vistas.
- `js/admin.js` (líneas 5-320): lógica CRUD + control de acceso.
- `css/styles.css`: estilos del sidebar y pre-render guard.

**Cómo modificarlo:**
- Para añadir una nueva sección admin, crea una nueva página HTML en `admin/`, añade el menú en la sidebar, y agrega el case en `admin.js` línea 297-319.

### 6.6 Control de Acceso por Roles (`js/auth.js` + `js/admin.js`)

**¿Qué hace?**
Restringe el acceso a funcionalidades según el rol del usuario (`admin` o `user`).

**¿Cómo funciona internamente?**
1. `Auth.isAdmin()` consulta `profiles` y verifica `role === 'admin'`.
2. En frontend: el navbar solo muestra el enlace "Admin Panel" si `isAdmin()` es true.
3. En frontend: las páginas admin ejecutan `Admin.checkAccess()` que oculta contenido si no es admin.
4. En backend: RLS de Supabase impide que usuarios no-admin modifiquen productos.
5. Pre-render guard: sin JavaScript, el contenido admin permanece oculto.

**Cómo modificarlo:**
- Para añadir un nuevo rol (ej. `moderator`), agrega el valor al CHECK en `sql/schema.sql` línea 12, actualiza las políticas RLS, y modifica `isAdmin()` para aceptar múltiples roles.

### 6.7 Modo Oscuro/Claro (`js/accessibility.js`)

**¿Qué hace?**
Permite alternar entre tema oscuro (predeterminado) y claro.

**¿Cómo funciona internamente?**
1. `Accessibility.toggleTheme()` cambia `data-theme` en `<html>` entre `dark` y `light`.
2. Las variables CSS `--bg-primary`, `--text-primary`, etc. se actualizan automáticamente.
3. La preferencia se guarda en `localStorage` (`ps_a11y_prefs`).
4. Actualiza el tema del CAPTCHA si está cargado.

**Archivos que intervienen:**
- `js/accessibility.js` (líneas 47-76): lógica del tema.
- `css/styles.css`: variables CSS para ambos temas.

### 6.8 Alto Contraste (`js/accessibility.js`)

**¿Qué hace?**
Activa un modo de alto contraste que cumple WCAG 2.1 AA (relación de contraste ≥ 4.5:1).

**¿Cómo funciona internamente?**
1. `Accessibility.toggleHighContrast()` añade/remueve la clase `high-contrast` en `<html>`.
2. Las variables CSS se sobrescriben con valores de alto contraste para ambos temas.
3. Se guarda en `localStorage`.

### 6.9 Lectura Guiada (`js/accessibility.js`)

**¿Qué hace?**
Muestra una barra horizontal que sigue el cursor del ratón o el dedo en pantallas táctiles para ayudar a seguir la lectura.

**¿Cómo funciona internamente?**
1. Crea un elemento `#reading-guide` absoluto posicionado.
2. Escucha `mousemove` y `touchmove` con `requestAnimationFrame` para rendimiento.
3. La barra usa `pointer-events: none` para no interferir con clics.

### 6.10 Lectura por Voz / TTS (`js/tts.js`)

**¿Qué hace?**
Lee el contenido de la página en voz alta usando la Web Speech API del navegador, con control de velocidad y selección de voz.

**¿Cómo funciona internamente?**
1. `TTS.init()` construye un panel flotante con controles (play, pause, stop, velocidad, voz).
2. `TTS.getContentElements()` extrae texto de párrafos, títulos, listas, etc.
3. `TTS.start()` inicia la lectura oración por oración.
4. Cada elemento se resalta con clase `tts-highlight` y se hace scroll automático.
5. `TTS.pause()/resume()/stop()` controlan la reproducción.
6. Las preferencias (velocidad, voz) se guardan en `localStorage`.
7. `TTS.reset()` es llamado por `Accessibility.resetAll()`.

**Archivos que intervienen:**
- `js/tts.js` (310 líneas): módulo TTS completo.
- `css/styles.css` (líneas ~170 del TTS panel): estilos del panel y highlights.

**Dependencias:**
- Web Speech API (nativa del navegador, sin dependencias externas).

**Limitaciones conocidas:**
- Safari tiene soporte parcial (puede no reproducir automáticamente sin interacción del usuario).
- Chrome y Edge tienen soporte completo.

**Cómo modificarlo:**
- Para cambiar los selectores de contenido, modifica `selectors` en `getContentElements()` línea 120.
- Para añadir más voces, modifica el filtro en `populateVoiceList()` línea 106.

### 6.11 Escalado de Texto (`js/accessibility.js`)

**¿Qué hace?**
Permite aumentar o disminuir el tamaño del texto desde 100% hasta 200% en incrementos de 25%.

**¿Cómo funciona internamente?**
1. `Accessibility.increaseTextScale()` / `decreaseTextScale()` cambian el valor en el array `_textScaleLevels`.
2. `applyTextScale()` establece `document.documentElement.style.fontSize = "${pct}%"`.
3. Añade clases auxiliares (`text-scaled`, `text-scaled-lg`, `text-scaled-xl`) para ajustes de layout.
4. Botones se deshabilitan en los límites (100% y 200%).

### 6.12 Video de YouTube (`about.html`)

**¿Qué hace?**
Incrusta un video de YouTube con capturas en español y transcripción accesible.

**Características:**
- `cc_load_policy=1`: activa subtítulos por defecto.
- `cc_lang_pref=es`: subtítulos en español.
- `modestbranding=1`: minimiza el branding de YouTube.
- `<details class="transcript-section">`: transcripción completa del video.
- Título descriptivo y atributo `title` en el iframe.

### 6.13 Accesibilidad General

**Características implementadas:**
- **Skip link**: enlace para saltar al contenido principal (`skip-link`).
- **Focus visible**: indicadores de foco solo con teclado (no con mouse).
- **Fallback de imágenes**: cuando una imagen no carga, muestra un placeholder accesible.
- **Botón volver arriba**: aparece al hacer scroll hacia abajo.
- **ARIA labels**: todos los elementos interactivos tienen etiquetas descriptivas.
- **Roles semánticos**: `role="banner"`, `role="main"`, `role="region"`, etc.
- **Touch targets**: mínimo 44×44px en dispositivos móviles (WCAG 2.1).
- **Zoom iOS**: `font-size: 16px` en inputs para prevenir zoom automático.

### 6.14 Integración con Supabase

**¿Qué hace?**
Proporciona backend de base de datos, autenticación, y almacenamiento.

**Tablas:**
| Tabla | Propósito |
|---|---|
| `profiles` | Perfiles de usuario con roles |
| `products` | Catálogo de productos |
| `contacts` | Mensajes de contacto |
| `orders` | Pedidos de clientes |
| `otp_logs` | Auditoría de intentos 2FA |
| `rate_limits` | Control de tasa de intentos |

**Row Level Security (RLS):**
- Usuarios solo ven su propio perfil.
- Admins ven todos los perfiles y pueden modificarlos.
- Productos son visibles para todos; solo admins pueden crear/editar/eliminar.
- Órdenes: usuarios ven las suyas; admins ven todas.

### 6.15 Despliegue en Vercel

**¿Qué hace?**
Despliega la aplicación como sitio estático con funciones serverless.

**Configuración (`vercel.json`):**
- CSP estricto para seguridad.
- Cacheo de assets estáticos (JS, CSS) por 1 año.
- Rewrites para rutas de API.
- Tiempo máximo de ejecución: 10 segundos para serverless functions.

**Variables de entorno requeridas:**
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RECAPTCHA_SECRET_KEY
ADMIN_EMAIL
ADMIN_PASSWORD
```

---

## 7. Explicación del Código por Módulo

### 7.1 `js/config.js`

**Qué hace:** Define todas las variables de configuración global.

**Cómo funciona:**
- Objeto `CONFIG` con propiedades para URLs, keys y credenciales.
- `ADMIN_EMAIL` y `ADMIN_PASSWORD` son valores de respaldo (fallback) para desarrollo local.

**Archivos que lo usan:** Todos los JS mediante la variable global `CONFIG`.

**Cómo modificarlo:**
- Para cambiar de proyecto Supabase: actualiza `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
- Para producción: reemplaza `RECAPTCHA_SITE_KEY` con tu key real de Google.

### 7.2 `js/supabase.js`

**Qué hace:** Crea y exporta el cliente de Supabase.

**Cómo funciona:**
```js
const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
```

### 7.3 `js/auth.js`

**Qué hace:** Módulo de autenticación.

**Funciones principales:**
- `signUp(email, password)`: registra usuario y crea perfil.
- `signIn(email, password)`: login directo (sin 2FA, para testing).
- `signInWith2FA(email, password)`: login con 2FA.
- `signOut()`: cierra sesión y limpia carrito.
- `getCurrentUser()`: obtiene usuario actual.
- `getProfile(userId)`: obtiene perfil desde tabla `profiles`.
- `isAdmin()`: verifica si el usuario es admin.
- `seedUsers(force)`: llama a API `/api/seed-users` para crear el administrador y el usuario de prueba en Supabase Auth.
- `initAdmin(force)`: alias de `seedUsers()`, mantenido para compatibilidad.

### 7.4 `js/security.js`

**Qué hace:** Gestiona CAPTCHA y flujo 2FA.

**Estructura:**
```js
const Security = {
    _pendingEmail,        // Email pendiente de verificación 2FA
    _otpAttempts,         // Contador de intentos fallidos
    _maxOtpAttempts: 5,   // Máximo de intentos
    _otpLockedUntil,      // Timestamp de desbloqueo
    _captchaWidgets: {},  // Widgets de CAPTCHA renderizados

    loadRecaptcha(callback),
    renderCaptcha(containerId),
    refreshCaptchaTheme(),
    getCaptchaToken(widgetId),
    resetCaptcha(widgetId),
    verifyCaptcha(token),
    start2FA(email),
    resendOTP(),
    verifyOTP(email, token),
    verifyMagicLink(accessToken, refreshToken),
    getPendingEmail(),
    clear2FAState()
};
```

### 7.5 `js/admin.js`

**Qué hace:** CRUD de administración con control de acceso.

**Estructura:**
```js
const Admin = {
    checkAccess(),              // Verifica rol admin + pre-render guard
    loadDashboard(),            // Carga estadísticas del dashboard
    loadProducts(),             // CRUD productos
    showProductModal(product),  // Modal crear/editar producto
    saveProduct(form),          // Guardar producto
    editProduct(id),           // Editar producto
    deleteProduct(id),         // Eliminar producto
    loadUsers(),               // Listar usuarios
    changeRole(userId, role)   // Cambiar rol
};
```

### 7.6 `js/accessibility.js`

**Qué hace:** Gestiona todas las funciones de accesibilidad.

**Estructura:**
```js
const Accessibility = {
    STORAGE_KEY: 'ps_a11y_prefs',
    defaults: { theme, readingGuide, textScale, highContrast },
    prefs,                     // Preferencias actuales

    init(),                    // Inicializa todo
    toggleTheme(), applyTheme(), getTheme(), updateThemeButton(),
    setupReadingGuide(), toggleReadingGuide(), updateReadingGuideButton(),
    increaseTextScale(), decreaseTextScale(), resetTextScale(),
    applyTextScale(), updateTextScaleDisplay(),
    toggleHighContrast(), applyHighContrast(), updateHighContrastButton(),
    resetAll(),                // Restaura todo a valores por defecto
    setupSkipLink(),
    setupImageFallback(),
    setupFocusIndicator(),
    setupBackToTop()
};
```

### 7.7 `js/tts.js`

**Qué hace:** Módulo de lectura por voz (Text-to-Speech).

**Estructura:**
```js
const TTS = {
    synth, utterance, elements, currentIndex,
    isPlaying, isPaused, panelVisible,
    prefs: { rate, voiceURI },

    init(), loadPrefs(), savePrefs(),
    buildPanel(), populateVoiceList(),
    getContentElements(),
    start(), readNext(), pause(), resume(), stop(), finish(),
    togglePlay(),
    highlightElement(), clearHighlight(),
    setStatus(), updateButtons(),
    showPanel(), hidePanel(), togglePanel(),
    updateToolbarButton(),
    reset()
};
```

### 7.8 `api/seed-users.js`

**Qué hace:** Crea los usuarios iniciales del sistema (admin y test) usando la API de administración de Supabase.

**Flujo:**
1. Lee las variables de entorno (con fallback a valores por defecto):
   - `ADMIN_EMAIL` (defecto: `admin@ejemplo.com`)
   - `ADMIN_PASSWORD` (defecto: `Admin123*`)
   - `TEST_USER_EMAIL` (defecto: `usuario@ejemplo.com`)
   - `TEST_USER_PASSWORD` (defecto: `Usuario123*`)
2. Para cada usuario:
   a. Busca en `profiles` si ya existe.
   b. Si existe: asegura el rol correcto.
   c. Si no existe: usa `supabase.auth.admin.createUser()` para crearlo.
   d. Si falla porque ya existe en Auth: actualiza contraseña y crea perfil.
3. Retorna estado detallado de cada usuario.

**Seguridad:**
- Requiere `SUPABASE_SERVICE_ROLE_KEY` (solo server-side).
- No expone credenciales al frontend.
- `email_confirm: true` evita necesidad de confirmación.

**Archivos que intervienen:**
- `api/seed-users.js`: endpoint serverless.
- `js/auth.js`: `Auth.seedUsers()` que lo invoca.
- `js/main.js`: `initSeedUsers()` que lo llama al cargar la app.

### 7.9 `api/init-admin.js`

**Qué hace:** Crea el administrador inicial del sistema usando variables de entorno (mantenido por compatibilidad).

**Nota:** Esta API ha sido reemplazada por `api/seed-users.js`. `Auth.initAdmin()` ahora delega en `Auth.seedUsers()`. Se mantiene para no romver dependencias existentes.

---

## 8. Seguridad y Control de Acceso

### Capas de seguridad

1. **Frontend**: pre-render guard (CSS oculta contenido admin hasta verificación JS).
2. **Frontend**: `isAdmin()` verifica rol antes de mostrar enlaces y contenido.
3. **Backend (Supabase RLS)**: políticas de seguridad a nivel de fila impiden acceso no autorizado.
4. **Backend (API)**: las funciones serverless requieren Service Role Key.
5. **CAPTCHA**: protección contra bots en login y formulario de contacto.
6. **2FA**: segundo factor de autenticación OTP.
7. **Rate limiting**: local (5 intentos, 5 min lockout) y servidor (5 intentos, 15 min ventana).
8. **Auditoría**: todos los intentos OTP se registran en `otp_logs`.

### Políticas RLS

| Tabla | Política |
|---|---|
| `profiles` | SELECT: propio o admin. UPDATE: solo admin. |
| `products` | SELECT: todos. INSERT/UPDATE/DELETE: solo admin. |
| `contacts` | INSERT: todos (público). |
| `orders` | SELECT/INSERT: propio. SELECT: admin. |
| `otp_logs` | Solo service role (no accesible desde cliente). |
| `rate_limits` | Solo service role (no accesible desde cliente). |

---

## 9. Despliegue en Vercel

### Requisitos

1. Cuenta en Vercel (vercel.com).
2. Proyecto de Supabase configurado.
3. Google reCAPTCHA v2 keys (opcional para desarrollo).

### Pasos

1. Conectar repositorio a Vercel.
2. Configurar variables de entorno en Vercel Dashboard:
   ```
   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   RECAPTCHA_SECRET_KEY=
   ADMIN_EMAIL=admin@misitio.com
   ADMIN_PASSWORD=CambiarPorUnaContraseñaSegura
   ```
3. Desplegar (Vercel detecta `vercel.json` automáticamente).
4. Visitar `/admin/dashboard.html` → la app crea el admin automáticamente.

### Solución de problemas comunes

| Problema | Causa | Solución |
|---|---|---|
| "Email not confirmed" | Supabase requiere confirmación de email | Deshabilitar en Auth > Settings |
| 2FA no envía OTP | `shouldCreateUser: false` sin usuario confirmado | El código ya tiene fallback automático |
| Admin no se crea | Faltan variables de entorno | Verificar ADMIN_EMAIL, ADMIN_PASSWORD, SUPABASE_SERVICE_ROLE_KEY |
| CAPTCHA no carga | Key de prueba en producción | Reemplazar RECAPTCHA_SITE_KEY |
| TTS no funciona | Safari o navegador no compatible | Usar Chrome o Edge |
| 404 en API routes | Vercel no reconoce API | Verificar `vercel.json` rewrites |
