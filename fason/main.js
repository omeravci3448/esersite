const API_URL = window.ESER_API_URL || 'https://api.esericmimarlikmobilya.com';

function apiImageUrl(url) {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
    return url;
}

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initMobileMenu();
    initSmoothScroll();
    initFaqAccordion();
    initContactForm();
    initFloatingWa();
    loadDynamicContent();
});

function initFloatingWa() {
    const wrapper = document.querySelector('.floating-wa-wrapper');
    const btn = wrapper?.querySelector('.floating-wa');
    if (!wrapper || !btn) return;
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        wrapper.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
    });
}

// ───── Navbar scroll behavior ─────
function initNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    const onScroll = () => {
        if (window.scrollY > 30) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
}

// ───── Mobile menu ─────
function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
        links.classList.toggle('active');
        const icon = toggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        }
    });
    links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            links.classList.remove('active');
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        });
    });
}

// ───── Smooth scroll for hash links ─────
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href.length <= 1) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            window.scrollTo({
                top: target.offsetTop - 70,
                behavior: 'smooth'
            });
        });
    });
}

// ───── FAQ accordion ─────
function initFaqAccordion() {
    document.addEventListener('click', (e) => {
        const question = e.target.closest('.faq-question');
        if (!question) return;
        const item = question.closest('.faq-item');
        if (!item) return;
        const isActive = item.classList.contains('active');
        item.parentElement.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        if (!isActive) item.classList.add('active');
    });
}

// ───── Dynamic content from API ─────
async function loadDynamicContent() {
    try {
        const [content, services, faqs, whatsapp] = await Promise.allSettled([
            fetch(`${API_URL}/fason/content`).then(r => r.ok ? r.json() : null),
            fetch(`${API_URL}/fason/services`).then(r => r.ok ? r.json() : null),
            fetch(`${API_URL}/fason/faq`).then(r => r.ok ? r.json() : null),
            fetch(`${API_URL}/fason/whatsapp`).then(r => r.ok ? r.json() : null)
        ]);

        if (content.status === 'fulfilled' && content.value) {
            applyContent(content.value);
        }
        if (services.status === 'fulfilled' && Array.isArray(services.value) && services.value.length > 0) {
            renderServices(services.value);
        }
        if (faqs.status === 'fulfilled' && Array.isArray(faqs.value) && faqs.value.length > 0) {
            renderFaq(faqs.value);
        }
        if (whatsapp.status === 'fulfilled' && Array.isArray(whatsapp.value)) {
            renderWhatsapp(whatsapp.value);
        }
    } catch (err) {
        console.warn('[fason] Dinamik içerik yüklenemedi, statik içerik kullanılıyor:', err);
    }
}

function formatPhoneNumber(num) {
    const cleaned = String(num).replace(/[^\d]/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('90')) {
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
    }
    return num;
}

function renderWhatsapp(contacts) {
    const grid = document.getElementById('whatsapp-grid');
    const floating = document.getElementById('floating-wa-menu');

    if (grid) {
        if (contacts.length === 0) {
            grid.innerHTML = '<p style="color:#888;">WhatsApp kontağı tanımlı değil.</p>';
        } else {
            grid.innerHTML = contacts.map(c => `
                <a href="https://wa.me/${encodeURIComponent(c.number)}" target="_blank" rel="noopener" class="wa-btn">
                    <i class="fab fa-whatsapp"></i>
                    <div class="wa-btn-text">
                        <strong>${escapeHtml(c.name)}</strong>
                        <span>${escapeHtml(formatPhoneNumber(c.number))}</span>
                    </div>
                </a>
            `).join('');
        }
    }

    if (floating) {
        floating.innerHTML = contacts.map(c => `
            <a href="https://wa.me/${encodeURIComponent(c.number)}" target="_blank" rel="noopener">
                <strong>${escapeHtml(c.name)}</strong>
                <span>${escapeHtml(formatPhoneNumber(c.number))}</span>
            </a>
        `).join('');
    }
}

function applyContent(content) {
    document.querySelectorAll('[data-content]').forEach(el => {
        const key = el.dataset.content;
        const value = content[key];
        if (typeof value !== 'string' || !value) return;
        if (el.tagName === 'IMG') {
            el.src = apiImageUrl(value);
        } else if (el.dataset.html === 'true') {
            el.innerHTML = value;
        } else if (el.tagName === 'A' && el.dataset.content === 'contact_phone') {
            el.textContent = value;
            el.href = 'tel:' + value.replace(/[^\d+]/g, '');
        } else if (el.tagName === 'A' && el.dataset.content === 'contact_email') {
            el.textContent = value;
            el.href = 'mailto:' + value;
        } else {
            el.textContent = value;
        }
    });
}

function renderServices(services) {
    const grid = document.getElementById('services-grid');
    if (!grid) return;
    grid.innerHTML = services.map(s => `
        <div class="service-card">
            <div class="icon"><i class="${escapeHtml(s.icon || 'fas fa-tools')}"></i></div>
            <h3>${escapeHtml(s.title)}</h3>
            <p>${escapeHtml(s.description || '')}</p>
        </div>
    `).join('');
}

function renderFaq(faqs) {
    const list = document.getElementById('faq-list');
    if (!list) return;
    list.innerHTML = faqs.map(f => `
        <div class="faq-item">
            <div class="faq-question">${escapeHtml(f.question)} <i class="fas fa-plus"></i></div>
            <div class="faq-answer">${escapeHtml(f.answer)}</div>
        </div>
    `).join('');
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ───── Contact form (Web3Forms) ─────
function initContactForm() {
    const form = document.getElementById('fason-form');
    const result = document.getElementById('form-result');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';
        submitBtn.disabled = true;
        result.textContent = '';
        result.className = '';

        const formData = new FormData(form);
        const obj = Object.fromEntries(formData);
        const json = JSON.stringify(obj);

        try {
            const res = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: json
            });
            const data = await res.json();

            if (res.status === 200 && data.success) {
                result.textContent = '✓ Talebiniz iletildi. En kısa sürede sizinle iletişime geçeceğiz.';
                result.className = 'form-success';
                form.reset();
            } else {
                result.textContent = 'Bir hata oluştu. Lütfen WhatsApp üzerinden iletişime geçin.';
                result.className = 'form-error';
            }
        } catch (err) {
            result.textContent = 'Bağlantı hatası. Lütfen WhatsApp üzerinden iletişime geçin.';
            result.className = 'form-error';
        }

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}
