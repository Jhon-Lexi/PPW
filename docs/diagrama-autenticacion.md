# Diagrama de Flujo de Autenticación

## 1. Flujo Completo: Login con 2FA

```
┌─────────────────────────────────────────────────────────────────┐
│                    INICIO DE SESIÓN                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Usuario ingresa email + contraseña                          │
│     Evento: submit en #login-form                                │
│     Archivo: login.html (línea 144)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Auth.signInWith2FA(email, password)                         │
│     Llama a supabaseClient.auth.signInWithPassword()             │
│     Archivo: js/auth.js (línea 77)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
              ┌────────────┐   ┌──────────────┐
              │  Éxito     │   │  Error        │
              │            │   │               │
              │ Credencial │   │ "Credenciales │
              │ válidas    │   │ inválidas"    │
              └─────┬──────┘   └───────┬───────┘
                    │                  │
                    ▼                  ▼
              ┌────────────┐   ┌──────────────┐
              │ signOut()  │   │ Toast.error() │
              │ (forzar    │   │ Volver al     │
              │  2FA)      │   │ formulario    │
              └─────┬──────┘   └───────┬───────┘
                    │                  │
                    ▼                  ▼
              ┌────────────────────────────────────────────────────┐
              │  3. Mostrar paso OTP (otp-step)                   │
              │     Email mostrado al usuario                      │
              │     Se carga reCAPTCHA v2                          │
              │     Archivo: login.html (líneas 62-108)            │
              └────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Usuario completa CAPTCHA                                    │
│     Security.getCaptchaToken(captchaWidgetId)                    │
│     Security.verifyCaptcha(token) → /api/verify-captcha         │
│     Archivos: js/security.js, api/verify-captcha.js             │
└─────────────────────────────────────────────────────────────────┘
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
              ┌────────────┐   ┌──────────────┐
              │  CAPTCHA   │   │  CAPTCHA      │
              │  válido    │   │  inválido     │
              └─────┬──────┘   └───────┬───────┘
                    │                  │
                    ▼                  ▼
┌──────────────────────────┐   ┌──────────────┐
│  5. Security.start2FA()  │   │ Reset captcha│
│     Llama a:             │   │ Toast.error() │
│     signInWithOtp(email) │   └───────┬───────┘
│     Archivo: security.js │           │
│     (línea 150)          │           │ (vuelve al paso 4)
└─────────────┬────────────┘           │
              │                        │
              ▼                        │
┌──────────────────────────┐           │
│  Supabase envía email    │           │
│  con código OTP de 6     │           │
│  dígitos                 │           │
└─────────────┬────────────┘           │
              │                        │
              ▼                        │
┌──────────────────────────────────────┘
│
│  6. Usuario ingresa código OTP
│     OTP inputs (6 dígitos)
│     Auto-advance entre campos
│     Soporte para pegar (paste)
│     Archivo: login.html (líneas 226-263)
│
│  7. Security.verifyOTP(email, token)
│     Llama a verifyOtp(email, token, 'email')
│     Archivo: security.js (línea 202)
│
├── Verificación local (rate limiting)
│   └── ¿Más de 5 intentos?
│       ├── Sí → Bloqueo 5 min
│       └── No → Continuar
│
├── Verificación servidor (Supabase)
│   └── ¿OTP válido?
│       ├── Sí → Sesión establecida
│       │   └── Redirigir a index.html
│       └── No →
│           ├── ¿Expirado? → "Solicita uno nuevo"
│           └── ¿Inválido? → "Código incorrecto"
│
└─────────────────────────────────────────────────────────────────┘


## 2. Flujo Alternativo: Bypass 2FA (?direct=1)

```
URL: login.html?direct=1

┌─────────────────────────────────────────────────────────────────┐
│  1. Usuario ingresa email + contraseña                          │
│  2. Auth.signInDirect(email, password)                          │
│     signInWithPassword() directo (sin 2FA)                      │
│     Archivo: js/auth.js (línea 19)                               │
│  3. Sesión establecida directamente                             │
│  4. Redirigir a index.html                                      │
└─────────────────────────────────────────────────────────────────┘

