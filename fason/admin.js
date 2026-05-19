const API_URL = window.ESER_API_URL || 'https://api.esericmimarlikmobilya.com';
const TOKEN_KEY = 'eser_fason_admin_token';

let currentUser = null;
let token = localStorage.getItem(TOKEN_KEY);

const loginScreen = document.getElementById('login-screen');
const adminDashboard = document.getElementById('admin-dashboard');

// ───── Auth helpers ─────
function authHeaders() {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function api(endpoint, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...authHeaders(), ...(opts.headers || {}) };
    const res = await fetch(`${API_URL}${endpoint}`, { ...opts, headers });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && (data.message || data.error)) || 'İstek başarısız');
    return data;
}

function imageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
    return url;
}

function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ───── Auth flow ─────
async function checkAuth() {
    if (!token) return showLogin();
    try {
        currentUser = await api('/auth/me');
        showDashboard();
    } catch {
        localStorage.removeItem(TOKEN_KEY);
        token = null;
        showLogin();
    }
}

function showLogin() {
    loginScreen.classList.add('active');
    adminDashboard.classList.remove('active');
}

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
    } catch {}
}

function showDashboard() {
    loginScreen.classList.remove('active');
    adminDashboard.classList.add('active');
    document.getElementById('user-display').innerText = currentUser.full_name || currentUser.username;
    const avatar = document.querySelector('.avatar');
    if (avatar) avatar.innerText = (currentUser.full_name || currentUser.username).charAt(0).toUpperCase();
    loadUploadLimits();
    loadGeneralContent();
    loadServices();
    loadFaq();
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errEl = document.getElementById('login-error');
    errEl.innerText = '';
    try {
        const data = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        }).then(r => r.json());
        if (!data.token) throw new Error(data.message || data.error || 'Giriş başarısız');
        token = data.token;
        localStorage.setItem(TOKEN_KEY, token);
        currentUser = data.user;
        showDashboard();
    } catch (err) {
        errEl.innerText = err.message;
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    token = null;
    currentUser = null;
    showLogin();
});

// ───── Tabs ─────
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
        const titles = { general: 'Genel Bilgiler', services: 'Hizmetler', faq: 'Sıkça Sorulan Sorular' };
        document.getElementById('tab-title').innerText = titles[tab] || '';
    });
});

