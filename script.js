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

    // --- 6. MENU MODAL (VIDEO DILENGKAPI DENGAN AUTOPLAY, LOOP, TANPA CONTROLS) ---
    const menuModal = document.getElementById('menu-modal');
    const menuModalClose = document.querySelector('.menu-modal-close');
    const modalMediaContainer = document.getElementById('modal-media-container');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalPrice = document.getElementById('modal-price');

    const allCards = document.querySelectorAll('.menu-card');

    allCards.forEach(card => {
        card.addEventListener('click', () => {
            const mediaType = card.getAttribute('data-media-type') || 'image';
            const mediaSrc = card.getAttribute('data-media-src') || card.querySelector('img')?.src || '';
            const title = card.querySelector('.card-info h3').innerText;
            const desc = card.querySelector('.card-info .desc').innerText;
            const price = card.querySelector('.card-info .price').innerText;

            if (mediaType === 'video') {
                // Video dimainkan automatik secara loop dan tanpa button kawalan (controls)
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

    // --- 7. SISTEM SLIDER PROMOSI (INFINITE LOOP & BLUR) ---
    const promoSlider = document.getElementById('promoSlider');
    let isAutoPlaying = true;
    let autoScrollTimer;

    if (promoSlider) {
        const originalCards = Array.from(promoSlider.querySelectorAll('.promo-card'));
        const totalOriginal = originalCards.length;
        
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

        promoSlider.addEventListener('click', (e) => {
            const card = e.target.closest('.promo-card');
            if (!card) return;
            
            isAutoPlaying = false; 
            clearInterval(autoScrollTimer);

            if (!card.classList.contains('js-focused')) {
                const scrollTarget = card.offsetLeft - (promoSlider.clientWidth / 2) + (card.offsetWidth / 2);
                promoSlider.scrollTo({ left: scrollTarget, behavior: 'smooth' });
                return;
            }

            const mediaType = card.getAttribute('data-media-type') || 'image';
            const mediaSrc = card.getAttribute('data-media-src') || card.querySelector('img')?.src || '';
            const title = card.querySelector('.card-info h3').innerText;
            const desc = card.querySelector('.card-info .desc').innerText;
            const price = card.querySelector('.card-info .price').innerText;

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

        promoSlider.addEventListener('touchstart', () => {
            isAutoPlaying = false; clearInterval(autoScrollTimer);
        }, {passive: true});
    }

    // --- 8. STATUS KEDAI (BUKA/TUTUP AUTOMATIK) ---
    const statusElement = document.getElementById('store-status');
    if(statusElement) {
        const now = new Date();
        const day = now.getDay(); 
        const hour = now.getHours(); 

        if (day === 0) {
            statusElement.innerHTML = "🔴 TUTUP HARI INI (Cuti Ahad)";
            statusElement.className = "status-badge closed";
        } 
        else if (hour >= 11 && hour < 22) {
            statusElement.innerHTML = "🟢 BUKA SEKARANG";
            statusElement.className = "status-badge open";
        } 
        else {
            statusElement.innerHTML = "🔴 TUTUP SEKARANG (Operasi: 11AM - 10PM)";
            statusElement.className = "status-badge closed";
        }
    }
});