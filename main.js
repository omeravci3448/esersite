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

        reveals.forEach(el => {
            const elTop = el.getBoundingClientRect().top;
            if (elTop < triggerBottom) {
                el.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check

    // Modal Logic
    const modal = document.querySelector('#product-modal');
    const modalImg = document.querySelector('#modal-image');
    const modalTitle = document.querySelector('#modal-title');
    const closeModal = document.querySelector('.close-modal');
    const viewBtns = document.querySelectorAll('.view-btn');

    viewBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const item = btn.closest('.collection-item');
            const imgSrc = item.querySelector('img').src;
            const title = item.querySelector('h3').innerText;

            modalImg.src = imgSrc;
            modalTitle.innerText = title;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Stop scrolling
        });
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

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

    const hoverElements = document.querySelectorAll('a, button, .view-btn, .wa-btn, .ba-range');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
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

    // FAQ Accordion Logic
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(i => i.classList.remove('active'));
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const toggleIcon = menuToggle.querySelector('i');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        
        // Change icon from bars to times
        if (navLinks.classList.contains('active')) {
            toggleIcon.classList.remove('fa-bars');
            toggleIcon.classList.add('fa-times');
        } else {
            toggleIcon.classList.remove('fa-times');
            toggleIcon.classList.add('fa-bars');
        }
    });

    // Close menu when a link is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            toggleIcon.classList.remove('fa-times');
            toggleIcon.classList.add('fa-bars');
        });
    });

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
});
