document.addEventListener('DOMContentLoaded', () => {
    // --- 1. MOBILE MENU TOGGLE ---
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

    // --- 2. MENU TABS FILTER ---
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.category-wrapper');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            contents.forEach(content => {
                content.classList.toggle('active', content.id === target);
            });
        });
    });

    // --- 3. SEARCH MENU ---
    const searchInput = document.getElementById('searchInput');
    const menuCards = document.querySelectorAll('.menu-card');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const filterText = e.target.value.toLowerCase();
            if (filterText.trim() !== '') {
                contents.forEach(content => content.classList.add('active'));
                menuCards.forEach(card => {
                    // Cari tajuk (h3) dan penerangan (.desc) dalam kad
                    const titleText = card.querySelector('h3').textContent.toLowerCase();
                    const descText = card.querySelector('.desc').textContent.toLowerCase();
                    
                    if(titleText.includes(filterText) || descText.includes(filterText)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            } else {
                const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-target');
                contents.forEach(content => content.classList.toggle('active', content.id === activeTab));
                menuCards.forEach(card => card.style.display = 'block');
            }
        });
    }

    // --- 4. SCROLL EFFECT & DYNAMIC BACKGROUND ---
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

    // --- 5. GALLERY LIGHTBOX ---
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

    // --- 6. MENU MODAL (POPUP INFO KIRI & KANAN) ---
    const menuModal = document.getElementById('menu-modal');
    const menuModalClose = document.querySelector('.menu-modal-close');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalPrice = document.getElementById('modal-price');

    // Buka modal apabila kad menu ditekan
    menuCards.forEach(card => {
        card.addEventListener('click', () => {
            const imgSrc = card.querySelector('.card-img-wrapper img').src;
            const title = card.querySelector('.card-info h3').innerText;
            const desc = card.querySelector('.card-info .desc').innerText;
            const price = card.querySelector('.card-info .price').innerText;

            modalImg.src = imgSrc;
            modalTitle.innerText = title;
            modalDesc.innerText = desc;
            modalPrice.innerText = price;

            menuModal.classList.add('show');
            document.body.style.overflow = 'hidden'; 
        });
    });

    // Tutup pelbagai Modal & Lightbox
    if (closeBtn && lightbox) {
        closeBtn.addEventListener('click', () => lightbox.classList.remove('show'));
    }
    
    if (menuModalClose && menuModal) {
        menuModalClose.addEventListener('click', () => {
            menuModal.classList.remove('show');
            document.body.style.overflow = 'auto';
        });
    }

    // Tutup jika klik kawasan luar popup
    window.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('show');
        }
        if (e.target === menuModal) {
            menuModal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    });
});