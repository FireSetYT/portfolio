/* Файл: src/js/main.js */
const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- ЕЛЕМЕНТИ ---
    const burger = document.getElementById('burgerBtn');
    const nav = document.getElementById('navMenu');
    const closeBtn = document.getElementById('closeBtn');
    
    // Модалки
    const loginModal = document.getElementById('loginModal');
    const regModal = document.getElementById('regModal');
    
    // Кнопки
    const loginBtns = document.querySelectorAll('#loginBtn'); // Всі кнопки входу
    const logoutBtn = document.getElementById('logoutBtn');
    const adminBtn = document.getElementById('adminBtn');
    
    // --- ФУНКЦІЇ ---

    // 1. АВТОРИЗАЦІЯ (Вхід)
    const handleLogin = async () => {
        const login = document.getElementById('loginInput').value;
        const pass = document.getElementById('passInput').value;

        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ login, password: pass })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('role', data.role);
            location.reload();
        } else {
            alert('Помилка входу!');
        }
    };

    // 2. РЕЄСТРАЦІЯ (Нове!)
    const handleRegister = async () => {
        const email = document.getElementById('regEmail').value;
        const login = document.getElementById('regLogin').value;
        const pass = document.getElementById('regPass').value;

        if(!login || !pass) return alert('Заповніть поля!');

        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ login, password: pass, email })
        });
        const data = await res.json();

        if (data.success) {
            alert('Реєстрація успішна! Тепер увійдіть.');
            document.getElementById('regModal').classList.remove('active');
            document.getElementById('loginModal').classList.add('active'); // Відкриваємо вхід
        } else {
            alert(data.message);
        }
    };

    // 3. НОВИНИ (Працює тільки якщо є блок #newsFeed)
    const loadNews = async () => {
        const container = document.getElementById('newsFeed');
        if (!container) return; // Якщо ми не на сторінці новин — виходимо

        try {
            const res = await fetch(`${API_URL}/news`);
            const news = await res.json();
            container.innerHTML = news.map(item => `
                <div class="news-card" style="border:1px solid #ddd; padding:15px; margin-bottom:15px; border-radius:8px;">
                    <h3>${item.title}</h3>
                    <p>${item.content}</p>
                    <small style="color:gray">${item.date}</small>
                </div>
            `).join('');
        } catch (e) {
            container.innerHTML = 'Помилка сервера...';
        }
    };

    // 4. ПЕРЕВІРКА СТАТУСУ
    const checkAuth = () => {
        const role = localStorage.getItem('role');
        if (role) {
            loginBtns.forEach(b => b.style.display = 'none');
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (role === 'admin' && adminBtn) adminBtn.style.display = 'inline-block';
        }
    };

    // --- ЗАПУСК ---
    checkAuth();
    loadNews();

    // --- ПОДІЇ (КЛІКИ) ---
    
    // Відкриття меню
    if(burger) burger.addEventListener('click', () => nav.classList.add('active'));
    if(closeBtn) closeBtn.addEventListener('click', () => nav.classList.remove('active'));

    // Модалки
    loginBtns.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.classList.add('active');
    }));

    // Закриття модалок (клік по фону або хрестику)
    document.querySelectorAll('.modal-login__overlay, .modal-login__close').forEach(el => {
        el.addEventListener('click', () => {
            loginModal.classList.remove('active');
            regModal.classList.remove('active');
        });
    });

    // Перехід Вхід -> Реєстрація
    const toRegBtn = document.querySelector('.modal-login__reg-btn');
    if(toRegBtn) toRegBtn.addEventListener('click', () => {
        loginModal.classList.remove('active');
        regModal.classList.add('active');
    });

    // Кнопки форм
    const submitLogin = document.getElementById('submitLogin');
    if(submitLogin) submitLogin.addEventListener('click', handleLogin);

    const submitReg = document.getElementById('submitReg'); // ID для кнопки реєстрації
    if(submitReg) submitReg.addEventListener('click', handleRegister);

    // Вихід
    if(logoutBtn) logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        location.reload();
    });
});