document.addEventListener('DOMContentLoaded', () => {
    // --- KOD ASAL ANDA ---
    // Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Logik Pertukaran Tab Menu
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.category-wrapper');
    const menuCards = document.querySelectorAll('.menu-card');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');

            // Reset semua kad menu kepada gambar asal (buang info)
            menuCards.forEach(c => c.classList.remove('show-info'));

            // Kemaskini Butang Aktif
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Paparkan Kandungan Yang Betul
            contents.forEach(content => {
                content.classList.toggle('active', content.id === target);
            });
        });
    });

    // Logik Papar Maklumat Makanan Apabila Diklik (Asal)
    menuCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('show-info');
        });
    });

    // --- KOD TAMBAHAN BARU ---

    // 1. Logik Scroll (Logo mengecil & Warna Latar Bertukar)
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section, header');

    window.addEventListener('scroll', () => {
        // Efek Navbar dan Logo
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Efek Warna Background Bertukar (Lebih hidup)
        let currentBg = 'var(--bg-color)'; // Default
        sections.forEach(sec => {
            const secTop = sec.offsetTop - (window.innerHeight / 2);
            if (window.scrollY >= secTop) {
                currentBg = sec.getAttribute('data-bg') || 'var(--bg-color)';
            }
        });
        document.body.style.backgroundColor = currentBg;
    });

    // 2. Fungsi Carian Menu (Search)
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const filterText = e.target.value.toLowerCase();
        
        if (filterText.trim() !== '') {
            // Tunjuk semua kategori jika sedang mencari
            contents.forEach(content => content.classList.add('active'));
            
            menuCards.forEach(card => {
                // Cari padanan pada nama atau info makanan
                const itemText = card.textContent.toLowerCase();
                if (itemText.includes(filterText)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        } else {
            // Kembali ke sistem Tab asal bila carian kosong
            const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-target');
            contents.forEach(content => {
                content.classList.toggle('active', content.id === activeTab);
            });
            menuCards.forEach(card => card.style.display = 'block');
        }
    });

    // 3. Logik Lightbox (Klik Gambar Galeri membesar)
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    const galleryItems = document.querySelectorAll('.gallery-item img');

    galleryItems.forEach(img => {
        img.addEventListener('click', () => {
            lightbox.classList.add('show');
            lightboxImg.src = img.src; // Ambil gambar yang sama untuk dibesarkan
        });
    });

    // Tutup bila butang X atau kawasan gelap ditekan
    closeBtn.addEventListener('click', () => lightbox.classList.remove('show'));
    lightbox.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) {
            lightbox.classList.remove('show');
        }
    });
});
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Logik Pertukaran Tab Menu
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.category-wrapper');
    const menuCards = document.querySelectorAll('.menu-card');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');

            // Reset semua kad menu kepada gambar asal (buang info)
            menuCards.forEach(c => c.classList.remove('show-info'));

            // Kemaskini Butang Aktif
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Paparkan Kandungan Yang Betul
            contents.forEach(content => {
                content.classList.toggle('active', content.id === target);
            });
        });
    });

    // Logik Papar Maklumat Makanan Apabila Diklik
    menuCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('show-info');
        });
    });
});