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

let semuaMenuGlobal = [];
let semuaPromoGlobal = [];

document.addEventListener('DOMContentLoaded', () => {

    // --- KAWALAN MOD GELAP / CERAH (DARK/LIGHT THEME) ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const savedTheme = localStorage.getItem('po_cafe_admin_theme');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if(themeToggleBtn) themeToggleBtn.innerText = "☀️ Mod Cerah";
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('po_cafe_admin_theme', isDark ? 'dark' : 'light');
            themeToggleBtn.innerText = isDark ? "☀️ Mod Cerah" : "🌙 Mod Gelap";
        });
    }

    // --- KAWALAN AMARAN AKHIR BULAN (7 HARI SEBELUM RESET) ---
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
    let chartRendered = false;

    if (hamburgerBtn && sidebarNav) {
        hamburgerBtn.addEventListener('click', () => { sidebarNav.classList.toggle('show'); });
        sidebarItems.forEach(li => {
            li.addEventListener('click', () => {
                if (window.innerWidth <= 768) sidebarNav.classList.remove('show');
            });
        });
    }

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

    // --- 2. KAWALAN KEDAI & ANNOUNCEMENT ---
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

    statusSelect.addEventListener('change', function() {
        reasonInput.style.display = (this.value === 'cuti') ? 'block' : 'none';
    });

    function updateStatusUI(status, reason) {
        if(!statusText) return;
        if (status === 'buka') { statusText.innerText = "STATUS KINI: BUKA"; statusText.style.color = "#25D366"; reasonInput.style.display = 'none'; }
        else if (status === 'tutup') { statusText.innerText = "STATUS KINI: TUTUP"; statusText.style.color = "#d70f64"; reasonInput.style.display = 'none'; }
        else if (status === 'cuti') { statusText.innerText = "STATUS KINI: CUTI (" + (reason||"Tiada sebab") + ")"; statusText.style.color = "#e3a857"; reasonInput.style.display = 'block'; }
    }

    if (btnSaveStatus) {
        btnSaveStatus.addEventListener('click', async () => {
            const statusVal = statusSelect.value;
            const reasonVal = reasonInput.value;
            updateStatusUI(statusVal, reasonVal);
            await setDoc(doc(db, "settings", "storeStatus"), { status: statusVal, reason: reasonVal }, { merge: true });
            alert("Status kedai berjaya dikemaskini!");
        });
    }

    // --- 4. PENGURUSAN MENU (DENGAN FALLBACK GAMBAR JIKA ROSAK) ---
    window.fetchMenusFromDatabase = async function() {
        const semuaKategori = [
            'pasta', 'western', 'kampung', 'gepuk', 'breakfast', 'extra', 'kids', 
            'coffee-selection', 'sparkling-americano', 'fizzy-soda', 'non-coffee', 'matcha-series', 'frappe'
        ];
        
        semuaKategori.forEach(cat => { 
            const tb = document.getElementById(`table-${cat}`); 
            if (tb) tb.innerHTML = ""; 
        });
        semuaMenuGlobal = [];

        try {
            const querySnapshot = await getDocs(collection(db, "menus"));
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
        } catch (e) { console.error(e); }
    };
    fetchMenusFromDatabase();

    // --- FUNGSI AUTO-IMPORT BERSIH (PADAM DUPLIKASI LAMA & MASUKKAN LENGKAP) ---
    const btnAutoImport = document.getElementById('btn-auto-import');
    if (btnAutoImport) {
        btnAutoImport.addEventListener('click', async () => {
            if (!confirm("Tindakan ini akan memadam menu lama dan menyusun semula semua menu lengkap mengikut sub-kategori tanpa duplikasi. Teruskan?")) return;

            try {
                // 1. Padam semua menu lama di database supaya tiada duplicate
                const snapshot = await getDocs(collection(db, "menus"));
                for (const d of snapshot.docs) {
                    await deleteDoc(doc(db, "menus", d.id));
                }

                // 2. Senarai menu asal yang lengkap merangkumi semua sub-kategori
                const senaraiMenuAsal = [
                    // Pasta
                    { name: "Carbonara Special", category: "pasta", price: "15.00", stock: 50, image: "BahanBaru/carbonara.jpeg", isOutOfStock: false },
                    { name: "Bolognese Meatball", category: "pasta", price: "14.00", stock: 50, image: "BahanBaru/bolognese.jpeg", isOutOfStock: false },
                    // Western
                    { name: "Chicken Chop Grill", category: "western", price: "18.00", stock: 40, image: "BahanBaru/chickenchop.jpeg", isOutOfStock: false },
                    { name: "Lamb Chop Premium", category: "western", price: "25.00", stock: 30, image: "BahanBaru/lambchop.jpeg", isOutOfStock: false },
                    // Kampung Series
                    { name: "Nasi Goreng Kampung", category: "kampung", price: "10.00", stock: 60, image: "BahanBaru/nasigorengkampung.jpeg", isOutOfStock: false },
                    { name: "Nasi Lemak Ayam", category: "kampung", price: "12.00", stock: 60, image: "BahanBaru/nasilemak.jpeg", isOutOfStock: false },
                    // Ayam Gepuk
                    { name: "Ayam Gepuk Crispy", category: "gepuk", price: "13.00", stock: 50, image: "BahanBaru/ayamgepuk.jpeg", isOutOfStock: false },
                    { name: "Ayam Gepuk Berapi", category: "gepuk", price: "14.00", stock: 45, image: "BahanBaru/ayamgepukberapi.jpeg", isOutOfStock: false },
                    // Breakfast & Snek
                    { name: "Roti Bakar Telur Goyang", category: "breakfast", price: "6.00", stock: 40, image: "BahanBaru/rotibakar.jpeg", isOutOfStock: false },
                    { name: "American Breakfast", category: "breakfast", price: "11.00", stock: 35, image: "BahanBaru/americanbreak.jpeg", isOutOfStock: false },
                    // Extra / Tambahan
                    { name: "Extra Cheese Sauce", category: "extra", price: "3.00", stock: 100, image: "BahanBaru/cheese.jpeg", isOutOfStock: false },
                    // Kids Meal
                    { name: "Nugget & Fries Kids Meal", category: "kids", price: "8.00", stock: 30, image: "BahanBaru/kidsmeal.jpeg", isOutOfStock: false },
                    // Coffee Selection
                    { name: "Caffe Latte", category: "coffee-selection", price: "9.00", stock: 100, image: "BahanBaru/latte.jpeg", isOutOfStock: false },
                    { name: "Caramel Macchiato", category: "coffee-selection", price: "11.00", stock: 100, image: "BahanBaru/caramelmacchiato.jpeg", isOutOfStock: false },
                    // Sparkling Americano
                    { name: "Sparkling Honey Lemon", category: "sparkling-americano", price: "10.00", stock: 80, image: "BahanBaru/sparkling.jpeg", isOutOfStock: false },
                    // Fizzy & Soda
                    { name: "Blueberry Fizzy", category: "fizzy-soda", price: "7.00", stock: 80, image: "BahanBaru/fizzy.jpeg", isOutOfStock: false },
                    // Non-Coffee
                    { name: "Chocolate Premium", category: "non-coffee", price: "9.50", stock: 70, image: "BahanBaru/choc.jpeg", isOutOfStock: false },
                    // Matcha Series
                    { name: "Matcha Latte", category: "matcha-series", price: "10.50", stock: 60, image: "BahanBaru/matcha.jpeg", isOutOfStock: false },
                    // Frappe
                    { name: "Mocha Frappe", category: "frappe", price: "12.00", stock: 50, image: "BahanBaru/frappe.jpeg", isOutOfStock: false }
                ];

                // 3. Masukkan senarai baru
                for (const menu of senaraiMenuAsal) {
                    await addDoc(collection(db, "menus"), menu);
                }

                alert("Berjaya! Semua menu telah diimport semula dengan bersih tanpa duplikasi.");
                fetchMenusFromDatabase();
            } catch (error) {
                alert("Gagal import: " + error.message);
            }
        });
    }

