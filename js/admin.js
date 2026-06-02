// ============================================================
// ADMIN DASHBOARD - CRUD PRODUCTOS Y USUARIOS
// ============================================================

const Admin = {
    // Verificar acceso de administrador
    async checkAccess() {
        const isAdmin = await Auth.isAdmin();
        if (!isAdmin) {
            Toast.show('Acceso denegado. Se requieren permisos de administrador.', 'error');
            setTimeout(() => window.location.href = '../index.html', 1500);
            return false;
        }
        return true;
    },

    // ============================================================
    // DASHBOARD
    // ============================================================
    async loadDashboard() {
        if (!await this.checkAccess()) return;

        try {
            // Stats
            const { data: products } = await supabaseClient.from('products').select('*', { count: 'exact', head: false });
            const { data: profiles } = await supabaseClient.from('profiles').select('*');
            const { count: prodCount } = await supabaseClient.from('products').select('*', { count: 'exact', head: true });
            const { count: userCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true });

            const adminCount = profiles?.filter(p => p.role === 'admin').length || 0;
            const totalStock = products?.reduce((sum, p) => sum + (p.stock || 0), 0) || 0;
            const totalValue = products?.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0) || 0;

            // Stats cards
            document.getElementById('stat-products').textContent = prodCount || 0;
            document.getElementById('stat-users').textContent = userCount || 0;
            document.getElementById('stat-admins').textContent = adminCount;
            document.getElementById('stat-value').textContent = `$${totalValue.toFixed(0)}`;

            // Últimos productos
            const recentProducts = products?.slice(-5).reverse() || [];
            const tbody = document.getElementById('recent-products');
            if (tbody) {
                tbody.innerHTML = recentProducts.map(p => `
                    <tr>
                        <td class="font-medium">${p.name}</td>
                        <td>$${Number(p.price).toFixed(2)}</td>
                        <td>${p.category || '-'}</td>
                        <td><span class="${p.stock > 0 ? 'text-green-500' : 'text-red-500'}">${p.stock || 0}</span></td>
                    </tr>
                `).join('');
            }

        } catch (err) {
            Toast.show('Error al cargar dashboard: ' + err.message, 'error');
        }
    },

    // ============================================================
    // PRODUCTOS CRUD
    // ============================================================
    async loadProducts() {
        if (!await this.checkAccess()) return;

        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;

        showSpinner(tbody);

        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            tbody.innerHTML = (data || []).map(p => `
                <tr class="animate-fade-in">
                    <td>
                        <div class="flex items-center gap-3">
                            <img src="${p.image_url || 'https://via.placeholder.com/40'}"
                                 alt="${p.name}" class="w-10 h-10 rounded-lg object-cover"
                                 onerror="this.src='https://via.placeholder.com/40/1a1a1a/666?text=N/A'">
                            <span class="font-medium">${p.name}</span>
                        </div>
                    </td>
                    <td>$${Number(p.price).toFixed(2)}</td>
                    <td>${p.category || '-'}</td>
                    <td>
                        <span class="${p.stock > 0 ? 'text-green-500' : 'text-red-500'} font-medium">${p.stock || 0}</span>
                    </td>
                    <td>
                        <div class="flex gap-2">
                            <button onclick="Admin.editProduct('${p.id}')" class="btn btn-outline btn-sm">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="Admin.deleteProduct('${p.id}')" class="btn btn-danger btn-sm">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="5" class="text-center py-10 text-gray-400">No hay productos</td></tr>';

        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-400">Error: ${err.message}</td></tr>`;
        }
    },

    // Modal de producto (Crear/Editar)
    showProductModal(product = null) {
        const overlay = document.getElementById('product-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('product-form');

        if (!overlay || !form) return;

        title.textContent = product ? 'Editar Producto' : 'Nuevo Producto';
        form.productId = product?.id || null;

        form.querySelector('#product-name').value = product?.name || '';
        form.querySelector('#product-desc').value = product?.description || '';
        form.querySelector('#product-price').value = product?.price || '';
        form.querySelector('#product-category').value = product?.category || '';
        form.querySelector('#product-stock').value = product?.stock || 0;
        form.querySelector('#product-image').value = product?.image_url || '';

        overlay.classList.add('active');
    },

    // Guardar producto (Crear/Actualizar)
    async saveProduct(form) {
        const id = form.productId;
        const data = {
            name: form.querySelector('#product-name').value.trim(),
            description: form.querySelector('#product-desc').value.trim(),
            price: parseFloat(form.querySelector('#product-price').value),
            category: form.querySelector('#product-category').value.trim(),
            stock: parseInt(form.querySelector('#product-stock').value) || 0,
            image_url: form.querySelector('#product-image').value.trim()
        };

        if (!data.name || !data.price) {
            Toast.show('Nombre y precio son obligatorios', 'error');
            return;
        }

        try {
            if (id) {
                const { error } = await supabaseClient.from('products').update(data).eq('id', id);
                if (error) throw error;
                Toast.show('Producto actualizado', 'success');
            } else {
                const { error } = await supabaseClient.from('products').insert([data]);
                if (error) throw error;
                Toast.show('Producto creado', 'success');
            }

            document.getElementById('product-modal').classList.remove('active');
            await this.loadProducts();
        } catch (err) {
            Toast.show('Error: ' + err.message, 'error');
        }
    },

    // Editar producto
    async editProduct(id) {
        const { data, error } = await supabaseClient.from('products').select('*').eq('id', id).single();
        if (error) {
            Toast.show('Error al cargar producto', 'error');
            return;
        }
        this.showProductModal(data);
    },

    // Eliminar producto
    async deleteProduct(id) {
        if (!confirm('¿Eliminar este producto permanentemente?')) return;

        try {
            const { error } = await supabaseClient.from('products').delete().eq('id', id);
            if (error) throw error;
            Toast.show('Producto eliminado', 'success');
            await this.loadProducts();
        } catch (err) {
            Toast.show('Error: ' + err.message, 'error');
        }
    },

    // ============================================================
    // USUARIOS CRUD
    // ============================================================
    async loadUsers() {
        if (!await this.checkAccess()) return;

        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        showSpinner(tbody);

        try {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            tbody.innerHTML = (data || []).map(u => `
                <tr class="animate-fade-in">
                    <td class="font-mono text-xs">${u.id?.substring(0, 12)}...</td>
                    <td>${u.email || 'Sin email'}</td>
                    <td>
                        <span class="px-3 py-1 rounded-full text-xs font-semibold
                            ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-700/50 text-gray-300'}">
                            ${u.role || 'user'}
                        </span>
                    </td>
                    <td>${new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                        <select onchange="Admin.changeRole('${u.id}', this.value)"
                            class="form-select text-xs py-1 px-2 w-auto inline-block">
                            <option value="user" ${u.role === 'user' ? 'selected' : ''}>Usuario</option>
                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="5" class="text-center py-10 text-gray-400">No hay usuarios</td></tr>';

        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-400">Error: ${err.message}</td></tr>`;
        }
    },

    // Cambiar rol de usuario
    async changeRole(userId, newRole) {
        try {
            const { error } = await supabaseClient
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;
            Toast.show('Rol actualizado', 'success');
        } catch (err) {
            Toast.show('Error: ' + err.message, 'error');
            await this.loadUsers();
        }
    }
};

window.Admin = Admin;

// Inicialización por página
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname;

    if (page.includes('admin/dashboard')) {
        Admin.loadDashboard();
    } else if (page.includes('admin/products')) {
        Admin.loadProducts();
        // Modal handlers
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');

        document.getElementById('new-product-btn')?.addEventListener('click', () => Admin.showProductModal());

        document.getElementById('modal-close')?.addEventListener('click', () => modal?.classList.remove('active'));
        modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            Admin.saveProduct(form);
        });
    } else if (page.includes('admin/users')) {
        Admin.loadUsers();
    }
});
