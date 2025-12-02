/* Файл: server.js */
import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = './users.json';
const NEWS_FILE = './news.json';

// === Перевірка файлів ===
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([{ login: 'admin', pass: '123', role: 'admin' }]));
}
if (!fs.existsSync(NEWS_FILE)) {
    fs.writeFileSync(NEWS_FILE, JSON.stringify([{ title: "Старт", content: "Сайт працює!", date: "02.12.2025" }]));
}

// === API ===

// 1. РЕЄСТРАЦІЯ (Нове!)
app.post('/register', (req, res) => {
    const { login, password, email } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE));

    // Перевірка, чи такий логін вже є
    if (users.find(u => u.login === login)) {
        return res.json({ success: false, message: "Такий користувач вже існує!" });
    }

    // Додаємо нового (роль завжди 'user')
    users.push({ login, pass: password, email, role: 'user' });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    res.json({ success: true });
});

// 2. ВХІД
app.post('/login', (req, res) => {
    const { login, password } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE));
    const user = users.find(u => u.login === login && u.pass === password);
    
    if (user) res.json({ success: true, role: user.role });
    else res.json({ success: false });
});

// 3. НОВИНИ
app.get('/news', (req, res) => {
    const news = JSON.parse(fs.readFileSync(NEWS_FILE));
    res.json(news);
});

app.post('/news', (req, res) => {
    const { title, content } = req.body;
    const news = JSON.parse(fs.readFileSync(NEWS_FILE));
    news.unshift({ title, content, date: new Date().toLocaleDateString() });
    fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2));
    res.json({ success: true });
});

app.listen(3000, () => console.log('Сервер: http://localhost:3000'));