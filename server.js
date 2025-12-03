/* Файл: server.js */
import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();

// 1. Дозволяємо запити з інших джерел
app.use(cors());

// 2. Збільшуємо ліміт для завантаження фото (до 10MB)
app.use(express.json({ limit: '10mb' }));

// 3. !!! ГОЛОВНЕ ВИПРАВЛЕННЯ !!!
// Цей рядок каже серверу: "Шукай index.html, css та картинки в папці public"
app.use(express.static('public'));

// --- БАЗА ДАНИХ (Файли) ---
const USERS_FILE = './users.json';
const NEWS_FILE = './news.json';
const QUESTIONS_FILE = './questions.json';

// --- Ініціалізація файлів (Створюємо, якщо їх немає) ---
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([{ login: 'admin', pass: '123', role: 'admin' }]));
}
if (!fs.existsSync(NEWS_FILE)) {
    fs.writeFileSync(NEWS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(QUESTIONS_FILE)) {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify([]));
}

// ===========================
//           API
// ===========================

// 1. ОТРИМАННЯ НОВИН
app.get('/news', (req, res) => {
    try {
        const news = JSON.parse(fs.readFileSync(NEWS_FILE));
        // Захист: додаємо пустий масив коментарів, якщо його раптом немає
        const safeNews = news.map(n => ({ 
            ...n, 
            comments: n.comments || [] 
        }));
        res.json(safeNews);
    } catch (e) {
        res.json([]);
    }
});

// 2. ДОДАВАННЯ НОВИНИ (Адмін)
app.post('/news', (req, res) => {
    try {
        const { title, content, image } = req.body;
        const news = JSON.parse(fs.readFileSync(NEWS_FILE));
        
        news.unshift({ 
            id: Date.now().toString(), // Унікальний ID
            title, 
            content, 
            image: image || null, // Фото або null
            date: new Date().toLocaleDateString(),
            comments: [] 
        });
        
        fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, message: "Помилка сервера" });
    }
});

// 3. ДОДАВАННЯ КОМЕНТАРЯ
app.post('/news/comment', (req, res) => {
    try {
        const { newsId, author, text } = req.body;
        const news = JSON.parse(fs.readFileSync(NEWS_FILE));

        // Шукаємо новину за ID
        const postIndex = news.findIndex(n => String(n.id) === String(newsId));

        if (postIndex !== -1) {
            if (!news[postIndex].comments) news[postIndex].comments = [];
            
            news[postIndex].comments.push({
                author,
                text,
                date: new Date().toLocaleString()
            });

            fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2));
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Новину не знайдено" });
        }
    } catch (e) {
        res.json({ success: false, message: "Помилка сервера" });
    }
});

// 4. ЗАПИТАННЯ (Ask)
app.post('/ask', (req, res) => {
    try {
        const { name, contact, question } = req.body;
        const questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE));
        
        questions.unshift({ 
            name, 
            contact, 
            question, 
            date: new Date().toLocaleString() 
        });
        
        fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false });
    }
});

app.get('/questions', (req, res) => {
    try {
        const questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE));
        res.json(questions);
    } catch (e) {
        res.json([]);
    }
});

// 5. АВТОРИЗАЦІЯ (Реєстрація)
app.post('/register', (req, res) => {
    try {
        const { login, password, email } = req.body;
        const users = JSON.parse(fs.readFileSync(USERS_FILE));
        
        if (users.find(u => u.login === login)) {
            return res.json({ success: false, message: "Користувач вже існує" });
        }
        
        users.push({ login, pass: password, email, role: 'user' });
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, message: "Помилка сервера" });
    }
});

// 6. АВТОРИЗАЦІЯ (Вхід)
app.post('/login', (req, res) => {
    try {
        const { login, password } = req.body;
        const users = JSON.parse(fs.readFileSync(USERS_FILE));
        const user = users.find(u => u.login === login && u.pass === password);
        
        if (user) {
            res.json({ success: true, role: user.role, login: user.login });
        } else {
            res.json({ success: false, message: "Невірні дані" });
        }
    } catch (e) {
        res.json({ success: false, message: "Помилка сервера" });
    }
});

// --- ЗАПУСК СЕРВЕРА ---
// Важливо для Render: використовувати process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер працює на порту ${PORT}`));