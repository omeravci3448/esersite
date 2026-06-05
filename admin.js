const API_URL = window.ESER_API_URL || 'https://api.esericmimarlikmobilya.com';
const TOKEN_KEY = 'eser_admin_token';
const USER_KEY = 'eser_admin_user';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function authHeaders() {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function api(path, options = {}) {
    const opts = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
            ...(options.headers || {})
        }
    };
    if (opts.body && typeof opts.body !== 'string') {
        opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(`${API_URL}${path}`, opts);
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
        const err = new Error((data && data.error) || `HTTP ${res.status}`);
        err.status = res.status;
        if (res.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            location.reload();
        }
        throw err;
    }
    return data;
}

function imageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('/')) {
        return url.startsWith('/uploads/') ? `${API_URL}${url}` : url;
    }
    return url;
}

const loginScreen = document.getElementById('login-screen');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const logoutBtn = document.getElementById('logout-btn');

let currentUser = null;

async function checkAuth() {
    const token = getToken();
    if (!token) return;
    try {
        currentUser = await api('/auth/me');
        showDashboard();
    } catch (err) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    loginError.innerText = 'Giriş yapılıyor...';
    try {
        const result = await api('/auth/login', {
            method: 'POST',
            body: { username, password }
        });
        localStorage.setItem(TOKEN_KEY, result.token);
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
        currentUser = result.user;
        loginError.innerText = '';
        showDashboard();
    } catch (err) {
        loginError.innerText = err.message || 'Giriş başarısız';
    }
});

logoutBtn.addEventListener('click', () => {
    if (!confirm('Çıkış yapmak istediğinize emin misiniz?')) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    location.reload();
});

// Şifre Değiştir
const changePasswordModal = document.getElementById('change-password-modal');
const changePasswordForm = document.getElementById('change-password-form');
document.getElementById('change-password-btn')?.addEventListener('click', () => {
    changePasswordForm.reset();
    changePasswordModal.classList.add('active');
});
document.getElementById('close-change-password')?.addEventListener('click', () => {
    changePasswordModal.classList.remove('active');
});
changePasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPassword = document.getElementById('cp-old').value;
    const newPassword = document.getElementById('cp-new').value;
    const newPassword2 = document.getElementById('cp-new2').value;
    if (newPassword.length < 8) {
        showToast('Yeni şifre en az 8 karakter olmalı', 'error');
        return;
    }
    if (newPassword !== newPassword2) {
        showToast('Yeni şifreler eşleşmiyor', 'error');
        return;
    }
    try {
        await api('/auth/change-password', { method: 'POST', body: { oldPassword, newPassword } });
        changePasswordModal.classList.remove('active');
        showToast('Şifreniz güncellendi', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
});

let uploadLimits = { maxFileSizeMB: 5, maxUploadCount: 100, currentCount: 0 };

async function loadUploadLimits() {
    try {
        uploadLimits = await api('/upload/limits');
        const status = document.getElementById('upload-status');
        if (status) {
            const c = uploadLimits.currentCount;
            const max = uploadLimits.maxUploadCount;
            const pct = max > 0 ? (c / max) : 0;
            status.innerHTML = `<i class="fas fa-images"></i> ${c} / ${max} görsel`;
            status.classList.toggle('warn', pct >= 0.8 && pct < 1);
            status.classList.toggle('full', pct >= 1);
        }
        document.querySelectorAll('.upload-hint').forEach(el => {
            el.innerText = `En fazla ${uploadLimits.maxFileSizeMB} MB · Toplam ${uploadLimits.currentCount}/${uploadLimits.maxUploadCount}`;
        });
    } catch (err) {
        console.warn('Upload limit bilgisi alınamadı:', err);
    }
}

function showDashboard() {
    loginScreen.classList.remove('active');
    adminDashboard.classList.add('active');
    document.getElementById('user-display').innerText = currentUser.full_name || currentUser.username;
    const avatar = document.querySelector('.avatar');
    if (avatar) avatar.innerText = (currentUser.full_name || currentUser.username).charAt(0).toUpperCase();
    loadUploadLimits();
    loadGeneralContent();
    loadCollection();
    loadFaq();
    loadWhatsapp();
}

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

