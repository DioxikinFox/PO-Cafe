import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, addDoc, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDK5sOHxCPB2HmB9CpQSQYW20cqC9rBIjQ",
    authDomain: "pocafe-5ba55.firebaseapp.com",
    projectId: "pocafe-5ba55",
    storageBucket: "pocafe-5ba55.firebasestorage.app",
    messagingSenderId: "119634482868",
    appId: "1:119634482868:web:4bc2424db5bcf0b932e9e1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {

    // --- REKOD PELAWAT (VISITORS) ---
    async function recordVisitor() {
        try {
            const visitorRef = doc(db, "analytics", "visitors");
            await setDoc(visitorRef, { count: increment(1) }, { merge: true });
        } catch (e) {}
    }
    recordVisitor();

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

   // --- ANNOUNCEMENT BAR REAL-TIME (DIPERBAIKI) ---
    function monitorAnnouncement() {
        onSnapshot(doc(db, "settings", "announcement"), (docSnap) => {
            // Support pelbagai jenis ID dan Class HTML yang mungkin admin gunakan
            const bar = document.getElementById('customer-announcement-bar') || document.querySelector('.announcement-bar-wrapper');
            const textSpan = document.getElementById('announcement-content-text') || document.querySelector('.marquee-content');
            if(!bar || !textSpan) return;

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Pastikan ia baca text "true" atau boolean true
                const isActive = (data.isActive === true || data.isActive === "true");
                
                if (isActive && data.text) {
                    if (data.expiryDate) {
                        const today = new Date().toISOString().split('T')[0];
                        if (today > data.expiryDate) {
                            bar.style.display = 'none';
                            return;
                        }
                    }
                    textSpan.innerText = data.text;
                    bar.style.display = 'block';
                } else {
                    bar.style.display = 'none';
                }
            } else {
                bar.style.display = 'none';
            }
        });
    }
    monitorAnnouncement();

    // --- 2. MASTER TABS & SUB-TABS FILTER ---
    const masterTabs = document.querySelectorAll('.master-tabs .tab-btn');
    const categoryWrappers = document.querySelectorAll('.category-wrapper');

    masterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');
            
            const searchInput = document.getElementById('searchInput');
            if(searchInput) searchInput.value = '';

            masterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            categoryWrappers.forEach(wrapper => {
                const isActive = wrapper.id === target;
                wrapper.classList.toggle('active', isActive);
                
                if (isActive) {
                    const subTabs = wrapper.querySelectorAll('.sub-tab-btn');
                    subTabs.forEach((st, idx) => {
                        st.classList.toggle('active', idx === 0);
                    });
                    const subSections = wrapper.querySelectorAll('.sub-section');
                    subSections.forEach(sec => {
                        sec.style.display = 'block';
                        sec.classList.add('active');
                    });
                }
            });

            document.querySelectorAll('.menu-card:not(.promo-card)').forEach(card => card.style.display = 'block');
        });
    });

    document.querySelectorAll('.category-wrapper').forEach(wrapper => {
        const subTabs = wrapper.querySelectorAll('.sub-tab-btn');
        const subSections = wrapper.querySelectorAll('.sub-section');

        subTabs.forEach(subTab => {
            subTab.addEventListener('click', () => {
                const targetSub = subTab.getAttribute('data-sub');

                subTabs.forEach(t => t.classList.remove('active'));
                subTab.classList.add('active');

                if (targetSub.includes('-all')) {
                    subSections.forEach(sec => {
                        sec.style.display = 'block';
                        sec.classList.add('active');
                    });
                } else {
                    subSections.forEach(sec => {
                        if (sec.id === targetSub) {
                            sec.style.display = 'block';
                            sec.classList.add('active');
                        } else {
                            sec.style.display = 'none';
                            sec.classList.remove('active');
                        }
                    });
                }
            });
        });
    });

    // --- 3. FUNGSI CARIAN (SEARCH) ---
    const searchInput = document.getElementById('searchInput');
    
    function applySearchFilter() {
        if(!searchInput) return;
        const filterText = searchInput.value.toLowerCase().trim();
        const normalMenuCards = document.querySelectorAll('.menu-card:not(.promo-card)');
        const allSubSections = document.querySelectorAll('.sub-section');
        
        if (filterText !== '') {
            categoryWrappers.forEach(wrapper => wrapper.classList.add('active'));
            allSubSections.forEach(sec => {
                sec.style.display = 'block';
                sec.classList.add('active');
            });
            
            normalMenuCards.forEach(card => {
                const titleEl = card.querySelector('h3');
                const descEl = card.querySelector('.desc');
                const titleText = titleEl ? titleEl.textContent.toLowerCase() : '';
                const descText = descEl ? descEl.textContent.toLowerCase() : '';
                
                if (titleText.includes(filterText) || descText.includes(filterText)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });

            allSubSections.forEach(sec => {
                const cardsInSec = sec.querySelectorAll('.menu-card');
                let hasVisibleCard = false;
                cardsInSec.forEach(card => {
                    if (card.style.display === 'block') hasVisibleCard = true;
                });
                sec.style.display = hasVisibleCard ? 'block' : 'none';
            });
        } else {
            const activeMasterTab = document.querySelector('.master-tabs .tab-btn.active');
            if(activeMasterTab) activeMasterTab.click(); 
        }
    }

    if (searchInput) searchInput.addEventListener('input', applySearchFilter);

    // --- 4. SCROLL EFFECT & DYNAMIC BACKGROUND ---
    const navbar = document.getElementById('navbar');
    const stickyWrap = document.getElementById('main-header-wrap');
    const sections = document.querySelectorAll('section, header, footer');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
            document.body.classList.add('scrolled');
            if(stickyWrap) stickyWrap.style.boxShadow = "0 4px 20px rgba(0,0,0,0.6)";
        } else {
            navbar.classList.remove('scrolled');
            document.body.classList.remove('scrolled');
            if(stickyWrap) stickyWrap.style.boxShadow = "0 4px 20px rgba(0,0,0,0.4)";
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
    
    document.addEventListener('click', (e) => {
        const img = e.target.closest('.gallery-item img');
        if (img) {
            if(lightboxImg) lightboxImg.src = img.src; 
            if(lightbox) lightbox.classList.add('show');
        }
    });

    // --- 6. MENU MODAL & ANALITIK KLIK ---
    const menuModal = document.getElementById('menu-modal');
    const menuModalClose = document.querySelector('.menu-modal-close');
    const modalMediaContainer = document.getElementById('modal-media-container');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalPrice = document.getElementById('modal-price');

    document.addEventListener('click', async (e) => {
        const card = e.target.closest('.menu-card');
        if (!card) return;
        if(card.style.pointerEvents === 'none') return;

        const mediaType = card.getAttribute('data-media-type') || 'image';
        const mediaSrc = card.getAttribute('data-media-src') || card.querySelector('img')?.src || '';
        const titleElement = card.querySelector('.card-info h3');
        const descElement = card.querySelector('.card-info .desc');
        const priceElement = card.querySelector('.card-info .price');

        const title = titleElement ? titleElement.innerText.trim() : 'Menu Istimewa';
        const desc = descElement ? descElement.innerText : '';
        const price = priceElement ? priceElement.innerText : '';

        try {
            const globalClickRef = doc(db, "analytics", "clicksData");
            await setDoc(globalClickRef, { totalClicks: increment(1), topMenu: title }, { merge: true });

            const menuStatRef = doc(db, "analytics", "menuClicks");
            await setDoc(menuStatRef, { [title]: increment(1) }, { merge: true });
        } catch (error) {}

        if (mediaType === 'video') {
            modalMediaContainer.innerHTML = `<video src="${mediaSrc}" autoplay muted loop playsinline></video>`;
        } else {
            modalMediaContainer.innerHTML = `<img src="${mediaSrc}" alt="${title}" onerror="this.src='https://via.placeholder.com/400?text=Imej+Tiada'">`;
        }

        modalTitle.innerText = title;
        modalDesc.innerText = desc;
        modalPrice.innerText = price;

        menuModal.classList.add('show');
        document.body.style.overflow = 'hidden'; 
    });

    if (closeBtn && lightbox) closeBtn.addEventListener('click', () => lightbox.classList.remove('show'));
    if (menuModalClose && menuModal) {
        menuModalClose.addEventListener('click', () => {
            menuModal.classList.remove('show');
            const modalVideo = modalMediaContainer.querySelector('video');
            if(modalVideo) modalVideo.pause();
            document.body.style.overflow = 'auto';
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.remove('show');
        if (e.target === menuModal) {
            menuModal.classList.remove('show');
            const modalVideo = modalMediaContainer.querySelector('video');
            if(modalVideo) modalVideo.pause();
            document.body.style.overflow = 'auto';
        }
    });

// --- 7. SINKRONISASI PROMOSI (CANTIK SEPERTI ASAL & BEBAS BUG) ---
    onSnapshot(collection(db, "promotions"), (snapshot) => {
        const promoSlider = document.getElementById('promoSlider');
        if(!promoSlider) return;
        
        // 1. Bersihkan timer lama supaya slider tak bergerak makin laju gila
        if (window.autoScrollTimer) {
            clearInterval(window.autoScrollTimer);
            window.autoScrollTimer = null;
        }
        
        let promoHTML = '';
        snapshot.forEach(docSnap => {
            const p = docSnap.data();
            if (p.expiryDate) {
                const today = new Date().toISOString().split('T')[0];
                if (today > p.expiryDate) return; 
            }

            const stock = parseInt(p.stock) || 0;
            
            // Susunan lencana yang lebih kemas
            let badgesHTML = `<div class="promo-badges-container">`;
            badgesHTML += `<span class="promo-tag-badge">${p.badge || 'PROMO'}</span>`;
            
            if (p.stock !== "" && p.stock != null) {
                if (stock <= 0) {
                    badgesHTML += `<span class="card-stock-badge" style="background:#d70f64;">HABIS</span>`;
                } else {
                    badgesHTML += `<span class="card-stock-badge" style="background:#e3a857;">Sisa: ${stock}</span>`;
                }
            }

            if (p.expiryDate) {
                const diffDays = Math.ceil((new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                if (diffDays === 0) {
                    badgesHTML += `<span class="card-expiry-badge" style="color:#e3a857;">Tamat Hari Ini!</span>`;
                } else if (diffDays > 0) {
                    badgesHTML += `<span class="card-expiry-badge" style="color:#e3a857;">${diffDays} Hari Lagi</span>`;
                }
            }
            badgesHTML += `</div>`; 

            const priceText = p.price ? `RM ${p.price}` : 'Harga Berpatutan';

            if (p.type === 'video') {
                promoHTML += `
                    <div class="promo-card menu-card" data-media-type="video" data-media-src="${p.src}">
                        ${badgesHTML}
                        <div class="card-img-wrapper">
                            <video src="${p.src}" autoplay muted loop playsinline></video>
                        </div>
                        <div class="card-info">
                            <h3>${p.title}</h3>
                            <p class="desc">${p.desc || ''}</p>
                            <p class="price">${priceText}</p>
                        </div>
                    </div>
                `;
            } else {
                promoHTML += `
                    <div class="promo-card menu-card" data-media-type="image" data-media-src="${p.src}">
                        ${badgesHTML}
                        <div class="card-img-wrapper">
                            <img src="${p.src}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/280?text=Promo'">
                        </div>
                        <div class="card-info">
                            <h3>${p.title}</h3>
                            <p class="desc">${p.desc || ''}</p>
                            <p class="price">${priceText}</p>
                        </div>
                    </div>
                `;
            }
        });

        // Masukkan data original SAHAJA ke dalam slider
        promoSlider.innerHTML = promoHTML;
        
        // Panggil fungsi asal slider selepas DOM bersedia sikit
        setTimeout(() => {
            initPromoSliderCantik();
        }, 100);
    });

    function initPromoSliderCantik() {
        const promoSlider = document.getElementById('promoSlider');
        if (!promoSlider) return;
        
        // Tangkap kad yang tulen (bukan klon lama)
        const originalCards = Array.from(promoSlider.querySelectorAll('.promo-card:not(.clone-card)'));
        const totalOriginal = originalCards.length;
        
        // Bersihkan klon lama jika ada untuk elak berbaris terlalu panjang (Punca Bug!)
        promoSlider.querySelectorAll('.clone-card').forEach(c => c.remove());

        if(totalOriginal > 0) {
            const firstCard = originalCards[0];
            
            // Buat klon di hadapan
            originalCards.forEach(card => {
                let clone = card.cloneNode(true); 
                clone.classList.remove('js-focused'); 
                clone.classList.add('clone-card'); // Letak tag clone
                promoSlider.insertBefore(clone, firstCard);
            });
            
            // Buat klon di belakang
            originalCards.forEach(card => {
                let clone = card.cloneNode(true); 
                clone.classList.remove('js-focused'); 
                clone.classList.add('clone-card'); // Letak tag clone
                promoSlider.appendChild(clone);
            });

            // Kesan kad yang di tengah untuk bagi terang (js-focused)
            const allCardsSlider = Array.from(promoSlider.querySelectorAll('.promo-card'));
            const cardObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => entry.isIntersecting ? entry.target.classList.add('js-focused') : entry.target.classList.remove('js-focused'));
            }, { root: promoSlider, rootMargin: '0px -40% 0px -40%', threshold: 0 });
            
            allCardsSlider.forEach(card => cardObserver.observe(card));

            setTimeout(() => {
                const cardWidth = allCardsSlider[0].offsetWidth + 20; 
                promoSlider.scrollLeft = cardWidth * totalOriginal;
                
                promoSlider.onscroll = () => {
                    const currentScroll = promoSlider.scrollLeft;
                    const maxScroll = promoSlider.scrollWidth - promoSlider.clientWidth;
                    
                    if (currentScroll < cardWidth) {
                        promoSlider.style.scrollSnapType = 'none'; 
                        promoSlider.scrollLeft += (cardWidth * totalOriginal);
                        setTimeout(() => promoSlider.style.scrollSnapType = 'x mandatory', 50);
                    } else if (currentScroll > maxScroll - cardWidth) {
                        promoSlider.style.scrollSnapType = 'none'; 
                        promoSlider.scrollLeft -= (cardWidth * totalOriginal);
                        setTimeout(() => promoSlider.style.scrollSnapType = 'x mandatory', 50);
                    }
                };
            }, 100);

            const moveNext = () => promoSlider.scrollBy({ left: allCardsSlider[0].offsetWidth + 20, behavior: 'smooth' });
            const movePrev = () => promoSlider.scrollBy({ left: -(allCardsSlider[0].offsetWidth + 20), behavior: 'smooth' });

            // Mengaktifkan semula pergerakan automatik slider dengan selamat
            window.autoScrollTimer = setInterval(moveNext, 3500);

            const rightArrow = document.querySelector('.right-arrow');
            const leftArrow = document.querySelector('.left-arrow');
            
            // Pastikan timer di-reset bila user tekan butang
            if(rightArrow) rightArrow.onclick = () => { clearInterval(window.autoScrollTimer); moveNext(); window.autoScrollTimer = setInterval(moveNext, 3500); };
            if(leftArrow) leftArrow.onclick = () => { clearInterval(window.autoScrollTimer); movePrev(); window.autoScrollTimer = setInterval(moveNext, 3500); };
            
            // Berhenti bila user sentuh dengan jari (mobile)
            promoSlider.ontouchstart = () => clearInterval(window.autoScrollTimer);
            promoSlider.ontouchend = () => window.autoScrollTimer = setInterval(moveNext, 3500);
        }
    }
    // --- 8. STATUS KEDAI DARI DATABASE ---
    const statusElement = document.getElementById('store-status');
    if(statusElement) {
        onSnapshot(doc(db, "settings", "storeStatus"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.status === 'buka') { statusElement.innerHTML = "🟢 BUKA SEKARANG"; statusElement.className = "status-badge open"; } 
                else if (data.status === 'tutup') { statusElement.innerHTML = "🔴 KEDAI TUTUP SEKARANG"; statusElement.className = "status-badge closed"; } 
                else if (data.status === 'cuti') { statusElement.innerHTML = `🟡 KEDAI CUTI: ${data.reason || ''}`; statusElement.className = "status-badge closed"; }
            }
        });
    }

