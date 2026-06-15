# Manual de Usuario - PremiumStore

## Índice

1. [Introducción](#1-introducción)
2. [Instalación y Configuración](#2-instalación-y-configuración)
3. [Guía de Uso: Clientes](#3-guía-de-uso-clientes)
4. [Guía de Uso: Administradores](#4-guía-de-uso-administradores)
5. [Funciones de Accesibilidad](#5-funciones-de-accesibilidad)
6. [Solución de Problemas](#6-solución-de-problemas)
7. [Preguntas Frecuentes](#7-preguntas-frecuentes)

---

## 1. Introducción

PremiumStore es una aplicación web de comercio electrónico con características modernas de seguridad y accesibilidad. Este manual explica cómo instalar, configurar y usar el sistema.

### ¿Qué puedo hacer con PremiumStore?

- Navegar un catálogo de productos.
- Registrarme e iniciar sesión con verificación en dos pasos.
- Comprar productos y ver mi historial de pedidos.
- Contactar al equipo de soporte.
- **Como administrador**: gestionar productos, usuarios y ver estadísticas.

---

## 2. Instalación y Configuración

### 2.1 Requisitos del Sistema

- Node.js 18+ (solo para desarrollo local con Vercel CLI).
- Navegador moderno (Chrome, Edge, Firefox, Safari).
- Cuenta en Supabase (gratuita en supabase.com).
- Cuenta en Vercel (gratuita en vercel.com).
- Git para control de versiones.

### 2.2 Instalación Local

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd ecommerce

# 2. Instalar Vercel CLI (opcional, para APIs locales)
npm install -g vercel

# 3. Configurar variables de entorno
# Crea un archivo .env con:
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
RECAPTCHA_SECRET_KEY=tu-recaptcha-secret
ADMIN_EMAIL=admin@misitio.com
ADMIN_PASSWORD=CambiarPorUnaContraseñaSegura

# 4. Iniciar servidor local con Vercel
vercel dev

# 5. Abrir en el navegador
# http://localhost:3000
```

### 2.3 Configurar Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. Ir a **Settings > API** y copiar:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`
3. Ir a **Authentication > Settings**:
   - Deshabilitar **"Confirm email"** (recomendado para desarrollo).
4. Ir a **SQL Editor** y ejecutar todo el contenido de `sql/schema.sql`.

### 2.4 Configurar reCAPTCHA

1. Ir a [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin).
2. Registrar un nuevo sitio, seleccionar **reCAPTCHA v2**.
3. Copiar la **Site Key** a `js/config.js` → `RECAPTCHA_SITE_KEY`.
4. Copiar la **Secret Key** a las variables de entorno de Vercel → `RECAPTCHA_SECRET_KEY`.

### 2.5 Desplegar en Vercel

```bash
# 1. Subir a GitHub/GitLab
git add .
git commit -m "Initial commit"
git push

# 2. Ir a vercel.com y conectar el repositorio
# 3. En Settings > Environment Variables, agregar:
#    SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#    RECAPTCHA_SECRET_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
# 4. Hacer clic en "Deploy"
```

### 2.6 Inicializar Administrador

El administrador se crea **automáticamente** la primera vez que se visita `/admin/dashboard.html`. Usa las variables de entorno `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

**Credenciales por defecto (desarrollo):**
- **Administrador:** `admin@ejemplo.com` / `Admin123*`
- **Usuario de prueba:** `usuario@ejemplo.com` / `Usuario123*`

Para cambiar las credenciales del administrador después de la creación inicial:
1. Inicia sesión como administrador.
2. Ve a **Admin Panel > Usuarios**.
3. Busca tu usuario y cambia la contraseña desde Supabase Auth (o registra un nuevo admin).

---

## 3. Guía de Uso: Clientes

### 3.1 Navegar el Catálogo

1. Abre la página principal (`index.html`).
2. Haz clic en **Catálogo** en el menú de navegación.
3. Explora los productos disponibles. Puedes filtrar por categoría.
4. Haz clic en un producto para ver más detalles.

### 3.2 Registrarse

1. Haz clic en **Registrarse** en la esquina superior derecha.
2. Completa el formulario: nombre, email, contraseña.
3. Haz clic en **Crear Cuenta**.
4. Si la confirmación de email está deshabilitada, serás redirigido a iniciar sesión automáticamente.
5. Si la confirmación está habilitada, revisa tu correo y haz clic en el enlace de confirmación.

### 3.3 Iniciar Sesión con 2FA

1. Haz clic en **Ingresar**.
2. Ingresa tu email y contraseña.
3. Completa el CAPTCHA de seguridad.
4. Haz clic en **Enviar Código de Verificación**.
5. Revisa tu correo electrónico — recibirás un código de 6 dígitos.
6. Ingresa el código en los campos numerados.
7. Si el código es correcto, serás redirigido a la página principal.

**Nota**: Si no recibes el código en 5 minutos, puedes:
- Hacer clic en **Reenviar código** (después de que expire el temporizador).
- Hacer clic en **Volver al inicio de sesión** para intentar de nuevo.

### 3.4 Comprar Productos

1. Desde el catálogo, haz clic en **Agregar al Carrito** en un producto.
2. Ve al carrito haciendo clic en el ícono de bolsa 🛍️ en el menú.
3. Revisa tu pedido y haz clic en **Proceder al Pago**.
4. Completa la información de envío y selecciona el método de pago.
5. Confirma tu pedido.

### 3.5 Ver Mis Pedidos

1. Inicia sesión.
2. Haz clic en tu nombre de usuario en la esquina superior derecha.
3. Selecciona **Mis Pedidos**.
4. Verás el historial completo de tus compras.

### 3.6 Contactar Soporte

1. Ve a la página **Contacto**.
2. Completa el formulario con tu nombre, email y mensaje.
3. Completa el CAPTCHA.
4. Haz clic en **Enviar Mensaje**.

---

## 4. Guía de Uso: Administradores

### 4.1 Acceder al Panel de Administración

1. Inicia sesión con una cuenta con rol `admin`.
2. Haz clic en tu nombre de usuario en la esquina superior derecha.
3. Selecciona **Admin Panel**.

### 4.2 Dashboard

El dashboard muestra:
- Número total de productos.
- Número total de usuarios y administradores.
- Valor total del inventario.
- Lista de productos recientes.

### 4.3 Gestionar Productos

1. En el panel admin, selecciona **Productos** en el menú lateral.
2. Para **crear**: haz clic en **Nuevo Producto**, completa el formulario y guarda.
3. Para **editar**: haz clic en el ícono ✏️ junto al producto.
4. Para **eliminar**: haz clic en el ícono 🗑️ junto al producto.

### 4.4 Gestionar Usuarios

1. En el panel admin, selecciona **Usuarios** en el menú lateral.
2. Verás la lista completa de usuarios registrados.
3. Para **cambiar el rol** de un usuario:
   - Usa el menú desplegable en la columna **Rol**.
   - Selecciona `admin` o `user`.
   - El cambio se aplica automáticamente.

**⚠️ Importante**: Asignar rol `admin` otorga acceso completo al panel de administración. Solo otórgalo a personal de confianza.

### 4.5 Administrador Inicial

El sistema crea automáticamente un administrador la primera vez que se carga el panel admin. Las credenciales se definen mediante variables de entorno:

```env
ADMIN_EMAIL=admin@misitio.com
ADMIN_PASSWORD=CambiarPorUnaContraseñaSegura
```

**Para cambiar el administrador después de la creación:**
1. Inicia sesión como admin actual.
2. Ve a **Usuarios** en el panel admin.
3. Crea un nuevo usuario con rol admin desde el registro normal y cambia su rol.
4. O usa Supabase Dashboard > Authentication > Users para cambiar la contraseña.

---

## 5. Funciones de Accesibilidad

PremiumStore incluye una barra de herramientas de accesibilidad en la parte superior derecha de todas las páginas. Las funciones se ocultan en pantallas de 900px o menos.

![Barra de accesibilidad](https://via.placeholder.com/400x40/1a1a1a/f59e0b?text=🌙+👁️+-+100%+%2B+◑+🔊+🗑️)

### 5.1 Modo Oscuro / Claro

Haz clic en el ícono 🌙/☀️ para alternar entre tema oscuro y claro. La preferencia se guarda automáticamente.

### 5.2 Lectura Guiada

Haz clic en el ícono 👁️ para activar una barra que sigue el cursor y ayuda a mantener el lugar mientras lees.

### 5.3 Escalado de Texto

Usa los botones **−** y **+** para reducir o aumentar el tamaño del texto (100% a 200%). El botón **↩** restaura al tamaño original.

### 5.4 Alto Contraste

Haz clic en el ícono ◑ para activar el modo de alto contraste. Mejora la legibilidad para personas con baja visión.

### 5.5 Lectura por Voz (TTS)

1. Haz clic en el ícono 🔊 para abrir el panel de lectura por voz.
2. Selecciona una voz y velocidad (0.5x a 2x).
3. Haz clic en **▶️ Iniciar** para que la página se lea en voz alta.
4. Usa **⏸️ Pausa** y **⏹️ Detener** para controlar la lectura.
5. La palabra que se está leyendo se resalta en amarillo.

**Compatibilidad**: Chrome y Edge (completo), Safari (parcial).

### 5.6 Restablecer Accesibilidad

Haz clic en el ícono 🗑️ para restaurar TODAS las configuraciones de accesibilidad a sus valores por defecto.

### 5.7 Atajos de Teclado

| Tecla | Acción |
|---|---|
| `Tab` | Navegar entre elementos interactivos |
| `Enter` | Activar/enviar formulario |
| `Escape` | Cerrar menús, modales, volver atrás en 2FA |
| `Shift + Tab` | Navegar hacia atrás |

---

## 6. Solución de Problemas

### 6.1 No puedo iniciar sesión

**Causas posibles:**
- Contraseña incorrecta → usa "¿Olvidaste tu contraseña?" (no implementado, contacta al admin).
- Email no confirmado → si es un registro reciente, revisa tu bandeja de entrada.
- Cuenta bloqueada por intentos fallidos → espera 5 minutos.

**Solución rápida (desarrollo):**
- Agrega `?direct=1` a la URL de login para omitir 2FA.

### 6.2 No recibo el código 2FA

1. Revisa la carpeta de **spam**.
2. Espera a que expire el temporizador (5 min) y haz clic en **Reenviar código**.
3. Verifica que el email ingresado sea correcto.
4. En desarrollo, revisa la consola del navegador (F12 > Console) — el OTP se muestra ahí.

### 6.3 El CAPTCHA no funciona

1. Verifica que `RECAPTCHA_SITE_KEY` en `js/config.js` sea válida.
2. En desarrollo, las keys de prueba de Google (`6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`) siempre pasan.
3. Asegúrate de que el dominio esté registrado en Google reCAPTCHA admin.

### 6.4 La página de admin está en blanco

1. El pre-render guard oculta el contenido hasta que se verifica el rol.
2. Abre la consola del navegador (F12) para ver errores.
3. Verifica que el usuario tenga rol `admin` en la tabla `profiles`.
4. Ve a Supabase Dashboard > Table Editor > profiles para verificar.

### 6.5 El administrador no se creó automáticamente

1. Verifica que las variables de entorno `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `SUPABASE_SERVICE_ROLE_KEY` estén configuradas en Vercel.
2. Visita `/admin/dashboard.html` — la creación se dispara al cargar la página.
3. Si falla, ejecuta manualmente en Supabase SQL Editor:
   ```sql
   -- Crea el admin manualmente
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES ('admin@misitio.com', crypt('Admin123!', gen_salt('bf')), NOW());
   ```

---

## 7. Preguntas Frecuentes

**¿Puedo usar PremiumStore sin JavaScript?**
No. La aplicación requiere JavaScript para funcionar (autenticación, carrito, accesibilidad). Sin JS, solo verás la estructura HTML básica.

**¿Qué navegadores son compatibles?**
Chrome, Edge, Firefox y Safari en sus versiones más recientes.

**¿Los datos del carrito se guardan?**
Sí, el carrito se guarda en `localStorage` del navegador. Si cambias de dispositivo o limpias los datos del navegador, el carrito se perderá.

**¿Cómo recupero mi contraseña?**
Actualmente no hay recuperación de contraseña implementada. Contacta al administrador del sistema para restablecerla.

**¿Puedo personalizar los colores?**
Sí, usando el modo de alto contraste y el cambio de tema oscuro/claro desde la barra de accesibilidad.

**¿Cómo sé qué versión soy?**
Revisa el archivo `vercel.json` o consulta el historial de commits en Git.
