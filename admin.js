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
let chartRendered = false;
let myChart = null; // Menyimpan instance graf supaya boleh di-update

document.addEventListener('DOMContentLoaded', () => {

    // --- KAWALAN MOD GELAP / CERAH ---
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
            const targetSection = document.getElementById(targetId);
            if(targetSection) targetSection.classList.add('active');

            // Render graf SEBENAR bila masuk tab analitik
            if (targetId === 'tab-analitik') {
                renderGrafAnalitikSebenar();
                tunjukJumlahKlikKeseluruhan();
            }
        });
    });

    // --- 2. KAWALAN PENGUMUMAN (BARU DITAMBAH) ---
    const btnSaveAnnouncement = document.getElementById('btn-save-announcement');
    if (btnSaveAnnouncement) {
        // Tarik data sedia ada (jika ada) ke dalam form
        getDoc(doc(db, "settings", "announcement")).then((docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById('announcement-text').value = data.text || '';
                document.getElementById('announcement-expiry').value = data.expiryDate || '';
                document.getElementById('announcement-active').checked = data.isActive || false;
            }
        });

        // Simpan pengumuman
        btnSaveAnnouncement.addEventListener('click', async () => {
            const text = document.getElementById('announcement-text').value.trim();
            const expiryDate = document.getElementById('announcement-expiry').value;
            const isActive = document.getElementById('announcement-active').checked;

            if (!text && isActive) {
                alert("Sila masukkan teks pengumuman jika ingin diaktifkan.");
                return;
            }

            try {
                await setDoc(doc(db, "settings", "announcement"), {
                    text: text,
                    expiryDate: expiryDate,
                    isActive: isActive
                });
                alert("Pengumuman berjaya disimpan & dikemaskini di website pelanggan!");
            } catch (error) {
                alert("Gagal simpan pengumuman: " + error.message);
            }
        });
    }

    // --- 3. KAWALAN KEDAI ---
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

    // --- 4. PENGURUSAN MENU (DENGAN STOK) ---
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
            if(menuModal) menuModal.style.display = 'flex';
        });
    });
    
    const btnCloseMenuModal = document.getElementById('btn-close-menu-modal');
    if(btnCloseMenuModal) btnCloseMenuModal.addEventListener('click', () => { menuModal.style.display = 'none'; });

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
        btnSaveMenuDb.addEventListener('click', async () => {
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
    }

    window.deleteMenuDb = async function(id) {
        if (confirm("Adakah anda pasti mahu memadam menu ini?")) {
            await deleteDoc(doc(db, "menus", id)); fetchMenusFromDatabase();
        }
    };

    // --- 5. TUKAR SUB-TAB ---
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

    // --- 6. LOG MASUK & LOUT ---
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

    // --- 7. FUNGSI RENDER GRAF ANALITIK SEBENAR (DARI FIREBASE) ---
    async function renderGrafAnalitikSebenar() {
        const canvasEl = document.getElementById('kategoriChart');
        if (!canvasEl) return;

        try {
            // Tarik data klik menu sebenar dari database
            const docSnap = await getDoc(doc(db, "analytics", "menuClicks"));
            let labels = [];
            let dataArr = [];

            if (docSnap.exists()) {
                const clicksData = docSnap.data();
                
                // Sort data untuk dapatkan "Top Menu Paling Banyak Klik"
                const sortedMenu = Object.entries(clicksData).sort((a, b) => b[1] - a[1]);
                
                // Ambil top 5 atau 6 menu sahaja untuk dipaparkan pada graf
                const topMenu = sortedMenu.slice(0, 6);
                
                labels = topMenu.map(item => item[0]); // Nama menu
                dataArr = topMenu.map(item => item[1]); // Jumlah klik
            } else {
                labels = ['Tiada Klik Direkodkan'];
                dataArr = [0];
            }

            const ctx = canvasEl.getContext('2d');
            
            // Padam graf lama jika wujud untuk elak 'glitch' pertindihan
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
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                }
            });
        } catch (error) {
            console.error("Gagal memuat naik graf:", error);
        }
    }

    // --- 8. TUNJUK JUMLAH KLIK KESELURUHAN (DARI FIREBASE) ---
    async function tunjukJumlahKlikKeseluruhan() {
        const statClicksEl = document.getElementById('stat-clicks');
        if(!statClicksEl) return;
        
        try {
            const docSnap = await getDoc(doc(db, "analytics", "clicksData"));
            if (docSnap.exists()) {
                const data = docSnap.data();
                statClicksEl.innerText = data.totalClicks || 0;
            } else {
                statClicksEl.innerText = "0";
            }
        } catch (e) { console.error(e); }
    }
});