// ───── Genel Bilgiler ─────
async function loadGeneralContent() {
    try {
        const content = await api('/fason/content');
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

document.getElementById('general-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = document.querySelectorAll('[data-key]');
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = 'Kaydediliyor...';
    try {
        for (const input of inputs) {
            const key = input.dataset.key;
            await api(`/fason/content/${key}`, {
                method: 'PATCH',
                body: JSON.stringify({ value: input.value })
            });
        }
        showToast('Tüm değişiklikler kaydedildi', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Değişiklikleri Kaydet';
    }
});

// ───── Görsel yükleme (genel form) ─────
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

// ───── Hizmetler (CRUD) ─────
const servicesList = document.getElementById('services-list');
const serviceModal = document.getElementById('service-modal');
const serviceForm = document.getElementById('service-form');

async function loadServices() {
    try {
        const services = await api('/fason/services');
        if (!services.length) {
            servicesList.innerHTML = '<p style="color:#888; padding:1.5rem; text-align:center;">Henüz hizmet yok. Yeni eklemek için yukarıdaki butonu kullanın.</p>';
            return;
        }
        servicesList.innerHTML = services.map(s => `
            <div class="faq-admin-item">
                <div class="faq-admin-header">
                    <span class="faq-admin-q">
                        <i class="${escapeHtml(s.icon || 'fas fa-tools')}" style="color:#f39221; margin-right:8px;"></i>
                        ${escapeHtml(s.title)}
                    </span>
                    <div class="faq-admin-actions">
                        <button class="btn-icon" onclick="editService(${s.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon danger" onclick="deleteService(${s.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <p class="faq-admin-a">${escapeHtml(s.description || '')}</p>
                <small style="color:#999;">Sıralama: ${s.order_index}</small>
            </div>
        `).join('');
    } catch (err) {
        servicesList.innerHTML = `<p style="color:#dc3545; padding:1.5rem;">Hizmetler yüklenemedi: ${err.message}</p>`;
    }
}

document.getElementById('add-service-btn').addEventListener('click', () => {
    document.getElementById('service-modal-title').innerText = 'Yeni Hizmet Ekle';
    serviceForm.reset();
    document.getElementById('service-id').value = '';
    document.getElementById('service-icon').value = 'fas fa-tools';
    serviceModal.classList.add('active');
});

document.getElementById('close-service-modal').addEventListener('click', () => {
    serviceModal.classList.remove('active');
});

window.editService = async function (id) {
    try {
        const services = await api('/fason/services');
        const s = services.find(x => x.id === id);
        if (!s) return;
        document.getElementById('service-modal-title').innerText = 'Hizmet Düzenle';
        document.getElementById('service-id').value = s.id;
        document.getElementById('service-title').value = s.title;
        document.getElementById('service-description').value = s.description || '';
        document.getElementById('service-icon').value = s.icon || 'fas fa-tools';
        document.getElementById('service-order').value = s.order_index || 0;
        serviceModal.classList.add('active');
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.deleteService = async function (id) {
    if (!confirm('Bu hizmeti silmek istediğinize emin misiniz?')) return;
    try {
        await api(`/fason/services/${id}`, { method: 'DELETE' });
        loadServices();
        showToast('Hizmet silindi', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
};

serviceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('service-id').value;
    const body = {
        title: document.getElementById('service-title').value,
        description: document.getElementById('service-description').value,
        icon: document.getElementById('service-icon').value || 'fas fa-tools',
        order_index: Number(document.getElementById('service-order').value) || 0
    };
    try {
        if (id) {
            await api(`/fason/services/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
            showToast('Hizmet güncellendi', 'success');
        } else {
            await api('/fason/services', { method: 'POST', body: JSON.stringify(body) });
            showToast('Hizmet eklendi', 'success');
        }
        serviceModal.classList.remove('active');
        loadServices();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// ───── SSS (CRUD) ─────
const faqList = document.getElementById('faq-list');
const faqModal = document.getElementById('faq-modal');
const faqForm = document.getElementById('faq-form');

async function loadFaq() {
    try {
        const faqs = await api('/fason/faq');
        if (!faqs.length) {
            faqList.innerHTML = '<p style="color:#888; padding:1.5rem; text-align:center;">Henüz SSS yok.</p>';
            return;
        }
        faqList.innerHTML = faqs.map(f => `
            <div class="faq-admin-item">
                <div class="faq-admin-header">
                    <span class="faq-admin-q">${escapeHtml(f.question)}</span>
                    <div class="faq-admin-actions">
                        <button class="btn-icon" onclick="editFaq(${f.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon danger" onclick="deleteFaq(${f.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <p class="faq-admin-a">${escapeHtml(f.answer)}</p>
                <small style="color:#999;">Sıralama: ${f.order_index}</small>
            </div>
        `).join('');
    } catch (err) {
        faqList.innerHTML = `<p style="color:#dc3545; padding:1.5rem;">SSS yüklenemedi: ${err.message}</p>`;
    }
}

document.getElementById('add-faq-btn').addEventListener('click', () => {
    document.getElementById('faq-modal-title').innerText = 'Yeni Soru Ekle';
    faqForm.reset();
    document.getElementById('faq-id').value = '';
    faqModal.classList.add('active');
});

document.getElementById('close-faq-modal').addEventListener('click', () => {
    faqModal.classList.remove('active');
});

window.editFaq = async function (id) {
    try {
        const faqs = await api('/fason/faq');
        const f = faqs.find(x => x.id === id);
        if (!f) return;
        document.getElementById('faq-modal-title').innerText = 'Soru Düzenle';
        document.getElementById('faq-id').value = f.id;
        document.getElementById('faq-question').value = f.question;
        document.getElementById('faq-answer').value = f.answer;
        document.getElementById('faq-order').value = f.order_index || 0;
        faqModal.classList.add('active');
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.deleteFaq = async function (id) {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
    try {
        await api(`/fason/faq/${id}`, { method: 'DELETE' });
        loadFaq();
        showToast('Soru silindi', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
};

faqForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('faq-id').value;
    const body = {
        question: document.getElementById('faq-question').value,
        answer: document.getElementById('faq-answer').value,
        order_index: Number(document.getElementById('faq-order').value) || 0
    };
    try {
        if (id) {
            await api(`/fason/faq/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
            showToast('Soru güncellendi', 'success');
        } else {
            await api('/fason/faq', { method: 'POST', body: JSON.stringify(body) });
            showToast('Soru eklendi', 'success');
        }
        faqModal.classList.remove('active');
        loadFaq();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// ───── Utils ─────
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ───── Init ─────
checkAuth();
