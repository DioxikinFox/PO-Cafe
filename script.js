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