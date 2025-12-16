/* Файл: public/js/main.js - Повна робоча версія */

// ЗМІНА 1: Використовуємо відносний шлях, щоб коректно працювати локально та на Netlify.
const API_BASE = '/api'; 

document.addEventListener('DOMContentLoaded', () => {

    // --- ЗМІННІ (Перевірте, чи ці ID збігаються з вашим HTML!) ---
    const burger = document.getElementById('burgerBtn');
    const nav = document.getElementById('navMenu');
    const closeNavBtn = document.getElementById('closeBtn');
    
    // Кнопки в Header
    const headerLoginBtn = document.getElementById('loginBtn');
    const headerLogoutBtn = document.getElementById('logoutBtn');
    const headerAdminBtn = document.getElementById('adminBtn');

    // Модальні вікна
    const loginModal = document.getElementById('loginModal');
    const regModal = document.getElementById('regModal');
    const askModal = document.getElementById('askModal');
    const warningModal = document.getElementById('authWarningModal');
    const askBtn = document.getElementById('askBtn');

    // --- ФУНКЦІЇ ---
    const openModal = (modal) => {
        // Закриваємо всі модальні вікна перед відкриттям нового
        document.querySelectorAll('.modal-login').forEach(m => m.classList.remove('active'));
        if(modal) modal.classList.add('active');
    };
    
    const closeModal = () => {
        // Закриваємо всі модальні вікна
        document.querySelectorAll('.modal-login').forEach(m => m.classList.remove('active'));
    };

    // --- ЛОГІКА АВТОРИЗАЦІЇ ---
    const checkAuth = () => {
        const role = localStorage.getItem('role');
        const username = localStorage.getItem('username');
        
        if (role) {
            // КОРИСТУВАЧ УВІЙШОВ
            if(headerLoginBtn) headerLoginBtn.style.display = 'none';
            if(headerLogoutBtn) {
                headerLogoutBtn.style.display = 'inline-block';
                headerLogoutBtn.innerText = `Вихід (${username || role})`;
            }
            // ЛОГІКА АДМІНА: відображаємо, якщо роль = 'admin'
            if(role === 'admin' && headerAdminBtn) headerAdminBtn.style.display = 'inline-block';
        } else {
            // КОРИСТУВАЧ НЕ УВІЙШОВ
            if(headerLoginBtn) headerLoginBtn.style.display = 'inline-block';
            if(headerLogoutBtn) headerLogoutBtn.style.display = 'none';
            if(headerAdminBtn) headerAdminBtn.style.display = 'none';
        }
    };

    // --- ЗАВАНТАЖЕННЯ НОВИН ---
    const loadNews = async () => {
        const container = document.getElementById('newsFeed');
        if (!container) return; // Не вантажимо, якщо ми не на сторінці news.html

        try {
            const res = await fetch(`${API_BASE}/news`); 
            const news = await res.json();
            const role = localStorage.getItem('role');

            if (news.length === 0) {
                container.innerHTML = '<p style="color: #000;">Новин поки немає.</p>';
                return;
            }

            container.innerHTML = news.map(item => {
                const itemId = item._id; 

                // Рендеринг коментарів
                const commentsHTML = (item.comments || []).map(c => `
                    <div style="background: #f9f9f9; padding: 10px; margin-bottom: 5px; border-radius: 5px; font-size: 14px; color: #000;">
                        <strong style="color: ${c.author === 'Адміністратор' ? '#e74c3c' : '#2980b9'};">
                            ${c.author}
                        </strong> 
                        <span style="color:#000; font-size:12px;">(${c.date})</span><br>
                        ${c.text}
                    </div>
                `).join('');

                // Поле вводу коментаря
                let inputArea = '';
                if (role) {
                    inputArea = `
                        <div style="margin-top: 15px; display: flex; gap: 10px;">
                            <input type="text" id="input-${itemId}" placeholder="Ваш коментар..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <button class="send-btn" data-id="${itemId}" style="padding: 8px 15px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Send</button>
                        </div>
                    `;
                } else {
                    inputArea = `<p style="margin-top:15px; font-size:13px; color:#000;">🔒 <span class="login-trigger" style="color:blue; cursor:pointer; text-decoration:underline;">Увійдіть</span>, щоб коментувати.</p>`;
                }

                const imageHTML = item.image ? 
                    `<img src="${item.image}" style="width: 100%; height: 350px; object-fit: cover; border-radius: 8px; margin-bottom: 15px; display: block; background: #f0f0f0;">` 
                    : '';

                return `
                    <div class="news-card" style="background:#fff; border:1px solid #eee; padding:20px; margin-bottom:20px; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                        ${imageHTML}
                        <h2 style="margin-top:0; color: #000;">${item.title}</h2>
                        <p style="color:#000; line-height:1.6;">${item.content}</p>
                        <small style="color:#000;">📅 ${item.date}</small>
                        <hr style="margin: 15px 0; border:0; border-top:1px solid #eee;">
                        <h4 style="margin:0 0 10px; color: #000;">Коментарі:</h4>
                        <div class="comments-list">${commentsHTML || '<i style="color:#000">Немає коментарів</i>'}</div>
                        ${inputArea}
                    </div>
                `;
            }).join('');

            // Прив'язка обробників коментарів
            document.querySelectorAll('.send-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const newsId = e.target.getAttribute('data-id'); 
                    const input = document.getElementById(`input-${newsId}`);
                    const text = input.value;
                    
                    const currentRole = localStorage.getItem('role');
                    let author = currentRole === 'admin' ? 'Адміністратор' : (localStorage.getItem('username') || 'Користувач');

                    if (!text) return alert('Напишіть текст!');

                    const res = await fetch(`${API_BASE}/news/comment`, { 
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ newsId, author, text })
                    });
                    
                    const json = await res.json();
                    if(json.success) { 
                        input.value = ''; 
                    } else {
                        alert(json.message || 'Помилка додавання коментаря.');
                    }
                    loadNews(); // Оновлюємо стрічку новин
                });
            });

            // Прив'язка обробників "Увійдіть"
            document.querySelectorAll('.login-trigger').forEach(l => l.addEventListener('click', () => openModal(loginModal)));

        } catch (e) {
            console.error(e);
            container.innerHTML = '<p style="color:red">Помилка завантаження новин. Перевірте консоль Express.</p>';
        }
    };

    // --- ОСНОВНА ЛОГІКА ЗАПУСКУ ---
    checkAuth();
    loadNews(); // Запускаємо завантаження новин, якщо ми на сторінці з контейнером 'newsFeed'

    // --- ОБРОБНИКИ ДІЙ ---

    // Навігація
    if(burger) burger.addEventListener('click', () => { nav.classList.add('active'); burger.classList.add('active'); });
    if(closeNavBtn) closeNavBtn.addEventListener('click', () => { nav.classList.remove('active'); burger.classList.remove('active'); });
    
    // ВІДКРИТТЯ ВХОДУ (з шапки)
    if(headerLoginBtn) headerLoginBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(loginModal); });
    
    // ВИХІД
    if(headerLogoutBtn) headerLogoutBtn.addEventListener('click', (e) => { e.preventDefault(); localStorage.clear(); location.reload(); });
    
    // КНОПКА "ЗАДАТИ ПИТАННЯ"
    if(askBtn) askBtn.addEventListener('click', (e) => { e.preventDefault(); localStorage.getItem('role') ? openModal(askModal) : openModal(warningModal); }); 


    // --- УНІВЕРСАЛЬНИЙ ОБРОБНИК ФОРМ ---
    const handleForm = async (btnId, url, getData, successMsg, afterFn) => {
        const btn = document.getElementById(btnId);
        if(!btn) return;
        btn.addEventListener('click', async (e) => {
            e.preventDefault(); 
            const data = getData();
            if(!data) return;
            try {
                const res = await fetch(`${API_BASE}${url}`, { 
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'}, 
                    body: JSON.stringify(data) 
                }); 
                const json = await res.json();
                if(json.success) { 
                    if(successMsg) alert(successMsg); 
                    if(afterFn) afterFn(json); 
                } 
                else { alert(json.message || 'Помилка'); }
            } catch(e) { 
                console.error(e); 
                alert('Сервер не відповідає. Перевірте консоль Express.'); 
            }
        });
    };

    // ВХІД
    handleForm('submitLogin', '/login', 
        () => ({ login: document.getElementById('loginInput').value, password: document.getElementById('passInput').value }),
        null, 
        (data) => { 
            localStorage.setItem('role', data.role); 
            localStorage.setItem('username', data.login); 
            location.reload(); 
        }
    );

    // РЕЄСТРАЦІЯ
    handleForm('submitReg', '/register', 
        () => { 
            const l = document.getElementById('regLogin').value, p = document.getElementById('regPass').value, e = document.getElementById('regEmail').value; 
            return l && p ? { login: l, password: p, email: e } : (alert('Заповніть логін та пароль') && null); 
        }, 
        'Успішно! Тепер увійдіть.', 
        () => openModal(loginModal)
    );

    // НАДІСЛАННЯ ЗАПИТАННЯ
    handleForm('submitAsk', '/ask', 
        () => { 
            const n = document.getElementById('askName').value, c = document.getElementById('askContact').value, q = document.getElementById('askText').value; 
            return n && c && q ? { name: n, contact: c, question: q } : (alert('Заповніть всі поля') && null); 
        }, 
        'Запитання надіслано!', 
        () => { 
            // Очищаємо поля та закриваємо
            document.getElementById('askText').value=''; 
            document.getElementById('askName').value=''; 
            document.getElementById('askContact').value=''; 
            closeModal(); 
        }
    );

    // --- ЗАКРИТТЯ ТА ПЕРЕХОДИ МІЖ МОДАЛЬНИМИ ВІКНАМИ ---
    
    // Універсальне закриття
    document.querySelectorAll('.modal-login__close, .modal-login__overlay').forEach(el => el.addEventListener('click', closeModal));
    
    // Перехід Реєстрація -> Вхід
    const toReg = document.querySelector('.modal-login__reg-btn'); 
    if(toReg && toReg.id !== 'submitReg') toReg.addEventListener('click', (e) => { 
        e.preventDefault(); 
        openModal(regModal); 
    });
    
    // Перехід з попередження на Вхід
    const toLogin = document.getElementById('goToLoginFromWarning'); 
    if(toLogin) toLogin.addEventListener('click', () => openModal(loginModal));
    
    // Перехід з попередження на Реєстрацію
    const toRegFromWarning = document.getElementById('goToRegFromWarning'); 
    if(toRegFromWarning) toRegFromWarning.addEventListener('click', () => openModal(regModal));
});