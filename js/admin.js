// ============================================================
// ADMIN DASHBOARD - CRUD PRODUCTOS Y USUARIOS
// ============================================================

const Admin = {
    // Verificar acceso de administrador
    async checkAccess() {
        const role = await Auth.getUserRole();
        if (role !== 'admin') {
            document.body.classList.remove('admin-checking');
            Toast.show('Acceso denegado. Se requieren permisos de administrador.', 'error');
            setTimeout(() => window.location.href = '../index.html', 2000);
            return false;
        }
        document.body.classList.remove('admin-checking');
        document.body.classList.add('admin-authorized');
        return true;
    },

    // ============================================================
    // DASHBOARD
    // ============================================================
    async loadDashboard() {
        if (!await this.checkAccess()) return;

        try {
            const { data: products } = await supabaseClient.from('products').select('*', { count: 'exact', head: false });
            const { data: profiles } = await supabaseClient.from('profiles').select('*');
            const { count: prodCount } = await supabaseClient.from('products').select('*', { count: 'exact', head: true });
            const { count: userCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true });

            const adminCount = profiles?.filter(p => p.role === 'admin').length || 0;
            const totalStock = products?.reduce((sum, p) => sum + (p.stock || 0), 0) || 0;
            const totalValue = products?.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0) || 0;

            document.getElementById('stat-products').textContent = prodCount || 0;
            document.getElementById('stat-users').textContent = userCount || 0;
            document.getElementById('stat-admins').textContent = adminCount;
            document.getElementById('stat-value').textContent = `$${totalValue.toFixed(0)}`;

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
        } catch {
            // Supabase no disponible - mostrar valores por defecto
            document.getElementById('stat-products').textContent = '—';
            document.getElementById('stat-users').textContent = '—';
            document.getElementById('stat-admins').textContent = '—';
            document.getElementById('stat-value').textContent = '—';
            document.getElementById('recent-products').innerHTML = '<tr><td colspan="4" class="text-center py-6 text-gray-500">Modo simulación — Conecta Supabase para ver datos</td></tr>';
        }

        // Verificar estado de seed users
        this.checkSeedUsers();
    },

    // Verificar si los usuarios seed existen en Supabase
    async checkSeedUsers() {
        const container = document.getElementById('seed-users-status');
        if (!container) return;

        const seedEmails = [
            CONFIG.SEED_ADMIN_EMAIL || 'admin@ejemplo.com',
            CONFIG.SEED_USER_EMAIL || 'usuario@ejemplo.com'
        ];

        const simRoles = { 'admin@ejemplo.com': 'admin', 'usuario@ejemplo.com': 'user' };

        try {
            const { data: profiles, error } = await supabaseClient
                .from('profiles')
                .select('email, role')
                .in('email', seedEmails);

            let foundMap = {};
            if (!error && profiles) {
                profiles.forEach(p => { foundMap[p.email] = p.role; });
            }

            // En modo simulación, si Supabase no devuelve datos, usar roles simulados
            if (Object.keys(foundMap).length === 0) {
                foundMap = simRoles;
            }

            const rows = seedEmails.map(email => {
                const role = foundMap[email];
                const exists = !!role;
                const isAdmin = role === 'admin';
                return `
                    <div class="flex items-center justify-between py-2 px-3 rounded-lg ${exists ? 'bg-zinc-800/50' : 'bg-red-900/20'}">
                        <div class="flex items-center gap-3">
                            <span class="${exists ? 'text-green-500' : 'text-red-500'}">
                                <i class="fas ${exists ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                            </span>
                            <span class="font-mono text-sm">${email}</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="px-2 py-0.5 rounded-full text-xs font-semibold
                                ${isAdmin ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-700/50 text-gray-300'}">
                                ${isAdmin ? 'Admin' : (exists ? 'Usuario' : 'No existe')}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = rows;

        } catch (err) {
            // Fallback a modo simulación
            const rows = seedEmails.map(email => {
                const role = simRoles[email];
                const exists = !!role;
                const isAdmin = role === 'admin';
                return `
                    <div class="flex items-center justify-between py-2 px-3 rounded-lg ${exists ? 'bg-zinc-800/50' : 'bg-red-900/20'}">
                        <div class="flex items-center gap-3">
                            <span class="${exists ? 'text-green-500' : 'text-red-500'}">
                                <i class="fas ${exists ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                            </span>
                            <span class="font-mono text-sm">${email}</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="px-2 py-0.5 rounded-full text-xs font-semibold
                                ${isAdmin ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-700/50 text-gray-300'}">
                                ${isAdmin ? 'Admin' : (exists ? 'Usuario' : 'No existe')}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
            container.innerHTML = rows + `
                <div class="text-xs text-gray-500 mt-2">
                    <i class="fas fa-flask"></i> Modo simulación — Supabase no disponible
                </div>
            `;
        }
    },
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

// ---------- ADMIN MOBILE SIDEBAR TOGGLE ----------
Admin.toggleMobileSidebar = function() {
    const sidebar = document.querySelector('.admin-sidebar');
    const overlay = document.querySelector('.admin-sidebar-overlay');
    if (sidebar) {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
    }
};

Admin.closeMobileSidebar = function() {
    const sidebar = document.querySelector('.admin-sidebar');
    const overlay = document.querySelector('.admin-sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
};

// Close sidebar on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('admin-sidebar-overlay')) {
        Admin.closeMobileSidebar();
    }
});

// Close sidebar on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const sidebar = document.querySelector('.admin-sidebar');
        if (sidebar?.classList.contains('open')) {
            Admin.closeMobileSidebar();
        }
    }
});

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
