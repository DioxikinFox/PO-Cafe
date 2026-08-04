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

            const normalMenuCards = document.querySelectorAll('.menu-card:not(.promo-card)');
            normalMenuCards.forEach(card => card.style.display = 'block');
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

    // --- 3. SEARCH MENU YANG BERSIH & TEPAT ---
    const searchInput = document.getElementById('searchInput');
    const normalMenuCards = document.querySelectorAll('.menu-card:not(.promo-card)');
    const allSubSections = document.querySelectorAll('.sub-section');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const filterText = e.target.value.toLowerCase().trim();
            
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
                const targetMaster = activeMasterTab ? activeMasterTab.getAttribute('data-target') : 'cat-mains';
                
                categoryWrappers.forEach(wrapper => {
                    const isActive = wrapper.id === targetMaster;
                    wrapper.classList.toggle('active', isActive);
                    if (isActive) {
                        const subTabs = wrapper.querySelectorAll('.sub-tab-btn');
                        subTabs.forEach((st, idx) => {
                            st.classList.toggle('active', idx === 0);
                        });
                        wrapper.querySelectorAll('.sub-section').forEach(sec => {
                            sec.style.display = 'block';
                            sec.classList.add('active');
                        });
                    }
                });

                normalMenuCards.forEach(card => card.style.display = 'block');
                allSubSections.forEach(sec => {
                    sec.style.display = 'block';
                    sec.classList.add('active');
                });
            }
        });
    }

    // --- 4. SCROLL EFFECT & DYNAMIC BACKGROUND ---
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section, header, footer');

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

    // --- 6. MENU MODAL & ANALITIK KLIK MASA NYATA (DIBETULKAN 100%) ---
    const menuModal = document.getElementById('menu-modal');
    const menuModalClose = document.querySelector('.menu-modal-close');
    const modalMediaContainer = document.getElementById('modal-media-container');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalPrice = document.getElementById('modal-price');

    const allCards = document.querySelectorAll('.menu-card');

    allCards.forEach(card => {
        card.addEventListener('click', async (e) => {
            // Halang klik jika status 'Habis'
            if(card.style.pointerEvents === 'none') return;

            const mediaType = card.getAttribute('data-media-type') || 'image';
            const mediaSrc = card.getAttribute('data-media-src') || card.querySelector('img')?.src || '';
            const titleElement = card.querySelector('.card-info h3');
            const descElement = card.querySelector('.card-info .desc');
            const priceElement = card.querySelector('.card-info .price');

            const title = titleElement ? titleElement.innerText.trim() : 'Menu Istimewa';
            const desc = descElement ? descElement.innerText : '';
            const price = priceElement ? priceElement.innerText : '';

            // --- REKOD KLIK ANALITIK (+1) KE FIREBASE ---
            try {
                // 1. Kemaskini Jumlah Global
                const globalClickRef = doc(db, "analytics", "clicksData");
                await setDoc(globalClickRef, {
                    totalClicks: increment(1),
                    topMenu: title // Letak menu terakhir diklik
                }, { merge: true });

                // 2. Kemaskini Statistik Khusus Untuk Setiap Nama Menu 
                // (Setiap kali buka, menu spesifik ini +1)
                const menuStatRef = doc(db, "analytics", "menuClicks");
                await setDoc(menuStatRef, {
                    [title]: increment(1)
                }, { merge: true });
                
                console.log("Klik berjaya direkodkan untuk:", title);
            } catch (error) {
                console.error("Gagal merekod analitik klik:", error);
            }

            if (mediaType === 'video') {
                modalMediaContainer.innerHTML = `<video src="${mediaSrc}" autoplay muted loop playsinline></video>`;
            } else {
                modalMediaContainer.innerHTML = `<img src="${mediaSrc}" alt="${title}">`;
            }

            modalTitle.innerText = title;
            modalDesc.innerText = desc;
            modalPrice.innerText = price;

            menuModal.classList.add('show');
            document.body.style.overflow = 'hidden'; 
        });
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
                let clone = card.cloneNode(true);
                clone.classList.remove('js-focused');
                promoSlider.insertBefore(clone, firstCard);
            });
            
            originalCards.forEach(card => {
                let clone = card.cloneNode(true);
                clone.classList.remove('js-focused');
                promoSlider.appendChild(clone);
            });

            const allCardsSlider = Array.from(promoSlider.querySelectorAll('.promo-card'));

            const observerOptions = {
                root: promoSlider,
                rootMargin: '0px -40% 0px -40%',
                threshold: 0
            };
            const cardObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('js-focused');
                    } else {
                        entry.target.classList.remove('js-focused');
                    }
                });
            }, observerOptions);
            allCardsSlider.forEach(card => cardObserver.observe(card));

            setTimeout(() => {
                const cardWidth = allCardsSlider[0].offsetWidth + 20; 
                const middleSetStart = cardWidth * totalOriginal;
                promoSlider.scrollLeft = middleSetStart;
                
                promoSlider.addEventListener('scroll', () => {
                    const currentScroll = promoSlider.scrollLeft;
                    const maxScroll = promoSlider.scrollWidth - promoSlider.clientWidth;
                    
                    if (currentScroll < cardWidth) {
                        promoSlider.style.scrollSnapType = 'none';
                        promoSlider.scrollLeft += (cardWidth * totalOriginal);
                        setTimeout(() => promoSlider.style.scrollSnapType = 'x mandatory', 50);
                    }
                    else if (currentScroll > maxScroll - cardWidth) {
                        promoSlider.style.scrollSnapType = 'none';
                        promoSlider.scrollLeft -= (cardWidth * totalOriginal);
                        setTimeout(() => promoSlider.style.scrollSnapType = 'x mandatory', 50);
                    }
                });
            }, 100);

            const moveNext = () => {
                const cardWidth = allCardsSlider[0].offsetWidth + 20;
                promoSlider.scrollBy({ left: cardWidth, behavior: 'smooth' });
            };
            const movePrev = () => {
                const cardWidth = allCardsSlider[0].offsetWidth + 20;
                promoSlider.scrollBy({ left: -cardWidth, behavior: 'smooth' });
            };

            const startAutoPlay = () => {
                if(!isAutoPlaying) return;
                autoScrollTimer = setInterval(moveNext, 3500);
            };
            startAutoPlay();

            const rightArrow = document.querySelector('.right-arrow');
            const leftArrow = document.querySelector('.left-arrow');
            
            if(rightArrow) {
                rightArrow.addEventListener('click', () => {
                    isAutoPlaying = false; clearInterval(autoScrollTimer); moveNext();
                });
            }
            if(leftArrow) {
                leftArrow.addEventListener('click', () => {
                    isAutoPlaying = false; clearInterval(autoScrollTimer); movePrev();
                });
            }

            promoSlider.addEventListener('touchstart', () => {
                isAutoPlaying = false; clearInterval(autoScrollTimer);
            }, {passive: true});
        }
    }

    // --- 8. STATUS KEDAI (REAL-TIME DARI ADMIN) ---
    const statusElement = document.getElementById('store-status');
    if(statusElement) {
        onSnapshot(doc(db, "settings", "storeStatus"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const status = data.status; 
                const reason = data.reason || '';

                if (status === 'buka') {
                    statusElement.innerHTML = "🟢 BUKA SEKARANG";
                    statusElement.className = "status-badge open";
                } else if (status === 'tutup') {
                    statusElement.innerHTML = "🔴 KEDAI TUTUP SEKARANG";
                    statusElement.className = "status-badge closed";
                } else if (status === 'cuti') {
                    statusElement.innerHTML = `🟡 KEDAI CUTI: ${reason}`;
                    statusElement.className = "status-badge closed";
                }
            }
        });
    }

    // --- 9. BORANG MAKLUM BALAS PELANGGAN ---
    const feedbackForm = document.getElementById('customer-feedback-form');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('fb-name').value.trim();
            const message = document.getElementById('fb-message').value.trim();

            if (!name || !message) return;

            try {
                await addDoc(collection(db, "feedbacks"), {
                    name: name,
                    message: message,
                    timestamp: new Date().toISOString()
                });
                alert("Terima kasih! Maklum balas anda telah berjaya dihantar kepada pihak pengurusan PO Cafe.");
                feedbackForm.reset();
            } catch (error) {
                console.error(error);
                alert("Gagal menghantar maklum balas. Sila periksa Firestore Security Rules anda.");
            }
        });
    }

    // --- 10. SINKRONISASI STOK & STATUS MENU DARI ADMIN (BARU) ---
    function monitorMenuStockAndStatus() {
        // Mengambil data dari collection "menus" (Tempat admin simpan data)
        onSnapshot(collection(db, "menus"), (snapshot) => {
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const menuNameAdmin = data.name; // Nama menu (Mesti sama dengan ejaan di h3 html)
                const stock = parseInt(data.stock) || 0;
                const status = data.status || 'Ada'; 

                const allCards = document.querySelectorAll('.menu-card');
                allCards.forEach(card => {
                    const titleEl = card.querySelector('.card-info h3');
                    if (titleEl && titleEl.innerText.trim() === menuNameAdmin) {
                        
                        // Buang badge lama jika ada
                        const oldBadge = card.querySelector('.card-stock-badge');
                        if (oldBadge) oldBadge.remove();

                        // Logik Paparan Status / Stok
                        if (status === 'Habis' || stock <= 0) {
                            const badge = document.createElement('span');
                            badge.className = 'card-stock-badge';
                            badge.innerText = 'HABIS';
                            badge.style.backgroundColor = '#d70f64'; // Merah
                            card.style.opacity = '0.4';
                            card.style.pointerEvents = 'none'; // Halang dari klik
                            card.appendChild(badge);
                        } else if (stock > 0 && stock <= 5) {
                            // Jika nak tunjuk stok sikit (contoh: kurang dari 5)
                            const badge = document.createElement('span');
                            badge.className = 'card-stock-badge';
                            badge.innerText = `Sisa: ${stock}`;
                            badge.style.backgroundColor = '#e3a857'; // Oren
                            card.style.opacity = '1';
                            card.style.pointerEvents = 'auto';
                            card.appendChild(badge);
                        } else {
                            // Stok banyak / Available - Buang efek gelap
                            card.style.opacity = '1';
                            card.style.pointerEvents = 'auto';
                        }
                    }
                });
            });
        });
    }
    monitorMenuStockAndStatus();
});