// --- 9. BORANG MAKLUM BALAS (MENYIMPAN PILIHAN BINTANG SEBENAR) ---
    const feedbackForm = document.getElementById('customer-feedback-form');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const ratingInput = document.getElementById('fb-rating');
            // Baca nilai rating dengan paksaan Number (integer)
            const selectedRating = ratingInput ? parseInt(ratingInput.value, 10) : 5; 

            try {
                await addDoc(collection(db, "feedbacks"), {
                    name: document.getElementById('fb-name').value.trim(),
                    rating: selectedRating, 
                    message: document.getElementById('fb-message').value.trim(),
                    timestamp: new Date().toISOString()
                });
                alert("Terima kasih! Maklum balas anda telah berjaya dihantar kepada pihak pengurusan PO Cafe.");
                feedbackForm.reset();
            } catch (error) { alert("Gagal menghantar maklum balas."); }
        });
    }

    // --- 10. SINKRONISASI MENU DARI DATABASE ---
    const categoryMap = {
        'pasta': 'sub-pasta', 'western': 'sub-western', 'kampung': 'sub-kampung', 'gepuk': 'sub-gepuk',
        'breakfast': 'sub-breakfast', 'extra': 'sub-extra', 'kids': 'sub-kids',
        'coffee-selection': 'sub-coffee', 'sparkling-americano': 'sub-sparkling',
        'fizzy-soda': 'sub-fizzy', 'non-coffee': 'sub-non-coffee', 'matcha-series': 'sub-matcha', 'frappe': 'sub-frappe'
    };

    let adminDisplayOptions = { showStock: true, showStatus: true };
    onSnapshot(doc(db, "settings", "displayOptions"), (docSnap) => {
        if (docSnap.exists()) adminDisplayOptions = docSnap.data();
    });

    onSnapshot(collection(db, "menus"), (snapshot) => {
        Object.values(categoryMap).forEach(subId => {
            const grid = document.querySelector(`#${subId} .menu-grid`);
            if(grid) grid.innerHTML = '';
        });

        snapshot.forEach(docSnap => {
            const m = docSnap.data();
            const targetSubId = categoryMap[m.category];
            if (!targetSubId) return;

            const gridContainer = document.querySelector(`#${targetSubId} .menu-grid`);
            if (!gridContainer) return;

            const stock = parseInt(m.stock) || 0;
            const isOutOfStock = m.isOutOfStock || false;
            
            let badgesHTML = '';
            let styleOpacity = '';

            if (adminDisplayOptions.showStatus && (isOutOfStock || (stock <= 0 && m.stock !== "" && m.stock != null))) {
                badgesHTML = `<span class="card-stock-badge" style="background:#d70f64;">HABIS</span>`;
                styleOpacity = 'opacity: 0.4; pointer-events: none;';
            } else if (adminDisplayOptions.showStock && stock > 0) {
                badgesHTML = `<span class="card-stock-badge" style="background:#e3a857;">Sisa: ${stock}</span>`;
            }

            const cardHTML = `
                <div class="menu-card" data-media-type="image" data-media-src="${m.image || ''}" style="${styleOpacity}">
                    ${badgesHTML}
                    <div class="card-img-wrapper">
                        <img src="${m.image || ''}" alt="${m.name}" onerror="this.src='https://via.placeholder.com/250?text=Menu'">
                    </div>
                    <div class="card-info">
                        <h3>${m.name}</h3>
                        <p class="desc">${m.desc || 'Menu Citarasa Istimewa PO Cafe.'}</p>
                        <p class="price">RM ${m.price}</p>
                    </div>
                </div>
            `;
            gridContainer.insertAdjacentHTML('beforeend', cardHTML);
        });
    });

    // --- 11. SINKRONISASI GALERI DARI DATABASE ---
    onSnapshot(collection(db, "gallery"), (snapshot) => {
        const galleryGrid = document.getElementById('customer-gallery-grid');
        if(!galleryGrid) return;
        
        let html = '';
        snapshot.forEach(docSnap => {
            const g = docSnap.data();
            html += `<div class="gallery-item"><img src="${g.imageUrl}" alt="${g.title || 'Galeri Kafe'}"></div>`;
        });
        galleryGrid.innerHTML = html;
    });

    // --- 12. SINKRONISASI MEDIA SOSIAL DARI DATABASE ---
    onSnapshot(doc(db, "settings", "socialLinks"), (docSnap) => {
        if(docSnap.exists()){
            const data = docSnap.data();
            const igLink = document.getElementById('link-ig');
            const tiktokLink = document.getElementById('link-tiktok');
            const fbLink = document.getElementById('link-fb');

            if(igLink) igLink.href = data.instagram || '#';
            if(tiktokLink) tiktokLink.href = data.tiktok || '#';
            if(fbLink) fbLink.href = data.facebook || '#';
        }
    });
});