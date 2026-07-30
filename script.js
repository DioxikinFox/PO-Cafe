document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links a');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    });

    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.category-wrapper');
    const menuCards = document.querySelectorAll('.menu-card');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');
            menuCards.forEach(c => c.classList.remove('show-info'));
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            contents.forEach(content => {
                content.classList.toggle('active', content.id === target);
            });
        });
    });

    menuCards.forEach(card => {
        card.addEventListener('click', () => card.classList.toggle('show-info'));
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const filterText = e.target.value.toLowerCase();
            if (filterText.trim() !== '') {
                contents.forEach(content => content.classList.add('active'));
                menuCards.forEach(card => {
                    const itemText = card.textContent.toLowerCase();
                    card.style.display = itemText.includes(filterText) ? 'block' : 'none';
                });
            } else {
                const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-target');
                contents.forEach(content => content.classList.toggle('active', content.id === activeTab));
                menuCards.forEach(card => card.style.display = 'block');
            }
        });
    }

    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section, header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
            document.body.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
            document.body.classList.remove('scrolled');
        }

        let currentBg = 'var(--bg-color)'; 
        sections.forEach(sec => {
            const secTop = sec.offsetTop - (window.innerHeight / 2.5);
            if (window.scrollY >= secTop) {
                currentBg = sec.getAttribute('data-bg') || 'var(--bg-color)';
            }
        });
        document.body.style.backgroundColor = currentBg;
    });

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    const galleryItems = document.querySelectorAll('.gallery-item img');

    galleryItems.forEach(img => {
        img.addEventListener('click', () => {
            lightboxImg.src = img.src; 
            lightbox.classList.add('show');
        });
    });

    if (closeBtn && lightbox) {
        closeBtn.addEventListener('click', () => lightbox.classList.remove('show'));
        lightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg) lightbox.classList.remove('show');
        });
    }
});