// ============================================================
// CATÁLOGO - FILTROS, BÚSQUEDA Y RENDERIZADO
// ============================================================

const Catalog = {
    products: [],
    filtered: [],
    filters: { categories: [], priceRange: [0, 9999], search: '' },

    // Inicializar
    async init() {
        this.setupEventListeners();
        await this.loadProducts();
    },

    // Cargar productos desde Supabase
    async loadProducts() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        showSpinner(grid);

        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.products = data || [];
            this.filtered = [...this.products];
            this.renderFilters();
            this.render();
        } catch (err) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <i class="fas fa-exclamation-triangle text-4xl text-amber-500 mb-4"></i>
                    <p class="text-gray-400">Error al cargar productos: ${err.message}</p>
                </div>
            `;
        }
    },

    // Configurar event listeners
    setupEventListeners() {
        // Búsqueda
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }

        // Rango de precio
        const priceRange = document.getElementById('price-range');
        const priceLabel = document.getElementById('price-label');
        if (priceRange && priceLabel) {
            priceRange.addEventListener('input', (e) => {
                const val = Number(e.target.value);
                this.filters.priceRange[1] = val;
                priceLabel.textContent = `Hasta $${val}`;
                this.applyFilters();
            });
        }

        // Ordenar
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.applyFilters();
            });
        }
    },

    // Renderizar filtros de categoría
    renderFilters() {
        const container = document.getElementById('category-filters');
        if (!container) return;

        const categories = [...new Set(this.products.map(p => p.category))];

        container.innerHTML = categories.map(cat => `
            <label class="filter-option">
                <input type="checkbox" value="${cat}" onchange="Catalog.toggleCategory('${cat}')">
                <span>${cat}</span>
            </label>
        `).join('');
    },

    // Toggle categoría
    toggleCategory(category) {
        const idx = this.filters.categories.indexOf(category);
        if (idx > -1) {
            this.filters.categories.splice(idx, 1);
        } else {
            this.filters.categories.push(category);
        }
        this.applyFilters();
    },

    // Aplicar filtros
    applyFilters() {
        let result = [...this.products];

        // Filtro de búsqueda
        if (this.filters.search) {
            result = result.filter(p =>
                p.name.toLowerCase().includes(this.filters.search) ||
                p.description?.toLowerCase().includes(this.filters.search)
            );
        }

        // Filtro de categorías
        if (this.filters.categories.length > 0) {
            result = result.filter(p => this.filters.categories.includes(p.category));
        }

        // Filtro de precio
        result = result.filter(p =>
            p.price >= this.filters.priceRange[0] && p.price <= this.filters.priceRange[1]
        );

        this.filtered = result;
        this.render();
    },

    // Renderizar productos
    render() {
        const grid = document.getElementById('product-grid');
        const count = document.getElementById('product-count');
        if (!grid) return;

        if (count) {
            count.textContent = `${this.filtered.length} producto${this.filtered.length !== 1 ? 's' : ''}`;
        }

        if (this.filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <i class="fas fa-search text-4xl text-gray-600 mb-4"></i>
                    <h3 class="text-xl font-semibold mb-2">Sin resultados</h3>
                    <p class="text-gray-400">Intenta con otros filtros</p>
                </div>
            `;
            return;
        }

        // Ordenar
        const sortSelect = document.getElementById('sort-select');
        const sortBy = sortSelect?.value || 'newest';
        switch (sortBy) {
            case 'price-asc': this.filtered.sort((a, b) => a.price - b.price); break;
            case 'price-desc': this.filtered.sort((a, b) => b.price - a.price); break;
            case 'name': this.filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
            default: break;
        }

        grid.innerHTML = this.filtered.map(product => `
            <div class="product-card animate-fade-in" data-id="${product.id}">
                <div class="img-wrap">
                    <img src="${product.image_url || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'}"
                         alt="${product.name}" loading="lazy"
                         onerror="this.src='https://via.placeholder.com/400x300/1a1a1a/666?text=Sin+Imagen'">
                    <span class="card-tag">${product.category || 'General'}</span>
                </div>
                <div class="info">
                    <h3>${product.name}</h3>
                    <p class="desc">${product.description || 'Sin descripción'}</p>
                    <div class="bottom">
                        <span class="price">$${Number(product.price).toFixed(2)}</span>
                        <button onclick="Cart.add({id:'${product.id}', name:'${product.name.replace(/'/g, "\\'")}', price:${product.price}, image_url:'${product.image_url || ''}'})"
                            class="btn btn-primary btn-sm">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="stock mt-2">${product.stock > 0 ? `<span class="text-green-500 text-xs">● ${product.stock} en stock</span>` : '<span class="text-red-500 text-xs">● Agotado</span>'}</div>
                </div>
            </div>
        `).join('');
    }
};

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('product-grid')) {
        Catalog.init();
    }
});
