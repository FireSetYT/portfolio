document.addEventListener('DOMContentLoaded', () => {
    
    // --- ЗМІННІ ---
    const burger = document.getElementById('burgerBtn');
    const closeBtn = document.getElementById('closeBtn');
    const nav = document.getElementById('navMenu');
    
    // Модальні вікна
    const loginModal = document.getElementById('loginModal');
    const loginOverlay = document.getElementById('loginOverlay');
    const regModal = document.getElementById('regModal');
    const regOverlay = document.getElementById('regOverlay');
    
    // Кнопки закриття (ХРЕСТИКИ)
    // Шукаємо хрестик всередині кожного вікна
    const closeLoginX = document.querySelector('#loginModal .modal-login__close');
    const closeRegX = document.querySelector('#regModal .modal-login__close');

    // Кнопки відкриття/перемикання
    const loginBtns = document.querySelectorAll('.header__btn-login');
    const switchToRegBtn = document.querySelector('#loginModal .modal-login__reg-btn');

    // --- ФУНКЦІЇ ---

    const closeMobileMenu = () => {
        if (nav) nav.classList.remove('active');
        if (burger) burger.classList.remove('active');
    };

    const openLogin = (e) => {
        if (e) e.preventDefault();
        closeMobileMenu(); // Закриваємо меню
        if (loginModal) loginModal.classList.add('active');
    };

    const closeLogin = () => {
        if (loginModal) loginModal.classList.remove('active');
    };

    const openReg = () => {
        if (regModal) regModal.classList.add('active');
    };

    const closeReg = () => {
        if (regModal) regModal.classList.remove('active');
    };

    // --- ОБРОБНИКИ ПОДІЙ ---

    // Бургер
    if (burger) burger.addEventListener('click', () => {
        nav.classList.add('active');
        burger.classList.add('active');
    });

    if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);

    // Вхід (відкриття)
    loginBtns.forEach(btn => btn.addEventListener('click', openLogin));

    // Вхід (закриття)
    if (loginOverlay) loginOverlay.addEventListener('click', closeLogin);
    if (closeLoginX) closeLoginX.addEventListener('click', closeLogin); // Клік на хрестик

    // Перехід на Реєстрацію
    if (switchToRegBtn) {
        switchToRegBtn.addEventListener('click', () => {
            closeLogin(); // Закриваємо Вхід
            setTimeout(() => {
                openReg(); // Відкриваємо Реєстрацію (миттєво)
            }, 50); // Мікро-затримка для плавності CSS (не обов'язково, але виглядає краще)
        });
    }

    // Реєстрація (закриття)
    if (regOverlay) regOverlay.addEventListener('click', closeReg);
    if (closeRegX) closeRegX.addEventListener('click', closeReg); // Клік на хрестик
});