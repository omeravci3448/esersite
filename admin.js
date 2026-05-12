const API_URL = "https://api-eser.avcielektronik.com.tr";

// Supabase-like wrapper for custom API
const supabase = {
    from: (table) => {
        let filters = [];
        let method = 'GET';
        let body = null;
        let isSingle = false;

        const chain = {
            select: () => { method = 'GET'; return chain; },
            single: () => { isSingle = true; return chain; },
            eq: (col, val) => { filters.push({ col, val }); return chain; },
            insert: (data) => { method = 'POST'; body = Array.isArray(data) ? data : [data]; return chain; },
            update: (data) => { method = 'PATCH'; body = data; return chain; },
            delete: () => { method = 'DELETE'; return chain; },
            then: async (resolve, reject) => {
                try {
                    let url = `${API_URL}/${table}`;
                    const options = {
                        method,
                        headers: { 'Content-Type': 'application/json' }
                    };

                    if (method === 'GET' || method === 'DELETE' || method === 'PATCH') {
                        if (filters.length > 0) {
                            const query = filters.map(f => `${f.col}=${encodeURIComponent(f.val)}`).join('&');
                            url += `?${query}`;
                        }
                    }

                    if (body) options.body = JSON.stringify(body);

                    const r = await fetch(url, options);
                    const data = await r.json();
                    
                    if (!r.ok) throw new Error(data.error || 'İşlem başarısız');
                    
                    let finalData = data;
                    if (method === 'GET' && isSingle && Array.isArray(data)) finalData = data[0];
                    
                    resolve({ data: finalData, error: null });
                } catch (err) {
                    resolve({ data: null, error: err });
                }
            }
        };
        return chain;
    }
};

// UI Elements
const loginScreen = document.getElementById('login-screen');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const logoutBtn = document.getElementById('logout-btn');

// State
let currentUser = null;

// Auth Logic
async function checkAuth() {
    const savedUser = localStorage.getItem('eser_admin_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    loginError.innerText = 'Giriş yapılıyor...';
    
    const { data, error } = await supabase.from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();
        
    if (error || !data) {
        loginError.innerText = 'Hatalı kullanıcı adı veya şifre!';
        return;
    }
    
    if (data.role !== 'root' && data.role !== 'admin') {
        loginError.innerText = 'Yetkisiz kullanıcı!';
        return;
    }
    
    currentUser = data;
    localStorage.setItem('eser_admin_user', JSON.stringify(data));
    showDashboard();
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('eser_admin_user');
    location.reload();
});

function showDashboard() {
    loginScreen.classList.remove('active');
    adminDashboard.classList.add('active');
    document.getElementById('user-display').innerText = currentUser.full_name || currentUser.username;
    loadGeneralContent();
    loadCollection();
}

// Tab Switching
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const tabId = item.dataset.tab;
        
        navItems.forEach(nav => nav.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.remove('active'));
        
        item.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
        document.getElementById('tab-title').innerText = item.innerText.trim();
    });
});

// General Content Logic
async function loadGeneralContent() {
    const { data, error } = await supabase.from('website_content').select('*');
    if (data) {
        data.forEach(item => {
            const input = document.querySelector(`[data-key="${item.content_key}"]`);
            if (input) input.value = item.content_value;
        });
    }
}

document.getElementById('general-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updates = [];
    
    for (let [key, value] of formData.entries()) {
        const { data, error } = await supabase.from('website_content')
            .update({ content_value: value })
            .eq('content_key', key);
        updates.push({ key, success: !error });
    }
    
    alert('Bilgiler güncellendi!');
});

// Collection Logic
async function loadCollection() {
    const list = document.getElementById('collection-list');
    list.innerHTML = '<p>Yükleniyor...</p>';
    
    const { data, error } = await supabase.from('website_gallery').select('*');
    
    if (error) {
        list.innerHTML = '<p>Veri yüklenemedi.</p>';
        return;
    }
    
    list.innerHTML = '';
    data.sort((a, b) => a.order_index - b.order_index).forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <img src="${item.image_url}" alt="${item.title}">
            <div class="item-info">
                <h4>${item.title || 'Başlıksız'}</h4>
                <p>${item.category} - ${item.subtitle || ''}</p>
                <div class="item-actions">
                    <button class="btn-icon edit" onclick="editItem('${item.id}')"><i class="fas fa-edit"></i> Düzenle</button>
                    <button class="btn-icon delete" onclick="deleteItem('${item.id}')"><i class="fas fa-trash"></i> Sil</button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

// Modal Logic
const modal = document.getElementById('item-modal');
const itemForm = document.getElementById('item-form');

document.getElementById('add-item-btn').addEventListener('click', () => {
    document.getElementById('modal-title').innerText = 'Yeni Ürün Ekle';
    itemForm.reset();
    document.getElementById('item-id').value = '';
    modal.classList.add('active');
});

document.getElementById('close-modal').addEventListener('click', () => {
    modal.classList.remove('active');
});

window.editItem = async (id) => {
    const { data, error } = await supabase.from('website_gallery').select('*').eq('id', id).single();
    if (data) {
        document.getElementById('modal-title').innerText = 'Ürünü Düzenle';
        document.getElementById('item-id').value = data.id;
        document.getElementById('item-title').value = data.title;
        document.getElementById('item-subtitle').value = data.subtitle;
        document.getElementById('item-image-url').value = data.image_url;
        document.getElementById('item-category').value = data.category;
        modal.classList.add('active');
    }
};

itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('item-id').value;
    const payload = {
        title: document.getElementById('item-title').value,
        subtitle: document.getElementById('item-subtitle').value,
        image_url: document.getElementById('item-image-url').value,
        category: document.getElementById('item-category').value
    };
    
    let result;
    if (id) {
        result = await supabase.from('website_gallery').update(payload).eq('id', id);
    } else {
        result = await supabase.from('website_gallery').insert(payload);
    }
    
    if (!result.error) {
        modal.classList.remove('active');
        loadCollection();
    } else {
        alert('Hata: ' + result.error.message);
    }
});

window.deleteItem = async (id) => {
    if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
        const { error } = await supabase.from('website_gallery').delete().eq('id', id);
        if (!error) loadCollection();
    }
};

// Initial Load
checkAuth();
