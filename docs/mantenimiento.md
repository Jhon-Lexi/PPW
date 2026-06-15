# Guía de Mantenimiento - PremiumStore

## Índice

1. [Estructura del Proyecto](#1-estructura-del-proyecto)
2. [Convenciones de Código](#2-convenciones-de-código)
3. [Cómo Añadir una Nueva Página](#3-cómo-añadir-una-nueva-página)
4. [Cómo Añadir una Nueva Funcionalidad](#4-cómo-añadir-una-nueva-funcionalidad)
5. [Cómo Modificar el Esquema de Base de Datos](#5-cómo-modificar-el-esquema-de-base-de-datos)
6. [Cómo Actualizar Dependencias](#6-cómo-actualizar-dependencias)
7. [Depuración y Logs](#7-depuración-y-logs)
8. [Pruebas](#8-pruebas)
9. [Checklist de Despliegue](#9-checklist-de-despliegue)
10. [Mantenimiento de Seguridad](#10-mantenimiento-de-seguridad)

---

## 1. Estructura del Proyecto

### Reglas generales

- **No modifiques archivos existentes si puedes evitarlo.** El principio es aditivo: añade código nuevo sin romper el existente.
- **JavaScript vanilla** sin framework. No se debe añadir React, Vue, etc. sin reescribir todo el frontend.
- **Tailwind CSS** se carga desde CDN. No hay build step.
- **Las API routes** son funciones serverless de Vercel en la carpeta `/api`.
- **Los módulos JS** se cargan con etiquetas `<script>` en orden específico (ver `manual-tecnico.md` sección 4).

### Jerarquía de scripts

El orden de carga es crítico. Cada script depende del anterior:

```
1. Supabase CDN (librería)
2. config.js (variables de configuración)
3. supabase.js (cliente Supabase)
4. auth.js (autenticación)
5. cart.js (carrito)
6. main.js (componentes compartidos)
7. accessibility.js (accesibilidad)
8. tts.js (lectura por voz)
9. security.js (CAPTCHA + 2FA) - solo en login.html y contact.html
10. admin.js (panel admin) - solo en admin/
11. chatbot.js (chatbot) - todas las páginas, al final del body
```

---

## 2. Convenciones de Código

### JavaScript

- Usar `const` para módulos y constantes, `let` para variables mutables.
- Nombres en inglés para funciones y variables, comentarios en español.
- Cada módulo es un objeto con métodos, expuesto en `window`.
- Preferir `async/await` sobre promesas encadenadas.
- Usar `try/catch` para operaciones con Supabase.

```js
// Ejemplo de convención
const MiModulo = {
    async hacerAlgo(param) {
        try {
            const { data, error } = await supabaseClient...
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[MiModulo] Error:', err);
            throw err;
        }
    }
};
window.MiModulo = MiModulo;
```

### CSS

- Las variables CSS se definen en `:root` y `[data-theme="light"]`.
- Las clases de utilidad siguen la convención de Tailwind.
- Los estilos de accesibilidad usan prefijo `a11y-`.
- Los estilos de TTS usan prefijo `tts-`.
- Los breakpoints responsive siguen: 320, 375, 481, 768, 1024, 1366, 1920.

### HTML

- Cada página debe tener `<a href="#main-content" class="skip-link">`.
- Cada página debe tener `role="banner"` en el header y `role="main"` en el contenido.
- Los botones de accesibilidad deben tener `aria-label`.

---

## 3. Cómo Añadir una Nueva Página

Sigue estos pasos:

### Paso 1: Crear el archivo HTML

Copia la estructura de `about.html` o `catalog.html`. Debe incluir:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <!-- Meta tags -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="css/styles.css">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/config.js"></script>
    <script src="js/supabase.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/cart.js"></script>
    <script src="js/main.js"></script>
    <script src="js/accessibility.js"></script>
    <script src="js/tts.js"></script>
</head>
<body>
    <a href="#main-content" class="skip-link">Saltar al contenido principal</a>
    <header id="main-header" role="banner"></header>
    <section id="main-content" role="main">
        <!-- Contenido de la página -->
    </section>
    <script src="js/chatbot.js"></script>
</body>
</html>
```

### Paso 2: Añadir al menú de navegación

Edita `js/main.js`, función `renderNavbar()`, y añade un nuevo `<a>` en `nav-links`.

### Paso 3: Registrar la ruta (si aplica)

Si es página de admin, añade el case en `js/admin.js` (línea 297-319).

---

## 4. Cómo Añadir una Nueva Funcionalidad

### Funcionalidad de Frontend (solo JS)

1. Identifica qué módulo existente debe contenerla, o crea un nuevo archivo JS en `js/`.
2. Si creas un nuevo archivo, añádelo en `index.html` y todas las páginas donde se necesite.
3. Sigue la convención de módulo: objeto con métodos, expuesto en `window`.
4. Si la funcionalidad afecta a todas las páginas, intégrala en `main.js` o crea un script global.

### Nueva API Route

1. Crea el archivo en `api/<nombre>.js`.
2. Debe exportar un `default async function handler(req, res)`.
3. Para desarrollo local, usa `vercel dev`.
4. Añade la ruta a las variables de entorno en Vercel si es necesario.
5. Documenta los endpoints en el manual técnico.

### Nueva Tabla en Supabase

1. Añade el `CREATE TABLE` en `sql/schema.sql`.
2. Habilita RLS: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
3. Crea las políticas de seguridad necesarias.
4. Ejecuta el script actualizado en Supabase SQL Editor.

---

## 5. Cómo Modificar el Esquema de Base de Datos

### Agregar una columna

```sql
ALTER TABLE products ADD COLUMN discount DECIMAL(5,2) DEFAULT 0;
```

### Agregar un nuevo rol

```sql
-- Modificar el CHECK constraint
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('user', 'admin', 'moderator'));
```

### Agregar una política RLS

```sql
CREATE POLICY "Moderators can update products"
    ON products FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );
```

**⚠️ Warning**: Siempre prueba las políticas RLS en el SQL Editor de Supabase antes de aplicarlas a producción.

---

## 6. Cómo Actualizar Dependencias

### Tailwind CSS

```html
<!-- En todas las páginas, actualiza la versión -->
<script src="https://cdn.tailwindcss.com"></script>
<!-- → No tiene versionado, siempre es la última -->
```

### Font Awesome

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<!-- Cambia 6.5.1 por la nueva versión -->
```

### Supabase JS

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<!-- Cambia @2 por @3 cuando esté disponible -->
```

---

## 7. Depuración y Logs

### Consola del navegador

Las siguientes operaciones registran información en la consola:

| Evento | Mensaje en consola |
|---|---|
| Inicio 2FA | `[2FA Dev] OTP enviado a: ...` |
| Init admin | `[Admin] Administrador creado exitosamente` |
| Error Supabase | Errores de queries y auth |

Para ver estos logs: F12 → Console.

### Logs de Supabase

1. Ir a Supabase Dashboard.
2. **Authentication > Logs**: ver intentos de login, OTP enviados.
3. **Database > Logs**: ver queries y errores de RLS.
4. **Table Editor > otp_logs**: ver auditoría de intentos 2FA.

### Logs de Vercel

1. Ir a Vercel Dashboard.
2. Seleccionar el proyecto.
3. **Functions > Logs**: ver ejecuciones de API routes.
4. Para debugging avanzado, añadir `console.log()` en `api/*.js`.

---

## 8. Pruebas

### Pruebas manuales recomendadas

Antes de cada despliegue:

```
□ Página principal carga sin errores en consola
□ Catálogo muestra productos desde Supabase
□ Registro de usuario funciona
□ Login con 2FA funciona (email + OTP)
□ Bypass 2FA con ?direct=1 funciona
□ Admin panel carga y muestra datos
□ CRUD de productos funciona
□ CRUD de usuarios funciona
□ Tema oscuro/claro funciona y persiste
□ Alto contraste funciona
□ Escalado de texto funciona (100-200%)
□ Lectura guiada funciona
□ TTS reproduce contenido
□ CAPTCHA en login y contacto funciona
□ Video YouTube con subtítulos funciona
□ Skip link funciona
□ Botón volver arriba funciona
□ Responsive: 320px, 768px, 1024px, 1920px
□ Touch targets ≥44px en móvil
□ Teclado: navegación con Tab funciona
```

### Prueba de regresión

1. Abre todas las páginas (index, catalog, cart, login, register, about, contact, orders, admin/*).
2. Verifica que no haya errores en consola.
3. Prueba cada funcionalidad crítica.
4. Verifica responsive en al menos 3 tamaños de pantalla.

---

## 9. Checklist de Despliegue

### Antes de desplegar a producción

```
□ Variables de entorno configuradas en Vercel
   □ SUPABASE_URL
   □ SUPABASE_ANON_KEY
   □ SUPABASE_SERVICE_ROLE_KEY
   □ RECAPTCHA_SECRET_KEY
   □ ADMIN_EMAIL
   □ ADMIN_PASSWORD
□ js/config.js tiene RECAPTCHA_SITE_KEY real (no la de prueba)
□ Confirmación de email deshabilitada en Supabase
□ SQL schema ejecutado en producción
□ RLS habilitado en todas las tablas
□ CSP en vercel.json es correcto para producción
□ vercel.json cachea assets estáticos
□ Google reCAPTCHA admin registra el dominio de producción
```

### Después del despliegue

```
□ Visitar /admin/dashboard.html → admin se crea automáticamente
□ Probar login admin
□ Probar login usuario normal
□ Probar registro
□ Verificar que APIs responden (200 OK)
□ Verificar que no hay errores 404
□ Probar CAPTCHA
□ Verificar TTS en Chrome
□ Probar responsive
```

---

## 10. Mantenimiento de Seguridad

### Revisiones periódicas

- **Mensual**: Revisar logs de Supabase (intentos fallidos, actividad sospechosa).
- **Mensual**: Revisar logs de Vercel Functions.
- **Trimestral**: Rotar Service Role Key de Supabase.
- **Trimestral**: Revisar políticas RLS.
- **Anual**: Actualizar dependencias (Supabase JS, Font Awesome).
- **Anual**: Revisar CSP en `vercel.json`.

### Mejores prácticas

1. **Nunca expongas la Service Role Key** en el frontend (solo en serverless functions).
2. **Nunca subas `.env`** al repositorio.
3. **Usa keys de prueba de Google** solo en desarrollo.
4. **Mantén la confirmación de email deshabilitada** solo en desarrollo.
5. **Audita regularmente** la tabla `otp_logs` para detectar abusos.
6. **Cambia la contraseña del admin** después del despliegue inicial.

### Vulnerabilidades conocidas

| Riesgo | Mitigación |
|---|---|
| XSS (Cross-Site Scripting) | CSP en vercel.json bloquea scripts inline no autorizados |
| CSRF (Cross-Site Request Forgery) | SameSite cookies por defecto en Supabase |
| Inyección SQL | Supabase usa queries parametrizadas por defecto |
| Fuerza bruta OTP | Rate limiting local (5 intentos) + servidor (5 en 15 min) |
| Acceso no autorizado a admin | RLS + pre-render guard + verificación frontend |
