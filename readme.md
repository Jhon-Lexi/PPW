bttf-ecommerce/
│
├── index.html               # Punto de entrada principal (Single Page Application o Router)
├── style.css                # Estilos globales y variables de diseño (Neon/80s)
│
├── css/
│   ├── components.css       # Estilos de navbar, footer, tarjetas
│   └── pages.css            # Estilos específicos de cada sección
│
└── js/
    ├── main.js              # Inicializa la app y el enrutador
    ├── router.js            # Controla qué página se muestra sin recargar
    ├── supabase-config.js   # Conexión inicial a Supabase
    │
    ├── services/            # Comunicación con el Backend (Supabase)
    │   ├── auth.js          # Registro, Login y Logout
    │   └── products.js      # Obtener productos de la base de datos
    │
    └── pages/               # Vistas del Frontend (Moduladas)
        ├── home.js          # Inicio / Nosotros
        ├── catalog.js       # Catálogo de productos y Carrito
        ├── contact.js       # Contacto y Mapa
        ├── authView.js      # Login y Registro
        └── admin.js         # Dashboard de Administrador