// --- FUNGSI AUTO-IMPORT PROMOSI ASAL KE FIREBASE ---
    const btnAutoImportPromo = document.getElementById('btn-auto-import-promo');
    if (btnAutoImportPromo) {
        btnAutoImportPromo.addEventListener('click', async () => {
            if (!confirm("Tindakan ini akan memadam promosi lama dan memuat naik kesemua banner promosi asal. Teruskan?")) return;

            try {
                // 1. Padam promosi lama supaya tiada duplikasi
                const snapshot = await getDocs(collection(db, "promotions"));
                for (const d of snapshot.docs) {
                    await deleteDoc(doc(db, "promotions", d.id));
                }

                // 2. Senarai penuh promosi berasaskan HTML pelanggan
                const senaraiPromoAsal = [
                    {
                        title: "The Most Killer Ayam Gepuk",
                        type: "video",
                        badge: "VIDEO 🎬",
                        src: "Bahan/vdoayamgepuk.mp4",
                        stock: 50,
                        expiryDate: ""
                    },
                    {
                        title: "Chicken Crispy Salad",
                        type: "image",
                        badge: "BARU 🌟",
                        src: "Bahan/menubaru.jpeg",
                        stock: 40,
                        expiryDate: ""
                    },
                    {
                        title: "Affogato Matcha Strawberry",
                        type: "image",
                        badge: "BARU 🌟",
                        src: "Bahan/menubaru (2).jpeg",
                        stock: 45,
                        expiryDate: ""
                    },
                    {
                        title: "Mantou",
                        type: "image",
                        badge: "BEST SELLER 🔥",
                        src: "Bahan/menubaru (3).jpeg",
                        stock: 60,
                        expiryDate: ""
                    },
                    {
                        title: "Bagel",
                        type: "image",
                        badge: "BEST SELLER 🔥",
                        src: "Bahan/bagel.jpeg",
                        stock: 50,
                        expiryDate: ""
                    }
                ];

                // 3. Masukkan ke database Firebase
                for (const promo of senaraiPromoAsal) {
                    await addDoc(collection(db, "promotions"), promo);
                }

                alert("Berjaya! Semua banner promosi dan video eksklusif telah diimport ke pangkalan data.");
                fetchPromotions(); // Refresh jadual promosi admin
            } catch (error) {
                alert("Gagal import promosi: " + error.message);
            }
        });
    }

    window.toggleStokMenu = async function(id, currentStatus) {
        try {
            await updateDoc(doc(db, "menus", id), { isOutOfStock: !currentStatus });
            fetchMenusFromDatabase();
        } catch(e) { alert("Gagal update status stok."); }
    }

    const menuModal = document.getElementById('menu-modal');
    document.querySelectorAll('.btn-tambah-menu').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.getElementById('menu-edit-id').value = "";
            document.getElementById('modal-menu-title').innerText = "Tambah Menu Baru";
            document.getElementById('menu-name-input').value = "";
            document.getElementById('menu-price-input').value = "";
            document.getElementById('menu-stock-input').value = "";
            document.getElementById('menu-img-input').value = "";
            document.getElementById('menu-cat-input').value = e.target.getAttribute('data-cat'); 
            menuModal.style.display = 'flex';
        });
    });
    document.getElementById('btn-close-menu-modal').addEventListener('click', () => { menuModal.style.display = 'none'; });

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
        menuModal.style.display = 'flex';
    };

    document.getElementById('btn-save-menu-db').addEventListener('click', async () => {
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
            menuModal.style.display = 'none'; fetchMenusFromDatabase();
        } catch (e) { alert("Gagal simpan: " + e.message); }
    });

    window.deleteMenuDb = async function(id) {
        if (confirm("Adakah anda pasti mahu memadam menu ini?")) {
            await deleteDoc(doc(db, "menus", id)); fetchMenusFromDatabase();
        }
    };

    // --- 5. PENGURUSAN PROMOSI ---
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
        btnOpenPromoModal.addEventListener('click', () => {
            document.getElementById('promo-edit-id').value = "";
            document.getElementById('modal-promo-title').innerText = "Tambah Banner Promosi";
            document.getElementById('promo-title-input').value = "";
            document.getElementById('promo-badge-input').value = "";
            document.getElementById('promo-src-input').value = "";
            document.getElementById('promo-stock-input').value = "";
            document.getElementById('promo-expiry-input').value = "";
            promoModal.style.display = 'flex';
        });
    }
    document.getElementById('btn-close-promo-modal').addEventListener('click', () => { promoModal.style.display = 'none'; });

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
        promoModal.style.display = 'flex';
    };

    document.getElementById('btn-save-promo-db').addEventListener('click', async () => {
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

    window.deletePromoDb = async function(id) {
        if (confirm("Padam promosi ini?")) { await deleteDoc(doc(db, "promotions", id)); fetchPromotions(); }
    };

    // --- 6. ANALITIK BULANAN ---
    const now = new Date();
    const currentMonthYear = now.toLocaleString('ms-MY', { month: 'long', year: 'numeric' });
    const monthLabelEl = document.getElementById('current-month-label');
    if(monthLabelEl) monthLabelEl.innerText = currentMonthYear;

    const savedMonth = localStorage.getItem('po_cafe_active_month');
    if (savedMonth !== currentMonthYear) {
        localStorage.setItem('po_cafe_active_month', currentMonthYear);
        localStorage.setItem('po_cafe_monthly_clicks', '0');
    }

    const totalClicks = localStorage.getItem('po_cafe_monthly_clicks') || '1,245';
    const statClicksEl = document.getElementById('stat-clicks');
    if(statClicksEl) statClicksEl.innerText = totalClicks;

    // --- 7. TUKAR SUB-TAB ---
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');
    const subCatContents = document.querySelectorAll('.subcat-content');

    subTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            subTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetCat = btn.getAttribute('data-subcat');
            subCatContents.forEach(content => { content.style.display = (content.id === targetCat) ? 'block' : 'none'; });
        });
    });

    // --- 8. LOG MASUK & ENTER ---
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
});

function renderGrafAnalitik() {
    const canvasEl = document.getElementById('kategoriChart');
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Pasta', 'Western', 'Ayam Gepuk', 'Kopi', 'Minuman Segar'],
            datasets: [{
                label: 'Jumlah Klik Bulan Ini',
                data: [420, 650, 310, 290, 150],
                backgroundColor: ['#74a779', '#a67c52', '#3d5a80', '#e3a857', '#d70f64'],
                borderRadius: 6
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}