async function loadGeneralContent() {
    try {
        const content = await api('/content');
        document.querySelectorAll('[data-key]').forEach(input => {
            const key = input.dataset.key;
            if (content[key] !== undefined) {
                input.value = content[key];
                const preview = document.querySelector(`[data-preview-for="${key}"]`);
                if (preview && content[key]) {
                    preview.src = imageUrl(content[key]);
                    preview.style.display = 'block';
                }
            }
        });
    } catch (err) {
        console.error('İçerik yüklenemedi:', err);
    }
}

document.querySelectorAll('input[type="file"][data-upload-for]').forEach(fileInput => {
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const targetKey = fileInput.dataset.uploadFor;
        const targetInput = document.querySelector(`input[data-key="${targetKey}"]`);
        const preview = document.querySelector(`[data-preview-for="${targetKey}"]`);
        const label = document.querySelector(`label[for="${fileInput.id}"]`);
        const originalLabelHtml = label?.innerHTML;
        if (label) label.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';

        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: authHeaders(),
                body: fd
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || 'Yükleme başarısız');
            if (targetInput) targetInput.value = data.url;
            if (preview) {
                preview.src = imageUrl(data.url);
                preview.style.display = 'block';
            }
            showToast('Görsel yüklendi. Değişiklik için "Kaydet" butonuna basın.', 'success');
            loadUploadLimits();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            if (label && originalLabelHtml) label.innerHTML = originalLabelHtml;
            fileInput.value = '';
        }
    });
});

document.getElementById('general-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Kaydediliyor...';

    const inputs = e.target.querySelectorAll('[data-key]');
    let success = 0, fail = 0;
    for (const input of inputs) {
        try {
            await api(`/content/${encodeURIComponent(input.dataset.key)}`, {
                method: 'PATCH',
                body: { value: input.value }
            });
            success++;
        } catch (err) {
            fail++;
            console.error(`${input.dataset.key} kaydedilemedi:`, err);
        }
    }
    btn.disabled = false;
    btn.innerText = original;
    showToast(fail === 0 ? `${success} alan güncellendi` : `${fail} alan kaydedilemedi`, fail === 0 ? 'success' : 'error');
});

async function loadCollection() {
    const list = document.getElementById('collection-list');
    list.innerHTML = '<p class="loading">Yükleniyor...</p>';
    try {
        const items = await api('/collection');
        if (items.length === 0) {
            list.innerHTML = '<p class="empty">Henüz ürün eklenmemiş.</p>';
            return;
        }
        list.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <img src="${escapeHtml(imageUrl(item.image_url))}" alt="${escapeHtml(item.title)}">
                <div class="item-info">
                    <h4>${escapeHtml(item.title || 'Başlıksız')}</h4>
                    <p>${escapeHtml(item.category || '')} ${item.subtitle ? '- ' + escapeHtml(item.subtitle) : ''}</p>
                    <div class="item-actions">
                        <button class="btn-icon edit" data-id="${item.id}"><i class="fas fa-edit"></i> Düzenle</button>
                        <button class="btn-icon delete" data-id="${item.id}"><i class="fas fa-trash"></i> Sil</button>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
        list.querySelectorAll('.btn-icon.edit').forEach(b => b.addEventListener('click', () => editItem(b.dataset.id)));
        list.querySelectorAll('.btn-icon.delete').forEach(b => b.addEventListener('click', () => deleteItem(b.dataset.id)));
    } catch (err) {
        list.innerHTML = `<p class="error">Veri yüklenemedi: ${err.message}</p>`;
    }
}

const itemModal = document.getElementById('item-modal');
const itemForm = document.getElementById('item-form');
const itemImageFile = document.getElementById('item-image-file');
const itemImageUrl = document.getElementById('item-image-url');
const itemImagePreview = document.getElementById('item-image-preview');

document.getElementById('add-item-btn').addEventListener('click', () => {
    document.getElementById('modal-title').innerText = 'Yeni Ürün Ekle';
    itemForm.reset();
    document.getElementById('item-id').value = '';
    if (itemImagePreview) itemImagePreview.style.display = 'none';
    itemModal.classList.add('active');
});

