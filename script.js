import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, onSnapshot, addDoc, getDoc, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

    // --- ANNOUNCEMENT BAR REAL-TIME ---
    function monitorAnnouncement() {
        onSnapshot(doc(db, "settings", "announcement"), (docSnap) => {
            const bar = document.getElementById('customer-announcement-bar');
            const textSpan = document.getElementById('announcement-content-text');
            if(!bar || !textSpan) return;

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.isActive && data.text) {
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

            // Tunjukkan balik semua kad kecuali yang disorok sistem (kerana ditukar nama)
            document.querySelectorAll('.menu-card:not(.promo-card):not(.deleted-by-admin)').forEach(card => card.style.display = 'block');
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

    // --- 3. FUNGSI CARIAN (SEARCH) YANG DIKEMASKINI ---
    const searchInput = document.getElementById('searchInput');
    
    function applySearchFilter() {
        if(!searchInput) return;
        const filterText = searchInput.value.toLowerCase().trim();
        
        // Jangan libatkan kad yang dipadam/disorok oleh Admin
        const normalMenuCards = document.querySelectorAll('.menu-card:not(.promo-card):not(.deleted-by-admin)');
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
                const cardsInSec = sec.querySelectorAll('.menu-card:not(.deleted-by-admin)');
                let hasVisibleCard = false;
                cardsInSec.forEach(card => {
                    if (card.style.display === 'block') {
                        hasVisibleCard = true;
                    }
                });

                if (hasVisibleCard) {
                    sec.style.display = 'block';
                } else {
                    sec.style.display = 'none';
                }
            });

        } else {
            const activeMasterTab = document.querySelector('.master-tabs .tab-btn.active');
            if(activeMasterTab) activeMasterTab.click(); 
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', applySearchFilter);
    }

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
    
    // Kita guna event delegation untuk galeri supaya imej baharu dari admin pun boleh diklik
    document.addEventListener('click', (e) => {
        const img = e.target.closest('.gallery-item img');
        if (img) {
            if(lightboxImg) lightboxImg.src = img.src; 
            if(lightbox) lightbox.classList.add('show');
        }
    });

    // --- 6. MENU MODAL & ANALITIK KLIK (EVENT DELEGATION) ---
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

        // REKOD KLIK KE FIREBASE
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

    // --- 7. SISTEM SLIDER PROMOSI (INFINITE LOOP) ---
    const promoSlider = document.getElementById('promoSlider');
    let isAutoPlaying = true;
    let autoScrollTimer;

    if (promoSlider) {
        const originalCards = Array.from(promoSlider.querySelectorAll('.promo-card'));
        const totalOriginal = originalCards.length;
        
        if(totalOriginal > 0) {
            const firstCard = originalCards[0];
            originalCards.forEach(card => {
                let clone = card.cloneNode(true); clone.classList.remove('js-focused'); promoSlider.insertBefore(clone, firstCard);
            });
            originalCards.forEach(card => {
                let clone = card.cloneNode(true); clone.classList.remove('js-focused'); promoSlider.appendChild(clone);
            });

            const allCardsSlider = Array.from(promoSlider.querySelectorAll('.promo-card'));
            const cardObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => entry.isIntersecting ? entry.target.classList.add('js-focused') : entry.target.classList.remove('js-focused'));
            }, { root: promoSlider, rootMargin: '0px -40% 0px -40%', threshold: 0 });
            
            allCardsSlider.forEach(card => cardObserver.observe(card));

            setTimeout(() => {
                const cardWidth = allCardsSlider[0].offsetWidth + 20; 
                promoSlider.scrollLeft = cardWidth * totalOriginal;
                
                promoSlider.addEventListener('scroll', () => {
                    const currentScroll = promoSlider.scrollLeft;
                    const maxScroll = promoSlider.scrollWidth - promoSlider.clientWidth;
                    if (currentScroll < cardWidth) {
                        promoSlider.style.scrollSnapType = 'none'; promoSlider.scrollLeft += (cardWidth * totalOriginal);
                        setTimeout(() => promoSlider.style.scrollSnapType = 'x mandatory', 50);
                    } else if (currentScroll > maxScroll - cardWidth) {
                        promoSlider.style.scrollSnapType = 'none'; promoSlider.scrollLeft -= (cardWidth * totalOriginal);
                        setTimeout(() => promoSlider.style.scrollSnapType = 'x mandatory', 50);
                    }
                });
            }, 100);

            const moveNext = () => promoSlider.scrollBy({ left: allCardsSlider[0].offsetWidth + 20, behavior: 'smooth' });
            const movePrev = () => promoSlider.scrollBy({ left: -(allCardsSlider[0].offsetWidth + 20), behavior: 'smooth' });

            autoScrollTimer = setInterval(moveNext, 3500);

            const rightArrow = document.querySelector('.right-arrow');
            const leftArrow = document.querySelector('.left-arrow');
            
            if(rightArrow) rightArrow.addEventListener('click', () => { isAutoPlaying = false; clearInterval(autoScrollTimer); moveNext(); });
            if(leftArrow) leftArrow.addEventListener('click', () => { isAutoPlaying = false; clearInterval(autoScrollTimer); movePrev(); });
            promoSlider.addEventListener('touchstart', () => { isAutoPlaying = false; clearInterval(autoScrollTimer); }, {passive: true});
        }
    }

    // --- 8. STATUS KEDAI (REAL-TIME DARI ADMIN) ---
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

    // --- 9. BORANG MAKLUM BALAS PELANGGAN ---
    const feedbackForm = document.getElementById('customer-feedback-form');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await addDoc(collection(db, "feedbacks"), {
                    name: document.getElementById('fb-name').value.trim(),
                    message: document.getElementById('fb-message').value.trim(),
                    timestamp: new Date().toISOString()
                });
                alert("Terima kasih! Maklum balas anda telah berjaya dihantar kepada pihak pengurusan PO Cafe.");
                feedbackForm.reset();
            } catch (error) { alert("Gagal menghantar maklum balas."); }
        });
    }

    // --- 10. PENYELESAIAN MASALAH NAMA & HARGA (SYNC DENGAN ADMIN 100%) ---
    let adminDisplayOptions = { showStock: true, showExpiry: true, showStatus: true };

    onSnapshot(doc(db, "settings", "displayOptions"), (docSnap) => {
        if (docSnap.exists()) { adminDisplayOptions = docSnap.data(); }
        refreshMenuDisplay(); 
    });

    let currentMenusData = [];
    onSnapshot(collection(db, "menus"), (snapshot) => {
        currentMenusData = [];
        snapshot.forEach(docSnap => currentMenusData.push(docSnap.data()));
        refreshMenuDisplay();
    });

    // Peta Kategori Admin kepada ID grid di dalam HTML
    const categoryMap = {
        'pasta': 'sub-pasta', 'western': 'sub-western', 'kampung': 'sub-kampung', 'gepuk': 'sub-gepuk',
        'breakfast': 'sub-breakfast', 'extra': 'sub-extra', 'kids': 'sub-kids',
        'coffee-selection': 'sub-coffee', 'sparkling-americano': 'sub-sparkling',
        'fizzy-soda': 'sub-fizzy', 'non-coffee': 'sub-non-coffee', 'matcha-series': 'sub-matcha', 'frappe': 'sub-frappe'
    };

    function refreshMenuDisplay() {
        const allCards = document.querySelectorAll('.menu-card:not(.promo-card)');
        
        // BAHAGIAN A: SEMAK KAD HTML ASAL (KEMASKINI ATAU SOROK)
        allCards.forEach(card => {
            const titleEl = card.querySelector('.card-info h3');
            if (!titleEl) return;
            
            const menuNameHTML = titleEl.textContent.trim();
            const dbMenu = currentMenusData.find(m => m.name === menuNameHTML);
            
            // Buang lencana lama untuk render semula
            const oldBadge = card.querySelector('.card-stock-badge');
            if (oldBadge) oldBadge.remove();

            if (dbMenu) {
                // Makanan Wujud Di Admin: Kita Kemaskini Harga dan Tunjukkan
                card.style.display = ''; 
                card.classList.remove('deleted-by-admin');

                // KEMASKINI HARGA TERUS DARI ADMIN
                const priceEl = card.querySelector('.card-info .price');
                if (priceEl && dbMenu.price) {
                    if (priceEl.textContent.includes('from')) {
                        priceEl.textContent = `from RM ${dbMenu.price}`;
                    } else {
                        priceEl.textContent = `RM ${dbMenu.price}`;
                    }
                }

                // KEMASKINI STOK & STATUS
                const stock = parseInt(dbMenu.stock) || 0;
                const isOutOfStock = dbMenu.isOutOfStock || false;

                if (adminDisplayOptions.showStatus && (isOutOfStock || (stock <= 0 && dbMenu.stock !== "" && dbMenu.stock != null))) {
                    const badge = document.createElement('span');
                    badge.className = 'card-stock-badge';
                    badge.innerText = 'HABIS';
                    badge.style.backgroundColor = '#d70f64'; 
                    card.style.opacity = '0.4';
                    card.style.pointerEvents = 'none'; 
                    card.appendChild(badge);
                } else if (adminDisplayOptions.showStock && stock > 0) {
                    const badge = document.createElement('span');
                    badge.className = 'card-stock-badge';
                    badge.innerText = `Sisa: ${stock}`;
                    badge.style.backgroundColor = '#e3a857'; 
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'auto';
                    card.appendChild(badge);
                } else {
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'auto';
                }
            } else {
                // JIKA NAMA SUDAH DIUBAH ATAU DIPADAM DI ADMIN: Kita SOROK kad asal (Elak Duplicate)
                card.style.display = 'none';
                card.classList.add('deleted-by-admin');
            }
        });

        // BAHAGIAN B: TAMBAH KAD BAHARU (ATAU KAD YANG NAMANYA BARU DIUBAH)
        currentMenusData.forEach(dbMenu => {
            let isMenuExist = false;
            
            // Periksa H3 pada kad yang TIDAK disorok sahaja
            document.querySelectorAll('.menu-card:not(.deleted-by-admin) h3').forEach(h3 => {
                if (h3.textContent.trim() === dbMenu.name) {
                    isMenuExist = true;
                }
            });

            // Jika tiada dalam skrin HTML, kita bina kad baharu!
            if (!isMenuExist) {
                const targetSubId = categoryMap[dbMenu.category];
                if (targetSubId) {
                    const gridContainer = document.querySelector(`#${targetSubId} .menu-grid`);
                    if (gridContainer) {
                        const stock = parseInt(dbMenu.stock) || 0;
                        const isOutOfStock = dbMenu.isOutOfStock || false;
                        
                        let badgesHTML = '';
                        let styleOpacity = '';

                        if (adminDisplayOptions.showStatus && (isOutOfStock || (stock <= 0 && dbMenu.stock !== "" && dbMenu.stock != null))) {
                            badgesHTML = `<span class="card-stock-badge" style="background:#d70f64;">HABIS</span>`;
                            styleOpacity = 'opacity: 0.4; pointer-events: none;';
                        } else if (adminDisplayOptions.showStock && stock > 0) {
                            badgesHTML = `<span class="card-stock-badge" style="background:#e3a857;">Sisa: ${stock}</span>`;
                        }

                        // Bina kod HTML baru dan selit terus
                        const newCardHTML = `
                            <div class="menu-card dynamic-added" data-media-type="image" data-media-src="${dbMenu.image || ''}" style="${styleOpacity}">
                                ${badgesHTML}
                                <div class="card-img-wrapper">
                                    <img src="${dbMenu.image || ''}" alt="${dbMenu.name}" onerror="this.src='https://via.placeholder.com/250?text=Menu+Baru'">
                                </div>
                                <div class="card-info">
                                    <h3>${dbMenu.name}</h3>
                                    <p class="desc">Menu Citarasa Istimewa PO Cafe.</p>
                                    <p class="price">RM ${dbMenu.price}</p>
                                </div>
                            </div>
                        `;
                        gridContainer.insertAdjacentHTML('beforeend', newCardHTML);
                    }
                }
            }
        });
        
        // Panggil semula logik tapisan jika pengguna sedang buat carian (search)
        applySearchFilter();
    }

    // --- 11. SINKRONISASI GALERI DARI ADMIN ---
    onSnapshot(collection(db, "gallery"), (snapshot) => {
        const galleryGrid = document.querySelector('.gallery-grid');
        if(!galleryGrid) return;
        
        let hasData = false;
        let html = '';
        snapshot.forEach(docSnap => {
            hasData = true;
            html += `<div class="gallery-item"><img src="${docSnap.data().imageUrl}" alt="Galeri Kafe"></div>`;
        });
        
        if(hasData) {
            galleryGrid.innerHTML = html;
        }
    });

    // --- 12. SINKRONISASI MEDIA SOSIAL DARI ADMIN ---
    onSnapshot(doc(db, "settings", "socialMedia"), (docSnap) => {
        if(docSnap.exists()){
            const data = docSnap.data();
            const igLink = document.getElementById('link-ig');
            const tiktokLink = document.getElementById('link-tiktok');
            if(igLink && data.instagram) igLink.href = data.instagram;
            if(tiktokLink && data.tiktok) tiktokLink.href = data.tiktok;
        }
    });
});