⚠️ Solo para desarrollo/pruebas. No documentado para usuarios finales.
```


## 3. Flujo de Registro

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGISTRO DE USUARIO                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Usuario completa formulario                                 │
│     Evento: submit en #register-form                             │
│     Archivo: register.html (línea 69)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Auth.signUp(email, password)                                │
│     Llama a supabaseClient.auth.signUp()                        │
│     Espera 2s para trigger de base de datos                     │
│     Intenta crear perfil manualmente si trigger falló           │
│     Archivo: js/auth.js (línea 7)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Evaluar resultado                                           │
│     ¿data.session existe? (confirmación deshabilitada)          │
│     ├── Sí → "Cuenta creada con éxito" → login.html            │
│     └── No  → "Revisa tu correo para confirmar" → login.html   │
│     Archivo: register.html (líneas 89-113)                      │
└─────────────────────────────────────────────────────────────────┘


## 4. Flujo de Verificación de Admin

```
┌─────────────────────────────────────────────────────────────────┐
│               ACCESO A PÁGINA DE ADMIN                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Estado inicial: body class="admin-checking"                    │
│  CSS: .admin-checking .admin-content { display: none }          │
│  Contenido oculto hasta verificación                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Admin.checkAccess()                                         │
│     Auth.isAdmin() → ¿Usuario autenticado con rol admin?        │
│     Archivo: js/admin.js (línea 7)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
              ┌────────────┐   ┌──────────────────┐
              │  Es admin   │   │  No es admin      │
              │             │   │                   │
              │ body class  │   │ Toast "Acceso     │
              │ cambia a    │   │ denegado"         │
              │ admin-      │   │ Redirigir a       │
              │ authorized  │   │ index.html        │
              │ Contenido   │   │ (tras 1.5s)       │
              │ visible     │   │                   │
              └─────┬───────┘   └───────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Cargar datos según la página                                │
│     /admin/dashboard → Admin.loadDashboard()                    │
│     /admin/products  → Admin.loadProducts()                     │
│     /admin/users     → Admin.loadUsers()                        │
└─────────────────────────────────────────────────────────────────┘


## 5. Flujo de Inicialización de Usuarios (Seed)

```
┌─────────────────────────────────────────────────────────────────┐
│         INICIALIZACIÓN AUTOMÁTICA DE USUARIOS (SEED)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Evento: DOMContentLoaded (todas las páginas)                   │
│  initSeedUsers() llamado desde main.js (línea 277)              │
│  Solo una vez por sesión (sessionStorage flag ps_seed_done)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Auth.seedUsers(force=false)                                    │
│  POST /api/seed-users                                           │
│  Archivo: js/auth.js (línea 78)                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  API /api/seed-users                                             │
│  1. Leer env vars con fallback a CONFIG:                        │
│     ADMIN_EMAIL / ADMIN_PASSWORD                                │
│     TEST_USER_EMAIL / TEST_USER_PASSWORD                        │
│  2. Para cada usuario:                                          │
│     a. Buscar en profiles                                       │
│     b. Si existe y tiene rol correcto → OK                      │
│     c. Si existe pero rol incorrecto → actualizar rol           │
│     d. Si no existe → supabase.auth.admin.createUser()          │
│  3. Retornar estado detallado de cada usuario                   │
│  Archivo: api/seed-users.js                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Respuesta: { success, users: { admin, test } }                  │
│  Se muestra en consola del navegador con detalles por usuario   │
└─────────────────────────────────────────────────────────────────┘


## 6. Flujo de Inicialización de Admin (página admin)

```
┌─────────────────────────────────────────────────────────────────┐
│  Evento: DOMContentLoaded + ruta contiene "/admin/"             │
│  initAdminOnLoad() llamado desde main.js (línea 299)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Auth.initAdmin(force=false)                                    │
│  → Delega en Auth.seedUsers() (alias)                           │
│  POST /api/seed-users (misma API)                               │
│  Archivo: js/auth.js (línea 98)                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Misma API /api/seed-users que en el flujo anterior              │
│  Se asegura que el admin existe y tiene rol correcto             │
└─────────────────────────────────────────────────────────────────┘


## 7. Resumen de Archivos por Función

┌─────────────────────────────────────────────────────────────────┐
│  Función                │ Archivo(s)                            │
├─────────────────────────────────────────────────────────────────┤
│  Login form             │ login.html                            │
│  Login con 2FA          │ js/auth.js, js/security.js            │
│  Login directo (test)   │ js/auth.js                            │
│  Registro               │ register.html, js/auth.js             │
│  Cierre de sesión       │ js/auth.js, js/main.js                │
│  CAPTCHA                │ js/security.js, api/verify-captcha.js │
│  Envío OTP              │ js/security.js                        │
│  Verificación OTP       │ js/security.js, api/verify-otp.js     │
│  Rate limiting OTP      │ api/verify-otp.js                     │
│  Auditoría OTP          │ api/verify-otp.js, sql/schema.sql     │
│  Admin check access     │ js/admin.js                           │
│  Seed usuarios          │ js/auth.js, api/seed-users.js         │
│  Admin CRUD             │ js/admin.js                           │
│  Pre-render guard       │ CSS (styles.css), js/admin.js         │
│  RLS (backend)          │ sql/schema.sql                        │
│  Creación SQL usuarios  │ sql/schema.sql (fn_create_user_safe)  │
└─────────────────────────────────────────────────────────────────┘
```
