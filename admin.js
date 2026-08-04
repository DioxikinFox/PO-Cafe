import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. SISTEM TAB SIDEBAR ---
    const sidebarItems = document.querySelectorAll('.sidebar-menu li');
    const adminSections = document.querySelectorAll('.admin-section');
    let chartRendered = false;

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            sidebarItems.forEach(li => li.classList.remove('active'));
            item.classList.add('active');

            adminSections.forEach(section => section.classList.remove('active'));
            const targetId = item.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'tab-analitik' && !chartRendered) {
                renderGrafAnalitik();
                chartRendered = true;
            }
        });
    });

    // --- 2. KAWALAN STATUS KEDAI ---
    const toggleBukaTutup = document.getElementById('toggle-buka-tutup');
    const statusText = document.getElementById('status-text');

    async function loadStoreStatus() {
        try {
            const docSnap = await getDoc(doc(db, "settings", "storeStatus"));
            if (docSnap.exists()) {
                const isOpen = docSnap.data().isOpen;
                if(toggleBukaTutup) toggleBukaTutup.checked = isOpen;
                updateStatusUI(isOpen);
            }
        } catch (e) { console.error(e); }
    }
    loadStoreStatus();

    function updateStatusUI(isOpen) {
        if(!statusText) return;
        statusText.innerText = isOpen ? "KEDAI BUKA" : "KEDAI TUTUP";
        statusText.className = isOpen ? "status-indicator status-buka" : "status-indicator status-tutup";
    }

    if (toggleBukaTutup) {
        toggleBukaTutup.addEventListener('change', async function() {
            const isOpen = this.checked;
            updateStatusUI(isOpen);
            await setDoc(doc(db, "settings", "storeStatus"), { isOpen: isOpen }, { merge: true });
        });
    }

    // --- 2.1 SIMPAN PENGUMUMAN ---
    const btnSaveAnnouncement = document.getElementById('btn-save-announcement');
    const announcementInput = document.getElementById('announcement-text');
    const toggleAnnouncement = document.getElementById('toggle-announcement');

    async function loadAnnouncement() {
        try {
            const docSnap = await getDoc(doc(db, "settings", "announcement"));
            if (docSnap.exists() && announcementInput && toggleAnnouncement) {
                announcementInput.value = docSnap.data().text || "";
                toggleAnnouncement.checked = docSnap.data().isActive || false;
            }
        } catch (e) { console.error(e); }
    }
    loadAnnouncement();

    if (btnSaveAnnouncement) {
        btnSaveAnnouncement.addEventListener('click', async () => {
            await setDoc(doc(db, "settings", "announcement"), {
                text: announcementInput.value,
                isActive: toggleAnnouncement.checked
            }, { merge: true });
            alert("Pengumuman berjaya disimpan!");
        });
    }

    // --- 3. PENGURUSAN MENU (CRUD) BERDASARKAN KATEGORI ---
    const menuModal = document.getElementById('menu-modal');
    const btnOpenMenuModal = document.getElementById('btn-open-menu-modal');
    const btnCloseMenuModal = document.getElementById('btn-close-menu-modal');
    const btnSaveMenuDb = document.getElementById('btn-save-menu-db');

    const menuEditId = document.getElementById('menu-edit-id');
    const modalMenuTitle = document.getElementById('modal-menu-title');
    const menuNameInput = document.getElementById('menu-name-input');
    const menuCatInput = document.getElementById('menu-cat-input');
    const menuPriceInput = document.getElementById('menu-price-input');
    const menuImgInput = document.getElementById('menu-img-input');

    // Fungsi muat turun dan tapis menu mengikut sub-tab kategori aktif
    window.fetchMenusFromDatabase = async function() {
        const activeSubTab = document.querySelector('.sub-tab-btn.active');
        const targetCat = activeSubTab ? activeSubTab.getAttribute('data-subcat') : 'sub-utama';
        
        let targetCategoryKey = 'mains';
        let tableBodyId = 'table-utama';

        if (targetCat === 'sub-utama') {
            targetCategoryKey = 'mains';
            tableBodyId = 'table-utama';
        } else if (targetCat === 'sub-sarapan') {
            targetCategoryKey = 'breakfast';
            tableBodyId = 'table-sarapan';
        } else if (targetCat === 'sub-kopi') {
            targetCategoryKey = 'coffee';
            tableBodyId = 'table-kopi';
        } else if (targetCat === 'sub-minuman') {
            targetCategoryKey = 'beverages';
            tableBodyId = 'table-minuman';
        }

        const menuTableBody = document.getElementById(tableBodyId);
        if (!menuTableBody) return;
        menuTableBody.innerHTML = "";

        try {
            const querySnapshot = await getDocs(collection(db, "menus"));
            querySnapshot.forEach((docSnap) => {
                const item = docSnap.data();
                const id = docSnap.id;
                
                // Bandingkan kategori item dengan kategori yang sedang dipilih
                if (item.category === targetCategoryKey) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><img src="${item.image || 'BahanBaru/ayamgepuk.jpeg'}" width="40" height="40" style="border-radius:5px; object-fit:cover;"></td>
                        <td><strong>${item.name}</strong></td>
                        <td>${item.category}</td>
                        <td>RM ${item.price}</td>
                        <td>
                            <button class="btn-edit" type="button" onclick="openEditMenuModal('${id}', '${item.name}', '${item.category}', '${item.price}', '${item.image || ''}')">Edit</button> 
                            <button class="btn-delete" type="button" onclick="deleteMenuDb('${id}')">Padam</button>
                        </td>
                    `;
                    menuTableBody.appendChild(tr);
                }
            });
        } catch (e) { console.error(e); }
    };
    fetchMenusFromDatabase();

    if (btnOpenMenuModal) {
        btnOpenMenuModal.addEventListener('click', () => {
            menuEditId.value = "";
            modalMenuTitle.innerText = "Tambah Menu Baru";
            menuNameInput.value = "";
            menuPriceInput.value = "";
            menuImgInput.value = "";
            menuModal.style.display = 'flex';
        });
    }

    if (btnCloseMenuModal) {
        btnCloseMenuModal.addEventListener('click', () => { 
            menuModal.style.display = 'none'; 
        });
    }

    window.openEditMenuModal = function(id, name, category, price, image) {
        menuEditId.value = id;
        modalMenuTitle.innerText = "Kemaskini / Edit Menu";
        menuNameInput.value = name;
        menuCatInput.value = category;
        menuPriceInput.value = price;
        menuImgInput.value = image;
        menuModal.style.display = 'flex';
    };

    if (btnSaveMenuDb) {
        btnSaveMenuDb.addEventListener('click', async () => {
            const id = menuEditId.value;
            const name = menuNameInput.value.trim();
            const category = menuCatInput.value;
            const price = menuPriceInput.value.trim();
            const image = menuImgInput.value.trim();

            if (!name || !price) {
                alert("Sila isi nama dan harga!");
                return;
            }

            try {
                if (id === "") {
                    await addDoc(collection(db, "menus"), { name, category, price, image });
                    alert("Menu berjaya ditambah!");
                } else {
                    await updateDoc(doc(db, "menus", id), { name, category, price, image });
                    alert("Menu berjaya dikemaskini!");
                }
                menuModal.style.display = 'none';
                fetchMenusFromDatabase();
            } catch (e) {
                console.error(e);
                alert("Gagal simpan ke database.");
            }
        });
    }

    window.deleteMenuDb = async function(id) {
        if (confirm("Adakah anda pasti mahu memadam menu ini?")) {
            try {
                await deleteDoc(doc(db, "menus", id));
                alert("Menu berjaya dipadam.");
                fetchMenusFromDatabase();
            } catch (e) { alert("Gagal padam."); }
        }
    };

    // --- 4. PENGURUSAN PROMOSI ---
    const promoModal = document.getElementById('promo-modal');
    const btnOpenPromoModal = document.getElementById('btn-open-promo-modal');
    const btnClosePromoModal = document.getElementById('btn-close-promo-modal');
    const btnSavePromoDb = document.getElementById('btn-save-promo-db');

    const promoTitleInput = document.getElementById('promo-title-input');
    const promoTypeInput = document.getElementById('promo-type-input');
    const promoBadgeInput = document.getElementById('promo-badge-input');
    const promoSrcInput = document.getElementById('promo-src-input');

    window.fetchPromotions = async function() {
        const promoTableBody = document.getElementById('promo-table-body');
        if (!promoTableBody) return;
        promoTableBody.innerHTML = "";
        try {
            const querySnapshot = await getDocs(collection(db, "promotions"));
            querySnapshot.forEach((docSnap) => {
                const item = docSnap.data();
                const id = docSnap.id;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.type === 'video' ? '<video src="'+item.src+'" width="50" muted></video>' : '<img src="'+item.src+'" width="40" height="40" style="object-fit:cover; border-radius:5px;">'}</td>
                    <td><strong>${item.title}</strong></td>
                    <td><span class="badge ${item.type === 'video' ? 'badge-video' : ''}">${item.type}</span></td>
                    <td>${item.badge}</td>
                    <td><button class="btn-delete" type="button" onclick="deletePromoDb('${id}')">Padam</button></td>
                `;
                promoTableBody.appendChild(tr);
            });
        } catch (e) { console.error(e); }
    };
    fetchPromotions();

    if (btnOpenPromoModal) {
        btnOpenPromoModal.addEventListener('click', () => {
            promoTitleInput.value = "";
            promoBadgeInput.value = "";
            promoSrcInput.value = "";
            promoModal.style.display = 'flex';
        });
    }

    if (btnClosePromoModal) {
        btnClosePromoModal.addEventListener('click', () => { promoModal.style.display = 'none'; });
    }

    if (btnSavePromoDb) {
        btnSavePromoDb.addEventListener('click', async () => {
            const title = promoTitleInput.value.trim();
            const type = promoTypeInput.value;
            const badge = promoBadgeInput.value.trim();
            const src = promoSrcInput.value.trim();

            if (!title || !src) {
                alert("Sila isi tajuk dan pautan fail media.");
                return;
            }

            try {
                await addDoc(collection(db, "promotions"), { title, type, badge, src });
                alert("Promosi berjaya ditambah!");
                promoModal.style.display = 'none';
                fetchPromotions();
            } catch (e) { alert("Gagal simpan promosi."); }
        });
    }

    window.deletePromoDb = async function(id) {
        if (confirm("Padam promosi ini?")) {
            await deleteDoc(doc(db, "promotions", id));
            fetchPromotions();
        }
    };

    // --- 5. FILTER MAKLUM BALAS ---
    const filterBtns = document.querySelectorAll('.btn-filter');
    const feedbackItems = document.querySelectorAll('.feedback-item');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterType = btn.getAttribute('data-filter');
            feedbackItems.forEach(item => {
                if (filterType === 'semua') item.style.display = 'block';
                else if (filterType === 'positif' && item.classList.contains('rating-positif')) item.style.display = 'block';
                else if (filterType === 'negatif' && item.classList.contains('rating-negatif')) item.style.display = 'block';
                else item.style.display = 'none';
            });
        });
    });

    // --- 8. SUB-TAB KATEGORI URUS MENU ---
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');
    const subCatContents = document.querySelectorAll('.subcat-content');
    
    subTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            subTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetCat = btn.getAttribute('data-subcat');
            
            subCatContents.forEach(content => {
                content.style.display = (content.id === targetCat) ? 'block' : 'none';
            });

            // Muat semula data mengikut sub-tab yang dipilih
            fetchMenusFromDatabase();
        });
    });

});

