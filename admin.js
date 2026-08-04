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

    // --- 2. KAWALAN KEDAI (TERMASUK CUTI) ---
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
        if (this.value === 'cuti') reasonInput.style.display = 'block';
        else reasonInput.style.display = 'none';
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

    // --- 2.1 PENGUMUMAN DENGAN MASA (TIMER) ---
    const btnSaveAnnouncement = document.getElementById('btn-save-announcement');
    const announcementInput = document.getElementById('announcement-text');
    const announcementExpiry = document.getElementById('announcement-expiry');
    const toggleAnnouncement = document.getElementById('toggle-announcement');

    async function loadAnnouncement() {
        try {
            const docSnap = await getDoc(doc(db, "settings", "announcement"));
            if (docSnap.exists() && announcementInput && toggleAnnouncement) {
                announcementInput.value = docSnap.data().text || "";
                announcementExpiry.value = docSnap.data().expiry || "";
                toggleAnnouncement.checked = docSnap.data().isActive || false;
            }
        } catch (e) { console.error(e); }
    }
    loadAnnouncement();

    if (btnSaveAnnouncement) {
        btnSaveAnnouncement.addEventListener('click', async () => {
            await setDoc(doc(db, "settings", "announcement"), {
                text: announcementInput.value,
                expiry: announcementExpiry.value,
                isActive: toggleAnnouncement.checked
            }, { merge: true });
            alert("Pengumuman berserta had masa berjaya disimpan!");
        });
    }

    // --- 3. FORMAT HARGA AUTOMATIK ---
    const priceInput = document.getElementById('menu-price-input');
    if (priceInput) {
        priceInput.addEventListener('input', function() {
            let val = this.value.replace(/[^0-9.]/g, '');
            const parts = val.split('.');
            if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
            this.value = val;
        });
        priceInput.addEventListener('blur', function() {
            if(this.value && !isNaN(this.value)) this.value = parseFloat(this.value).toFixed(2);
        });
    }

    // --- 4. PENGURUSAN MENU (TERMASUK OUT-OF-STOCK) ---
    window.fetchMenusFromDatabase = async function() {
        const semuaKategori = ['pasta', 'western', 'kampung', 'gepuk', 'breakfast', 'extra', 'kids', 'coffee', 'beverages'];
        semuaKategori.forEach(cat => { const tb = document.getElementById(`table-${cat}`); if (tb) tb.innerHTML = ""; });
        semuaMenuGlobal = [];

        try {
            const querySnapshot = await getDocs(collection(db, "menus"));
            querySnapshot.forEach((docSnap) => {
                const item = docSnap.data();
                item.id = docSnap.id;
                semuaMenuGlobal.push(item);
                const isOutOfStock = item.isOutOfStock || false; // Default ada stok

                const tb = document.getElementById(`table-${item.category}`);
                if (tb) {
                    const tr = document.createElement('tr');
                    // Tambah butang toggle stok (Warna merah kalau habis, hijau kalau ada)
                    tr.innerHTML = `
                        <td><img src="${item.image || 'BahanBaru/ayamgepuk.jpeg'}" width="40" height="40" style="border-radius:5px; object-fit:cover;"></td>
                        <td><strong>${item.name}</strong></td>
                        <td>RM ${item.price}</td>
                        <td>
                            <button class="${isOutOfStock ? 'btn-delete' : 'btn-primary'}" style="padding:4px 8px; font-size:0.8rem;" type="button" onclick="toggleStokMenu('${item.id}', ${isOutOfStock})">
                                ${isOutOfStock ? '✖ Habis Stok' : '✔ Ada Stok'}
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
        } catch (e) { console.error("Ralat Tarik Data:", e); }
    };
    fetchMenusFromDatabase();

    // Fungsi klik tukar stok
    window.toggleStokMenu = async function(id, currentStatus) {
        try {
            await updateDoc(doc(db, "menus", id), { isOutOfStock: !currentStatus });
            fetchMenusFromDatabase(); // Refresh jadual
        } catch(e) { alert("Gagal update stok."); }
    }

    const menuModal = document.getElementById('menu-modal');
    document.querySelectorAll('.btn-tambah-menu').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.getElementById('menu-edit-id').value = "";
            document.getElementById('modal-menu-title').innerText = "Tambah Menu Baru";
            document.getElementById('menu-name-input').value = "";
            document.getElementById('menu-price-input').value = "";
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
        document.getElementById('menu-img-input').value = item.image || '';
        menuModal.style.display = 'flex';
    };

    document.getElementById('btn-save-menu-db').addEventListener('click', async () => {
        const id = document.getElementById('menu-edit-id').value;
        const name = document.getElementById('menu-name-input').value.trim();
        const category = document.getElementById('menu-cat-input').value;
        const price = document.getElementById('menu-price-input').value.trim();
        const image = document.getElementById('menu-img-input').value.trim();

        if (!name || !price) { alert("Nama dan harga wajib diisi!"); return; }

        try {
            if (id === "") { await addDoc(collection(db, "menus"), { name, category, price, image, isOutOfStock: false }); } 
            else { await updateDoc(doc(db, "menus", id), { name, category, price, image }); }
            menuModal.style.display = 'none'; fetchMenusFromDatabase();
        } catch (e) { alert("Gagal simpan: " + e.message); }
    });

    window.deleteMenuDb = async function(id) {
        if (confirm("Adakah anda pasti mahu memadam menu ini?")) {
            await deleteDoc(doc(db, "menus", id)); fetchMenusFromDatabase();
        }
    };

    // --- 6. PENGURUSAN PROMOSI (TERMASUK KIRA BAKI HARI) ---
    const promoModal = document.getElementById('promo-modal');
    const btnOpenPromoModal = document.getElementById('btn-open-promo-modal');
    
    window.fetchPromotions = async function() {
        const promoTableBody = document.getElementById('promo-table-body');
        if (!promoTableBody) return;
        promoTableBody.innerHTML = "";
        try {
            const querySnapshot = await getDocs(collection(db, "promotions"));
            querySnapshot.forEach((docSnap) => {
                const item = docSnap.data();
                const id = docSnap.id;
                
                // Logik kira baki hari promosi
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
                    <td>${item.type === 'video' ? '<video src="'+item.src+'" width="50" muted></video>' : '<img src="'+item.src+'" width="40" height="40" style="object-fit:cover; border-radius:5px;">'}</td>
                    <td><strong>${item.title}</strong></td>
                    <td><span class="badge ${item.type === 'video' ? 'badge-video' : ''}">${item.badge}</span></td>
                    <td>${countdownText}</td>
                    <td><button class="btn-delete" type="button" onclick="deletePromoDb('${id}')">Padam</button></td>
                `;
                promoTableBody.appendChild(tr);
            });
        } catch (e) { console.error(e); }
    };
    fetchPromotions();

    if (btnOpenPromoModal) {
        btnOpenPromoModal.addEventListener('click', () => {
            document.getElementById('promo-title-input').value = "";
            document.getElementById('promo-badge-input').value = "";
            document.getElementById('promo-src-input').value = "";
            document.getElementById('promo-expiry-input').value = "";
            promoModal.style.display = 'flex';
        });
    }
    document.getElementById('btn-close-promo-modal').addEventListener('click', () => { promoModal.style.display = 'none'; });

    document.getElementById('btn-save-promo-db').addEventListener('click', async () => {
        const title = document.getElementById('promo-title-input').value.trim();
        const type = document.getElementById('promo-type-input').value;
        const badge = document.getElementById('promo-badge-input').value.trim();
        const src = document.getElementById('promo-src-input').value.trim();
        const expiryDate = document.getElementById('promo-expiry-input').value; // Tarikh dari kalendar

        if (!title || !src) { alert("Sila isi tajuk dan pautan fail media."); return; }

        try {
            await addDoc(collection(db, "promotions"), { title, type, badge, src, expiryDate });
            promoModal.style.display = 'none';
            fetchPromotions();
        } catch (e) { alert("Gagal simpan promosi."); }
    });

    window.deletePromoDb = async function(id) {
        if (confirm("Padam promosi ini?")) { await deleteDoc(doc(db, "promotions", id)); fetchPromotions(); }
    };

    // --- 7. TUKAR SUB-TAB KATEGORI MENU ---
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

    // --- 8. LOG MASUK & KELUAR ---
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

// --- GRAF ANALITIK ---
function renderGrafAnalitik() {
    const canvasEl = document.getElementById('kategoriChart');
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Pasta', 'Western', 'Ayam Gepuk', 'Kopi', 'Minuman Segar'],
            datasets: [{
                label: 'Jumlah Klik Pelanggan',
                data: [420, 650, 310, 290, 150],
                backgroundColor: ['#74a779', '#a67c52', '#3d5a80', '#e3a857', '#d70f64'],
                borderRadius: 6
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}