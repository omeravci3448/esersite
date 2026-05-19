const API_URL = window.ESER_API_URL || 'https://api.esericmimarlikmobilya.com';

function apiImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
    return url;
}

function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadDynamicContent() {
    const [content, collection, faq, whatsapp] = await Promise.allSettled([
        fetch(`${API_URL}/content`).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/collection`).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/faq`).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/whatsapp`).then(r => r.ok ? r.json() : null)
    ]);

    if (content.status === 'fulfilled' && content.value) {
        document.querySelectorAll('[data-content]').forEach(el => {
            const key = el.dataset.content;
            const value = content.value[key];
            if (typeof value !== 'string' || !value) return;
            if (el.tagName === 'IMG') {
                el.src = apiImageUrl(value);
            } else if (el.dataset.html === 'true') {
                el.innerHTML = value;
            } else {
                el.textContent = value;
            }
        });
    }

    if (collection.status === 'fulfilled' && Array.isArray(collection.value) && collection.value.length > 0) {
        renderCollection(collection.value);
    }

    if (faq.status === 'fulfilled' && Array.isArray(faq.value) && faq.value.length > 0) {
        renderFaq(faq.value);
    }

    if (whatsapp.status === 'fulfilled' && Array.isArray(whatsapp.value)) {
        renderWhatsapp(whatsapp.value);
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
                <a href="https://wa.me/${encodeURIComponent(c.number)}" target="_blank" rel="noopener" class="wa-card">
                    <i class="fab fa-whatsapp"></i>
                    <div class="wa-card-text">
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

function renderCollection(items) {
    const grid = document.getElementById('collection-grid');
    if (!grid) return;
    grid.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'collection-item reveal active';
        card.innerHTML = `
            <div class="item-img">
                <img src="${apiImageUrl(item.image_url)}" alt="${escapeHtml(item.title)}">
                <div class="overlay"><a href="#" class="view-btn">İncele</a></div>
            </div>
            <div class="item-info">
                <h3>${escapeHtml(item.title)}</h3>
                <span>${escapeHtml(item.subtitle || item.category || '')}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderFaq(items) {
    const list = document.getElementById('faq-list');
    if (!list) return;
    list.innerHTML = '';
    items.forEach(item => {
        const faqItem = document.createElement('div');
        faqItem.className = 'faq-item';
        faqItem.innerHTML = `
            <div class="faq-question">${escapeHtml(item.question)} <i class="fas fa-plus"></i></div>
            <div class="faq-answer">${escapeHtml(item.answer)}</div>
        `;
        list.appendChild(faqItem);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('#navbar');
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

    // Scroll effect for Navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Reveal animations on scroll
    const revealOnScroll = () => {
        const triggerBottom = window.innerHeight * 0.85;
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
            const elTop = el.getBoundingClientRect().top;
            if (elTop < triggerBottom) {
                el.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

    // Modal Logic (event delegation for dynamic content)
    const modal = document.querySelector('#product-modal');
    const modalImg = document.querySelector('#modal-image');
    const modalTitle = document.querySelector('#modal-title');
    const closeModal = document.querySelector('#product-modal .close-modal');

    document.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.view-btn');
        if (viewBtn) {
            e.preventDefault();
            const item = viewBtn.closest('.collection-item');
            if (!item) return;
            const imgSrc = item.querySelector('img').src;
            const title = item.querySelector('h3').innerText;
            modalImg.src = imgSrc;
            modalTitle.innerText = title;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Page Loader Simulation
    const loader = document.querySelector('#loader');
    const loaderBar = document.querySelector('.loader-bar');

    setTimeout(() => {
        loaderBar.style.width = '100%';
        setTimeout(() => {
            loader.style.transform = 'translateY(-100%)';
        }, 500);
    }, 500);

    // Custom Cursor Logic
    const cursor = document.querySelector('#cursor');
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // Use event delegation for cursor hover (works with dynamic content)
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, .view-btn, .wa-btn, .ba-range, .faq-question')) {
            cursor.classList.add('hover');
        }
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('a, button, .view-btn, .wa-btn, .ba-range, .faq-question')) {
            cursor.classList.remove('hover');
        }
    });

    // Before/After Slider Logic
    const baRange = document.querySelector('#ba-range');
    const beforeImg = document.querySelector('.before-image');
    const baHandle = document.querySelector('.ba-handle');

    if (baRange) {
        baRange.addEventListener('input', (e) => {
            const val = e.target.value;
            beforeImg.style.width = val + '%';
            baHandle.style.left = val + '%';
        });
    }

    // FAQ Accordion Logic (event delegation for dynamic content)
    document.addEventListener('click', (e) => {
        const question = e.target.closest('.faq-question');
        if (!question) return;
        const item = question.closest('.faq-item');
        if (!item) return;
        const isActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        if (!isActive) item.classList.add('active');
    });

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const toggleIcon = menuToggle.querySelector('i');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        if (navLinks.classList.contains('active')) {
            toggleIcon.classList.remove('fa-bars');
            toggleIcon.classList.add('fa-times');
        } else {
            toggleIcon.classList.remove('fa-times');
            toggleIcon.classList.add('fa-bars');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            toggleIcon.classList.remove('fa-times');
            toggleIcon.classList.add('fa-bars');
        });
    });

    // Contact Form Submission (Web3Forms)
    const contactForm = document.getElementById('contact-form');
    const formResult = document.getElementById('form-result');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Gönderiliyor...';
            submitBtn.disabled = true;
            formResult.innerText = '';
            formResult.className = '';

            const formData = new FormData(contactForm);
            const obj = Object.fromEntries(formData);
            const json = JSON.stringify(obj);

            try {
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: json
                });
                const result = await response.json();

                if (response.status === 200 && result.success) {
                    formResult.innerText = '✓ Mesajınız iletildi. En kısa sürede sizinle iletişime geçeceğiz.';
                    formResult.className = 'form-success';
                    contactForm.reset();
                } else {
                    formResult.innerText = 'Bir hata oluştu. Lütfen WhatsApp üzerinden iletişime geçin.';
                    formResult.className = 'form-error';
                }
            } catch (error) {
                formResult.innerText = 'Bağlantı hatası. Lütfen WhatsApp üzerinden iletişime geçin.';
                formResult.className = 'form-error';
            }

            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        });
    }

    // KVKK Modal Logic
    const kvkkLink = document.getElementById('kvkk-link');
    const kvkkModal = document.getElementById('kvkk-modal');
    const closeKvkk = document.getElementById('close-kvkk');

    if (kvkkLink && kvkkModal) {
        kvkkLink.addEventListener('click', (e) => {
            e.preventDefault();
            kvkkModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        closeKvkk.addEventListener('click', () => {
            kvkkModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        window.addEventListener('click', (e) => {
            if (e.target === kvkkModal) {
                kvkkModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Load dynamic content from API (silently fails if API is unavailable, keeping static fallback)
    loadDynamicContent().catch(err => console.warn('[content] API yüklenemedi, statik içerik kullanılıyor:', err));
});