// --- 6. GRAF ANALITIK ---
function renderGrafAnalitik() {
    const canvasEl = document.getElementById('kategoriChart');
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Hidangan Utama', 'Ayam Gepuk', 'Kopi & Espresso', 'Minuman Segar', 'Sarapan & Snek'],
            datasets: [{
                label: 'Jumlah Klik Pelanggan (Bulan Ini)',
                data: [420, 650, 310, 290, 150],
                backgroundColor: ['#74a779', '#a67c52', '#3d5a80', '#e3a857', '#d70f64'],
                borderRadius: 6
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
    });
}

// --- 7. LOG MASUK & KELUAR ---
window.loginKhas = async function() {
    const email = document.getElementById('admin-email').value.trim();
    const pass = document.getElementById('admin-pass').value.trim();
    const errorMsg = document.getElementById('login-error-msg');
    if (errorMsg) errorMsg.style.display = 'none';

    if (!email || !pass) {
        if (errorMsg) {
            errorMsg.innerText = "Sila lengkapkan e-mel dan kata laluan!";
            errorMsg.style.display = 'block';
        } else {
            alert("Sila lengkapkan e-mel dan kata laluan!");
        }
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        berjayaMasukAnimasi();
    } catch (error) {
        let mesej = "E-mel atau kata laluan salah!";
        if (error.code === 'auth/invalid-email') mesej = "Format e-mel tidak sah!";
        else if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') mesej = "E-mel tidak berdaftar atau kata laluan salah!";
        
        if (errorMsg) {
            errorMsg.innerText = mesej;
            errorMsg.style.display = 'block';
        } else {
            alert(mesej);
        }
    }
}

function berjayaMasukAnimasi() {
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('admin-dashboard');
    if(!loginScreen || !dashboard) return;
    loginScreen.classList.add('fade-out');
    setTimeout(() => {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'flex';
        setTimeout(() => dashboard.classList.add('fade-in'), 50);
    }, 500);
}

window.logoutKhas = async function() {
    try { await signOut(auth); } catch (e) {}
    const dashboard = document.getElementById('admin-dashboard');
    if (dashboard) dashboard.classList.remove('fade-in');
    setTimeout(() => window.location.reload(), 400);
}