document.getElementById('close-modal').addEventListener('click', () => {
    itemModal.classList.remove('active');
});

itemImageFile?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const btn = itemForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = 'Görsel yükleniyor...';
    try {
        const fd = new FormData();
        fd.append('image', file);
        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: authHeaders(),
            body: fd
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Yükleme başarısız');
        itemImageUrl.value = data.url;
        if (itemImagePreview) {
            itemImagePreview.src = imageUrl(data.url);
            itemImagePreview.style.display = 'block';
        }
        showToast('Görsel yüklendi', 'success');
        loadUploadLimits();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Kaydet';
    }
});

async function editItem(id) {
    try {
        const items = await api('/collection');
        const item = items.find(x => String(x.id) === String(id));
        if (!item) return;
        document.getElementById('modal-title').innerText = 'Ürünü Düzenle';
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-title').value = item.title;
        document.getElementById('item-subtitle').value = item.subtitle || '';
        itemImageUrl.value = item.image_url;
        document.getElementById('item-category').value = item.category || 'Mutfak';
        if (itemImagePreview) {
            itemImagePreview.src = imageUrl(item.image_url);
            itemImagePreview.style.display = 'block';
        }
        itemModal.classList.add('active');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('item-id').value;
    const payload = {
        title: document.getElementById('item-title').value,
        subtitle: document.getElementById('item-subtitle').value,
        image_url: itemImageUrl.value,
        category: document.getElementById('item-category').value
    };
    try {
        if (id) {
            await api(`/collection/${id}`, { method: 'PATCH', body: payload });
        } else {
            await api('/collection', { method: 'POST', body: payload });
        }
        itemModal.classList.remove('active');
        loadCollection();
        showToast(id ? 'Ürün güncellendi' : 'Ürün eklendi', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
});

async function deleteItem(id) {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
        await api(`/collection/${id}`, { method: 'DELETE' });
        loadCollection();
        loadUploadLimits();
        showToast('Ürün silindi', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadFaq() {
    const list = document.getElementById('faq-list');
    if (!list) return;
    list.innerHTML = '<p class="loading">Yükleniyor...</p>';
    try {
        const items = await api('/faq');
        if (items.length === 0) {
            list.innerHTML = '<p class="empty">Henüz soru eklenmemiş.</p>';
            return;
        }
        list.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'faq-card';
            card.innerHTML = `
                <div class="faq-content">
                    <h4>${escapeHtml(item.question)}</h4>
                    <p>${escapeHtml(item.answer)}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-icon edit" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            list.appendChild(card);
        });
        list.querySelectorAll('.btn-icon.edit').forEach(b => b.addEventListener('click', () => editFaq(b.dataset.id)));
        list.querySelectorAll('.btn-icon.delete').forEach(b => b.addEventListener('click', () => deleteFaq(b.dataset.id)));
    } catch (err) {
        list.innerHTML = `<p class="error">Veri yüklenemedi: ${err.message}</p>`;
    }
}

const faqModal = document.getElementById('faq-modal');
const faqForm = document.getElementById('faq-form');

document.getElementById('add-faq-btn')?.addEventListener('click', () => {
    document.getElementById('faq-modal-title').innerText = 'Yeni Soru Ekle';
    faqForm.reset();
    document.getElementById('faq-id').value = '';
    faqModal.classList.add('active');
});

document.getElementById('close-faq-modal')?.addEventListener('click', () => {
    faqModal.classList.remove('active');
});

async function editFaq(id) {
    try {
        const items = await api('/faq');
        const item = items.find(x => String(x.id) === String(id));
        if (!item) return;
        document.getElementById('faq-modal-title').innerText = 'Soruyu Düzenle';
        document.getElementById('faq-id').value = item.id;
        document.getElementById('faq-question').value = item.question;
        document.getElementById('faq-answer').value = item.answer;
        faqModal.classList.add('active');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

faqForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('faq-id').value;
    const payload = {
        question: document.getElementById('faq-question').value,
        answer: document.getElementById('faq-answer').value
    };
    try {
        if (id) {
            await api(`/faq/${id}`, { method: 'PATCH', body: payload });
        } else {
            await api('/faq', { method: 'POST', body: payload });
        }
        faqModal.classList.remove('active');
        loadFaq();
        showToast(id ? 'Soru güncellendi' : 'Soru eklendi', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
});

async function deleteFaq(id) {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
    try {
        await api(`/faq/${id}`, { method: 'DELETE' });
        loadFaq();
        showToast('Soru silindi', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showToast(message, type = 'info') {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'admin-toast';
        document.body.appendChild(toast);
    }
    toast.className = `toast toast-${type} show`;
    toast.innerText = message;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ───── WhatsApp (CRUD) ─────
const whatsappList = document.getElementById('whatsapp-list');
const whatsappModal = document.getElementById('whatsapp-modal');
const whatsappForm = document.getElementById('whatsapp-form');

async function loadWhatsapp() {
    if (!whatsappList) return;
    try {
        const items = await api('/whatsapp');
        if (!items.length) {
            whatsappList.innerHTML = '<p style="color:#888; padding:1.5rem; text-align:center;">Henüz WhatsApp hattı tanımlı değil. Yeni eklemek için yukarıdaki butonu kullanın.</p>';
            return;
        }
        whatsappList.innerHTML = items.map(w => `
            <div class="faq-admin-item">
                <div class="faq-admin-header">
                    <span class="faq-admin-q">
                        <i class="fab fa-whatsapp" style="color:#25D366; margin-right:8px;"></i>
                        ${escapeHtml(w.name)}
                    </span>
                    <div class="faq-admin-actions">
                        <button class="btn-icon" onclick="editWhatsapp(${w.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon danger" onclick="deleteWhatsapp(${w.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <p class="faq-admin-a">${escapeHtml(w.number)}</p>
                <small style="color:#999;">Sıralama: ${w.order_index}</small>
            </div>
        `).join('');
    } catch (err) {
        whatsappList.innerHTML = `<p style="color:#dc3545; padding:1.5rem;">WhatsApp hatları yüklenemedi: ${err.message}</p>`;
    }
}

document.getElementById('add-whatsapp-btn')?.addEventListener('click', () => {
    document.getElementById('whatsapp-modal-title').innerText = 'Yeni WhatsApp Hattı';
    whatsappForm.reset();
    document.getElementById('whatsapp-id').value = '';
    document.getElementById('whatsapp-order').value = 0;
    whatsappModal.classList.add('active');
});

document.getElementById('close-whatsapp-modal')?.addEventListener('click', () => {
    whatsappModal.classList.remove('active');
});

window.editWhatsapp = async function (id) {
    try {
        const items = await api('/whatsapp');
        const w = items.find(x => x.id === id);
        if (!w) return;
        document.getElementById('whatsapp-modal-title').innerText = 'WhatsApp Hattı Düzenle';
        document.getElementById('whatsapp-id').value = w.id;
        document.getElementById('whatsapp-name').value = w.name;
        document.getElementById('whatsapp-number').value = w.number;
        document.getElementById('whatsapp-order').value = w.order_index || 0;
        whatsappModal.classList.add('active');
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.deleteWhatsapp = async function (id) {
    if (!confirm('Bu WhatsApp hattını silmek istediğinize emin misiniz?')) return;
    try {
        await api(`/whatsapp/${id}`, { method: 'DELETE' });
        loadWhatsapp();
        showToast('Hat silindi', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
};

whatsappForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('whatsapp-id').value;
    const body = {
        name: document.getElementById('whatsapp-name').value.trim(),
        number: document.getElementById('whatsapp-number').value.replace(/[^\d]/g, ''),
        order_index: Number(document.getElementById('whatsapp-order').value) || 0
    };
    if (!body.number) {
        showToast('Geçerli bir telefon numarası girin', 'error');
        return;
    }
    try {
        if (id) {
            await api(`/whatsapp/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
            showToast('Hat güncellendi', 'success');
        } else {
            await api('/whatsapp', { method: 'POST', body: JSON.stringify(body) });
            showToast('Hat eklendi', 'success');
        }
        whatsappModal.classList.remove('active');
        loadWhatsapp();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

checkAuth();
