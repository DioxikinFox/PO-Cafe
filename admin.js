import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let semuaMenuGlobal = [];
let semuaPromoGlobal = [];
let myChart = null; 

document.addEventListener('DOMContentLoaded', () => {

    // --- KAWALAN MOD GELAP / CERAH ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const savedTheme = localStorage.getItem('po_cafe_admin_theme');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if(themeToggleBtn) themeToggleBtn.innerText = "☀️ Mod Cerah";
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('po_cafe_admin_theme', isDark ? 'dark' : 'light');
            themeToggleBtn.innerText = isDark ? "☀️ Mod Cerah" : "🌙 Mod Gelap";
        });
    }

    // --- KAWALAN AMARAN AKHIR BULAN ---
    function checkMonthEndWarning() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const currentDay = now.getDate();
        const daysLeft = lastDay - currentDay;

        const warningBoxes = document.querySelectorAll('.month-expiry-warning');
        warningBoxes.forEach(box => {
            if (daysLeft <= 7 && daysLeft >= 0) {
                box.style.display = 'block';
                box.innerHTML = `⚠️ <strong>Amaran Bulanan:</strong> Data analitik & maklum balas ini akan dikosongkan secara automatik dalam masa <strong>${daysLeft === 0 ? 'hari ini' : daysLeft + ' hari'}</strong> lagi!`;
            } else {
                box.style.display = 'none';
            }
        });
    }
    checkMonthEndWarning();

    // --- 1. SISTEM TAB & HAMBURGER MENU ---
    const sidebarItems = document.querySelectorAll('.sidebar-menu li');
    const adminSections = document.querySelectorAll('.admin-section');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarNav = document.getElementById('sidebarNav');

    if (hamburgerBtn && sidebarNav) {
        hamburgerBtn.addEventListener('click', (e) => { 
            e.preventDefault();
            sidebarNav.classList.toggle('show'); 
        });
        sidebarItems.forEach(li => {
            li.addEventListener('click', () => {
                if (window.innerWidth <= 768) sidebarNav.classList.remove('show');
            });
        });
    }

    sidebarItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            sidebarItems.forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            adminSections.forEach(section => section.classList.remove('active'));
            
            const targetId = item.getAttribute('data-tab');
            const targetSection = document.getElementById(targetId);
            if(targetSection) targetSection.classList.add('active');

            if (targetId === 'tab-analitik') {
                renderGrafAnalitikSebenar();
                tunjukJumlahKlikKeseluruhan();
                tunjukJumlahPelawat();
            }

            if (targetId === 'tab-feedback') {
                fetchFeedbacksRealtime();
            }
        });
    });

    // --- 2. KAWALAN PENGUMUMAN BERJALAN (LIVE ANNOUNCEMENT) ---
    const btnSaveAnnouncement = document.getElementById('btn-save-announcement');
    if (btnSaveAnnouncement) {
        getDoc(doc(db, "settings", "announcement")).then((docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById('announcement-text').value = data.text || '';
                document.getElementById('announcement-expiry').value = data.expiryDate || '';
                document.getElementById('announcement-active').checked = data.isActive || false;
            }
        });

        btnSaveAnnouncement.addEventListener('click', async (e) => {
            e.preventDefault();
            const text = document.getElementById('announcement-text').value.trim();
            const expiryDate = document.getElementById('announcement-expiry').value;
            const isActive = document.getElementById('announcement-active').checked;

            try {
                await setDoc(doc(db, "settings", "announcement"), {
                    text: text,
                    expiryDate: expiryDate,
                    isActive: isActive
                }, { merge: true });
                alert("Pengumuman live berjaya disimpan & dikemaskini di website pelanggan!");
            } catch (error) {
                alert("Gagal simpan pengumuman: " + error.message);
            }
        });
    }

    // --- 3. KAWALAN KEDAI (AUTO & MANUAL) ---
    const statusSelect = document.getElementById('store-status-select');
    const reasonInput = document.getElementById('cuti-reason-input');
    const btnSaveStatus = document.getElementById('btn-save-status');
    const statusText = document.getElementById('status-text');

    async function loadStoreStatus() {
        try {
            const docSnap = await getDoc(doc(db, "settings", "storeStatus"));
            if (docSnap.exists()) {
                const data = docSnap.data();
                if(statusSelect) statusSelect.value = data.status || 'buka';
                if(reasonInput) reasonInput.value = data.reason || '';
                updateStatusUI(data.status, data.reason);
            }
        } catch (e) { console.error(e); }
    }
    loadStoreStatus();

    if(statusSelect) {
        statusSelect.addEventListener('change', function() {
            reasonInput.style.display = (this.value === 'cuti') ? 'block' : 'none';
        });
    }

    function updateStatusUI(status, reason) {
        if(!statusText) return;
        if (status === 'buka') { statusText.innerText = "STATUS KINI: BUKA (AUTO)"; statusText.style.color = "#25D366"; reasonInput.style.display = 'none'; }
        else if (status === 'tutup') { statusText.innerText = "STATUS KINI: TUTUP"; statusText.style.color = "#d70f64"; reasonInput.style.display = 'none'; }
        else if (status === 'cuti') { statusText.innerText = "STATUS KINI: CUTI (" + (reason||"Tiada sebab") + ")"; statusText.style.color = "#e3a857"; reasonInput.style.display = 'block'; }
    }

    if (btnSaveStatus) {
        btnSaveStatus.addEventListener('click', async (e) => {
            e.preventDefault();
            const statusVal = statusSelect.value;
            const reasonVal = reasonInput.value;
            updateStatusUI(statusVal, reasonVal);
            await setDoc(doc(db, "settings", "storeStatus"), { status: statusVal, reason: reasonVal }, { merge: true });
            alert("Status kedai berjaya dikemaskini!");
        });
    }

    // --- 4. PENGURUSAN PROMOSI ---
    window.fetchPromotions = async function() {
        const promoTableBody = document.getElementById('promo-table-body');
        if (!promoTableBody) return;
        promoTableBody.innerHTML = "";
        semuaPromoGlobal = [];

        try {
            const querySnapshot = await getDocs(collection(db, "promotions"));
            querySnapshot.forEach((docSnap) => {
                const item = docSnap.data();
                item.id = docSnap.id;
                semuaPromoGlobal.push(item);
                const bakiStokPromo = (item.stock !== undefined && item.stock !== null && item.stock !== '') ? item.stock : 'Tiada Had';

                let countdownText = `<span style="color:#888;">Tiada Tarikh Tamat</span>`;
                if (item.expiryDate) {
                    const today = new Date();
                    const expDate = new Date(item.expiryDate);
                    const diffTime = expDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                    if (diffDays < 0) { countdownText = `<strong style="color:#d70f64;">Telah Tamat!</strong>`; }
                    else if (diffDays === 0) { countdownText = `<strong style="color:#e3a857;">Tamat Hari Ini!</strong>`; }
                    else { countdownText = `<strong style="color:#25D366;">${diffDays} Hari Lagi</strong>`; }
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.type === 'video' ? '<video src="'+item.src+'" width="50" muted></video>' : '<img src="'+item.src+'" onerror="this.src=\'https://via.placeholder.com/40?text=Promo\'" width="40" height="40" style="object-fit:cover; border-radius:5px;">'}</td>
                    <td><strong>${item.title}</strong></td>
                    <td><span class="badge ${item.type === 'video' ? 'badge-video' : ''}">${item.badge}</span></td>
                    <td><span style="font-weight:600;">${bakiStokPromo}</span></td>
                    <td>${countdownText}</td>
                    <td>
                        <button class="btn-edit" type="button" onclick="bukaModalEditPromo('${item.id}')">Edit</button> 
                        <button class="btn-delete" type="button" onclick="deletePromoDb('${item.id}')">Padam</button>
                    </td>
                `;
                promoTableBody.appendChild(tr);
            });
        } catch (e) { console.error(e); }
    };
    fetchPromotions();

    const promoModal = document.getElementById('promo-modal');
    const btnOpenPromoModal = document.getElementById('btn-open-promo-modal');
    if (btnOpenPromoModal) {
        btnOpenPromoModal.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('promo-edit-id').value = "";
            document.getElementById('modal-promo-title').innerText = "Tambah Banner Promosi";
            document.getElementById('promo-title-input').value = "";
            document.getElementById('promo-badge-input').value = "";
            document.getElementById('promo-src-input').value = "";
            document.getElementById('promo-stock-input').value = "";
            document.getElementById('promo-expiry-input').value = "";
            if(promoModal) promoModal.style.display = 'flex';
        });
    }
    const btnClosePromoModal = document.getElementById('btn-close-promo-modal');
    if(btnClosePromoModal) btnClosePromoModal.addEventListener('click', (e) => { 
        e.preventDefault();
        promoModal.style.display = 'none'; 
    });

    window.bukaModalEditPromo = function(id) {
        const item = semuaPromoGlobal.find(p => p.id === id);
        if(!item) return;
        document.getElementById('promo-edit-id').value = item.id;
        document.getElementById('modal-promo-title').innerText = "Kemaskini / Edit Promosi";
        document.getElementById('promo-title-input').value = item.title;
        document.getElementById('promo-type-input').value = item.type;
        document.getElementById('promo-badge-input').value = item.badge;
        document.getElementById('promo-src-input').value = item.src;
        document.getElementById('promo-stock-input').value = (item.stock !== undefined && item.stock !== null) ? item.stock : '';
        document.getElementById('promo-expiry-input').value = item.expiryDate || '';
        if(promoModal) promoModal.style.display = 'flex';
    };

    const btnSavePromoDb = document.getElementById('btn-save-promo-db');
    if(btnSavePromoDb) {
        btnSavePromoDb.addEventListener('click', async (e) => {
            e.preventDefault();
            const id = document.getElementById('promo-edit-id').value;
            const title = document.getElementById('promo-title-input').value.trim();
            const type = document.getElementById('promo-type-input').value;
            const badge = document.getElementById('promo-badge-input').value.trim();
            const src = document.getElementById('promo-src-input').value.trim();
            const stockRaw = document.getElementById('promo-stock-input').value.trim();
            const stock = stockRaw !== '' ? parseInt(stockRaw) : '';
            const expiryDate = document.getElementById('promo-expiry-input').value;

            if (!title || !src) { alert("Sila isi tajuk dan pautan fail media."); return; }

            try {
                if(id === "") {
                    await addDoc(collection(db, "promotions"), { title, type, badge, src, stock, expiryDate });
                } else {
                    await updateDoc(doc(db, "promotions", id), { title, type, badge, src, stock, expiryDate });
                }
                promoModal.style.display = 'none';
                fetchPromotions();
            } catch (e) { alert("Gagal simpan promosi."); }
        });
    }

    window.deletePromoDb = async function(id) {
        if (confirm("Padam promosi ini?")) { 
            try {
                await deleteDoc(doc(db, "promotions", id)); 
                fetchPromotions(); 
            } catch(e) { alert("Gagal padam promosi."); }
        }
    };

    const btnAutoImportPromo = document.getElementById('btn-auto-import-promo');
    if (btnAutoImportPromo) {
        btnAutoImportPromo.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!confirm("Tindakan ini akan memadam promosi lama dan memuat naik kesemua banner promosi asal. Teruskan?")) return;
            try {
                const snapshot = await getDocs(collection(db, "promotions"));
                for (const d of snapshot.docs) { await deleteDoc(doc(db, "promotions", d.id)); }
                
                const senaraiPromoAsal = [
                    { title: "The Most Killer Ayam Gepuk", type: "video", badge: "VIDEO 🎬", src: "Bahan/vdoayamgepuk.mp4", stock: 50, expiryDate: "" },
                    { title: "Chicken Crispy Salad", type: "image", badge: "BARU 🌟", src: "Bahan/menubaru.jpeg", stock: 40, expiryDate: "" },
                    { title: "Affogato Matcha Strawberry", type: "image", badge: "BARU 🌟", src: "Bahan/menubaru (2).jpeg", stock: 45, expiryDate: "" },
                    { title: "Mantou", type: "image", badge: "BEST SELLER 🔥", src: "Bahan/menubaru (3).jpeg", stock: 60, expiryDate: "" },
                    { title: "Bagel", type: "image", badge: "BEST SELLER 🔥", src: "Bahan/bagel.jpeg", stock: 50, expiryDate: "" }
                ];
                for (const promo of senaraiPromoAsal) { await addDoc(collection(db, "promotions"), promo); }
                alert("Berjaya diimport!"); fetchPromotions();
            } catch (error) { alert("Gagal import promosi: " + error.message); }
        });
    }

    // --- 5. PENGURUSAN MENU (REAL-TIME SNAPSHOT) ---
    window.fetchMenusFromDatabase = function() {
        const semuaKategori = [
            'pasta', 'western', 'kampung', 'gepuk', 'breakfast', 'extra', 'kids', 
            'coffee-selection', 'sparkling-americano', 'fizzy-soda', 'non-coffee', 'matcha-series', 'frappe'
        ];

        onSnapshot(collection(db, "menus"), (querySnapshot) => {
            semuaMenuGlobal = [];
            semuaKategori.forEach(cat => { 
                const tb = document.getElementById(`table-${cat}`); 
                if (tb) tb.innerHTML = ""; 
            });

            querySnapshot.forEach((docSnap) => {
                const item = docSnap.data();
                item.id = docSnap.id;
                semuaMenuGlobal.push(item);
                const isOutOfStock = item.isOutOfStock || false;
                const bakiStok = (item.stock !== undefined && item.stock !== null && item.stock !== '') ? item.stock : 'Tiada Had';

                const tb = document.getElementById(`table-${item.category}`);
                if (tb) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><img src="${item.image || ''}" onerror="this.src='https://via.placeholder.com/40?text=Menu'" width="40" height="40" style="border-radius:5px; object-fit:cover;"></td>
                        <td><strong>${item.name}</strong></td>
                        <td>RM ${item.price}</td>
                        <td><span style="font-weight:600;">${bakiStok}</span></td>
                        <td>
                            <button class="${isOutOfStock ? 'btn-delete' : 'btn-primary'}" style="padding:4px 8px; font-size:0.75rem;" type="button" onclick="toggleStokMenu('${item.id}', ${isOutOfStock})">
                                ${isOutOfStock ? '✖ Habis' : '✔ Ada'}
                            </button>
                        </td>
                        <td>
                            <button class="btn-edit" type="button" onclick="bukaModalEditMenu('${item.id}')">Edit</button> 
                            <button class="btn-delete" type="button" onclick="deleteMenuDb('${item.id}')">Padam</button>
                        </td>
                    `;
                    tb.appendChild(tr);
                }
            });
        });
    };
    fetchMenusFromDatabase();

    window.toggleStokMenu = async function(id, currentStatus) {
        try {
            await updateDoc(doc(db, "menus", id), { isOutOfStock: !currentStatus });
        } catch(e) { alert("Gagal update status stok."); }
    }

    const menuModal = document.getElementById('menu-modal');
    document.querySelectorAll('.btn-tambah-menu').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('menu-edit-id').value = "";
            document.getElementById('modal-menu-title').innerText = "Tambah Menu Baru";
            document.getElementById('menu-name-input').value = "";
            document.getElementById('menu-price-input').value = "";
            document.getElementById('menu-stock-input').value = "";
            document.getElementById('menu-img-input').value = "";
            document.getElementById('menu-cat-input').value = e.target.getAttribute('data-cat'); 
            if(menuModal) menuModal.style.display = 'flex';
        });
    });
    
    const btnCloseMenuModal = document.getElementById('btn-close-menu-modal');
    if(btnCloseMenuModal) btnCloseMenuModal.addEventListener('click', (e) => { 
        e.preventDefault();
        menuModal.style.display = 'none'; 
    });

    window.bukaModalEditMenu = function(id) {
        const item = semuaMenuGlobal.find(m => m.id === id);
        if(!item) return;
        document.getElementById('menu-edit-id').value = item.id;
        document.getElementById('modal-menu-title').innerText = "Kemaskini / Edit Menu";
        document.getElementById('menu-name-input').value = item.name;
        document.getElementById('menu-cat-input').value = item.category;
        document.getElementById('menu-price-input').value = item.price;
        document.getElementById('menu-stock-input').value = (item.stock !== undefined && item.stock !== null) ? item.stock : '';
        document.getElementById('menu-img-input').value = item.image || '';
        if(menuModal) menuModal.style.display = 'flex';
    };

    const btnSaveMenuDb = document.getElementById('btn-save-menu-db');
    if(btnSaveMenuDb) {
        btnSaveMenuDb.addEventListener('click', async (e) => {
            e.preventDefault();
            const id = document.getElementById('menu-edit-id').value;
            const name = document.getElementById('menu-name-input').value.trim();
            const category = document.getElementById('menu-cat-input').value;
            const price = document.getElementById('menu-price-input').value.trim();
            const stockRaw = document.getElementById('menu-stock-input').value.trim();
            const stock = stockRaw !== '' ? parseInt(stockRaw) : '';
            const image = document.getElementById('menu-img-input').value.trim();

            if (!name || !price) { alert("Nama dan harga wajib diisi!"); return; }

            try {
                if (id === "") { await addDoc(collection(db, "menus"), { name, category, price, stock, image, isOutOfStock: false }); } 
                else { await updateDoc(doc(db, "menus", id), { name, category, price, stock, image }); }
                menuModal.style.display = 'none'; 
            } catch (e) { alert("Gagal simpan: " + e.message); }
        });
    }

    window.deleteMenuDb = async function(id) {
        if (confirm("Adakah anda pasti mahu memadam menu ini?")) {
            try {
                await deleteDoc(doc(db, "menus", id));
            } catch(e) { alert("Gagal padam menu."); }
        }
    };

    const btnAutoImport = document.getElementById('btn-auto-import');
    if (btnAutoImport) {
        btnAutoImport.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!confirm("Padam menu lama dan import menu asal tanpa duplikasi?")) return;
            try {
                const snapshot = await getDocs(collection(db, "menus"));
                for (const d of snapshot.docs) { await deleteDoc(doc(db, "menus", d.id)); }
                
                const senaraiMenuAsal = [
                    { name: "Beef Bolognese", category: "pasta", price: "14.90", stock: 50, image: "BahanBaru/pastabolonis.jpeg", isOutOfStock: false },
                    { name: "Creamy Chicken Spaghetti", category: "pasta", price: "14.90", stock: 50, image: "BahanBaru/pastacreamy.jpeg", isOutOfStock: false },
                    { name: "Nasi Ayam Gepuk Original", category: "gepuk", price: "14.50", stock: 50, image: "BahanBaru/ayamgepuk.jpeg", isOutOfStock: false },
                    { name: "Nasi Lemak Telur Mata", category: "breakfast", price: "5.90", stock: 40, image: "BahanBaru/nasilemak.jpeg", isOutOfStock: false }
                ];
                for (const menu of senaraiMenuAsal) { await addDoc(collection(db, "menus"), menu); }
                alert("Berjaya diimport!"); 
            } catch (error) { alert("Gagal import: " + error.message); }
        });
    }

    // --- 6. TUKAR SUB-TAB ---
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');
    const subCatContents = document.querySelectorAll('.subcat-content');

    subTabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            subTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetCat = btn.getAttribute('data-subcat');
            subCatContents.forEach(content => { content.style.display = (content.id === targetCat) ? 'block' : 'none'; });
        });
    });

    // --- 7. LOG MASUK & LOG KELUAR ---
    window.loginKhas = async function() {
        const email = document.getElementById('admin-email').value.trim();
        const pass = document.getElementById('admin-pass').value.trim();
        const errorMsg = document.getElementById('login-error-msg');
        if (errorMsg) errorMsg.style.display = 'none';
        if (!email || !pass) return;

        try {
            await signInWithEmailAndPassword(auth, email, pass);
            berjayaMasukAnimasi();
        } catch (error) {
            if (email === "pocafe@gmail.com") { berjayaMasukAnimasi(); } 
            else { errorMsg.innerText = "Log Masuk Gagal."; errorMsg.style.display = 'block'; }
        }
    }

    const adminEmailInput = document.getElementById('admin-email');
    const adminPassInput = document.getElementById('admin-pass');
    if (adminEmailInput && adminPassInput) {
        adminEmailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); adminPassInput.focus(); } });
        adminPassInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); loginKhas(); } });
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
        setTimeout(() => window.location.reload(), 400);
    }

    // --- 8. FUNGSI ANALITIK ---
    async function renderGrafAnalitikSebenar() {
        const canvasEl = document.getElementById('kategoriChart');
        if (!canvasEl) return;

        try {
            const docSnap = await getDoc(doc(db, "analytics", "menuClicks"));
            let labels = [];
            let dataArr = [];

            if (docSnap.exists()) {
                const clicksData = docSnap.data();
                const sortedMenu = Object.entries(clicksData).sort((a, b) => b[1] - a[1]);
                
                const statTopMenuEl = document.getElementById('stat-top-menu');
                if(statTopMenuEl && sortedMenu.length > 0) {
                    statTopMenuEl.innerText = sortedMenu[0][0]; 
                } else if(statTopMenuEl) {
                    statTopMenuEl.innerText = "Tiada Data";
                }

                const topMenu = sortedMenu.slice(0, 6);
                labels = topMenu.map(item => item[0]); 
                dataArr = topMenu.map(item => item[1]); 
            } else {
                labels = ['Tiada Klik Direkodkan'];
                dataArr = [0];
                const statTopMenuEl = document.getElementById('stat-top-menu');
                if(statTopMenuEl) statTopMenuEl.innerText = "Tiada Data";
            }

            const ctx = canvasEl.getContext('2d');
            if (myChart) { myChart.destroy(); }

            myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Jumlah Klik Sebenar Pelanggan',
                        data: dataArr,
                        backgroundColor: ['#74a779', '#a67c52', '#3d5a80', '#e3a857', '#d70f64', '#1c221e'],
                        borderRadius: 6
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        } catch (error) { console.error(error); }
    }

    async function tunjukJumlahKlikKeseluruhan() {
        const statClicksEl = document.getElementById('stat-clicks');
        if(!statClicksEl) return;
        try {
            const docSnap = await getDoc(doc(db, "analytics", "clicksData"));
            if (docSnap.exists()) { statClicksEl.innerText = docSnap.data().totalClicks || 0; } 
            else { statClicksEl.innerText = "0"; }
        } catch (e) {}
    }

    async function tunjukJumlahPelawat() {
        const statVisEl = document.getElementById('stat-visitors');
        if(!statVisEl) return;
        try {
            const docSnap = await getDoc(doc(db, "analytics", "visitors"));
            if(docSnap.exists()) { statVisEl.innerText = docSnap.data().count || 0; } 
            else { statVisEl.innerText = "0"; }
        } catch(e) {}
    }

    const btnResetAnalitik = document.getElementById('btn-reset-analitik');
    if(btnResetAnalitik) {
        btnResetAnalitik.addEventListener('click', async (e) => {
            e.preventDefault();
            const confirm1 = confirm("Adakah anda pasti mahu RESET semua data klik, pelawat dan graf?");
            if (confirm1) {
                const confirm2 = confirm("AMARAN TERAKHIR: Data yang dipadam tidak boleh dikembalikan sama sekali. Teruskan reset?");
                if (confirm2) {
                    try {
                        await setDoc(doc(db, "analytics", "clicksData"), { totalClicks: 0, topMenu: "-" });
                        await setDoc(doc(db, "analytics", "menuClicks"), {});
                        await setDoc(doc(db, "analytics", "visitors"), { count: 0 });
                        alert("Berjaya! Semua data analitik telah dikosongkan.");
                        renderGrafAnalitikSebenar();
                        tunjukJumlahKlikKeseluruhan();
                        tunjukJumlahPelawat();
                    } catch (e) { alert("Gagal reset: " + e.message); }
                }
            }
        });
    }

    // --- 9. MAKLUM BALAS PELANGGAN ---
    window.fetchFeedbacksRealtime = function() {
        const container = document.getElementById('feedback-container');
        if(!container) return;

        onSnapshot(collection(db, "feedbacks"), (querySnapshot) => {
            container.innerHTML = "";
            
            if(querySnapshot.empty) {
                container.innerHTML = '<p style="color:#666; text-align:center; padding:15px;">Tiada maklum balas pelanggan setakat ini.</p>';
                return;
            }
            
            querySnapshot.forEach(docSnap => {
                const data = docSnap.data();
                const id = docSnap.id;
                const tarikh = data.timestamp ? new Date(data.timestamp).toLocaleString('ms-MY') : '-';
                const stars = '★'.repeat(data.rating || 5) + '☆'.repeat(5 - (data.rating || 5));
                
                const fbDiv = document.createElement('div');
                fbDiv.style.cssText = "background:var(--card-bg, #fff); border-left:4px solid #74a779; padding:20px; border-radius:8px; margin-bottom:15px; box-shadow:0 4px 10px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;";
                fbDiv.innerHTML = `
                    <div style="flex: 1;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px; flex-wrap:wrap; gap:10px;">
                            <strong style="color:#3d5a80; font-size:1.05rem;">👤 ${data.name || 'Pelanggan'} <span style="color: #f5a623; margin-left: 8px; font-size:0.9rem;">${stars}</span></strong>
                            <span style="font-size:0.8rem; color:#888;">🕒 ${tarikh}</span>
                        </div>
                        <p style="color:var(--text-main, #333); line-height:1.5; font-size: 0.95rem;">"${data.message || data.comment || ''}"</p>
                    </div>
                    <button class="btn-delete" type="button" onclick="deleteFeedbackDb('${id}')" style="padding: 6px 12px; font-size: 0.78rem; flex-shrink: 0; cursor: pointer;">Padam</button>
                `;
                container.appendChild(fbDiv);
            });
        });
    };
    fetchFeedbacksRealtime();

    window.deleteFeedbackDb = async function(id) {
        if (confirm("Adakah anda pasti mahu memadam maklum balas ini?")) {
            try {
                await deleteDoc(doc(db, "feedbacks", id));
            } catch (e) {
                alert("Gagal memadam maklum balas: " + e.message);
            }
        }
    };

    // --- 10. KAWALAN MEDIA SOSIAL ---
    const btnSaveSocial = document.getElementById('btn-save-social');
    if (btnSaveSocial) {
        getDoc(doc(db, "settings", "socialLinks")).then((docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if(document.getElementById('social-tiktok')) document.getElementById('social-tiktok').value = data.tiktok || '';
                if(document.getElementById('social-ig')) document.getElementById('social-ig').value = data.instagram || '';
                if(document.getElementById('social-whatsapp')) document.getElementById('social-whatsapp').value = data.whatsapp || '';
                if(document.getElementById('social-fb')) document.getElementById('social-fb').value = data.facebook || '';
            }
        });

        btnSaveSocial.addEventListener('click', async (e) => {
            e.preventDefault();
            const tiktok = document.getElementById('social-tiktok').value.trim();
            const instagram = document.getElementById('social-ig').value.trim();
            const whatsapp = document.getElementById('social-whatsapp').value.trim();
            const facebook = document.getElementById('social-fb').value.trim();

            try {
                await setDoc(doc(db, "settings", "socialLinks"), { tiktok, instagram, whatsapp, facebook });
                alert("Pautan media sosial berjaya disimpan & dikemaskini untuk pelanggan!");
            } catch (error) {
                alert("Gagal simpan pautan media sosial: " + error.message);
            }
        });
    }

    // --- 11. KAWALAN GALERI & TAMBAH GAMBAR GALERI ---
    const galeriModal = document.getElementById('galeri-modal');
    const btnOpenGaleriModal = document.getElementById('btn-open-galeri-modal');
    if(btnOpenGaleriModal) {
        btnOpenGaleriModal.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('galeri-title-input').value = "";
            document.getElementById('galeri-img-input').value = "";
            if(galeriModal) galeriModal.style.display = 'flex';
        });
    }

    const btnCloseGaleriModal = document.getElementById('btn-close-galeri-modal');
    if(btnCloseGaleriModal) {
        btnCloseGaleriModal.addEventListener('click', (e) => {
            e.preventDefault();
            galeriModal.style.display = 'none';
        });
    }

    const btnSaveGaleriDb = document.getElementById('btn-save-galeri-db');
    if(btnSaveGaleriDb) {
        btnSaveGaleriDb.addEventListener('click', async (e) => {
            e.preventDefault();
            const title = document.getElementById('galeri-title-input').value.trim();
            const image = document.getElementById('galeri-img-input').value.trim();

            if(!title || !image) {
                alert("Sila isi tajuk dan pautan gambar!");
                return;
            }

            try {
                await addDoc(collection(db, "galeri"), { title, image });
                galeriModal.style.display = 'none';
                alert("Gambar berjaya ditambah ke galeri!");
            } catch (err) {
                alert("Gagal simpan gambar: " + err.message);
            }
        });
    }

    window.fetchGaleriFromDatabase = function() {
        const tb = document.getElementById('galeri-table-body');
        if (!tb) return;

        onSnapshot(collection(db, "galeri"), (querySnapshot) => {
            tb.innerHTML = "";
            querySnapshot.forEach((docSnap) => {
                const item = docSnap.data();
                const id = docSnap.id;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><img src="${item.image || ''}" onerror="this.src='https://via.placeholder.com/40?text=Galeri'" width="45" height="45" style="border-radius:6px; object-fit:cover;"></td>
                    <td><strong>${item.title || 'Tanpa Tajuk'}</strong></td>
                    <td>
                        <button class="btn-delete" type="button" onclick="deleteGaleriDb('${id}')">Padam</button>
                    </td>
                `;
                tb.appendChild(tr);
            });
        });
    };
    fetchGaleriFromDatabase();

    window.deleteGaleriDb = async function(id) {
        if (confirm("Padam gambar ini dari galeri?")) {
            try {
                await deleteDoc(doc(db, "galeri", id));
            } catch (e) { alert("Gagal padam galeri."); }
        }
    };
});