/* Файл: server.js */
import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());

// ЗБІЛЬШЕНО ЛІМІТ ДО 10МБ (Щоб фото вантажились)
app.use(express.json({ limit: '10mb' }));

const USERS_FILE = './users.json';
const NEWS_FILE = './news.json';
const QUESTIONS_FILE = './questions.json';

// --- ІНІЦІАЛІЗАЦІЯ ФАЙЛІВ ---
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([{ login: 'admin', pass: '123', role: 'admin' }]));
}
if (!fs.existsSync(NEWS_FILE)) {
    fs.writeFileSync(NEWS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(QUESTIONS_FILE)) {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify([]));
}

// --- API ---

// 1. НОВИНИ
app.get('/news', (req, res) => {
    const news = JSON.parse(fs.readFileSync(NEWS_FILE));
    const safeNews = news.map(n => ({ ...n, comments: n.comments || [] }));
    res.json(safeNews);
});

app.post('/news', (req, res) => {
    const { title, content, image } = req.body;
    const news = JSON.parse(fs.readFileSync(NEWS_FILE));
    
    news.unshift({ 
        id: Date.now().toString(),
        title, 
        content, 
        image: image || null, 
        date: new Date().toLocaleDateString(),
        comments: [] 
    });
    
    fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2));
    res.json({ success: true });
});

// 2. КОМЕНТАРІ
app.post('/news/comment', (req, res) => {
    const { newsId, author, text } = req.body;
    const news = JSON.parse(fs.readFileSync(NEWS_FILE));
    const postIndex = news.findIndex(n => String(n.id) === String(newsId));

    if (postIndex !== -1) {
        if (!news[postIndex].comments) news[postIndex].comments = [];
        news[postIndex].comments.push({ author, text, date: new Date().toLocaleString() });
        fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2));
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "Новину не знайдено" });
    }
});

// 3. ЗАПИТАННЯ
app.post('/ask', (req, res) => {
    const { name, contact, question } = req.body;
    const questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE));
    questions.unshift({ name, contact, question, date: new Date().toLocaleString() });
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));
    res.json({ success: true });
});

app.get('/questions', (req, res) => {
    const questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE));
    res.json(questions);
});

// 4. АВТОРИЗАЦІЯ
app.post('/register', (req, res) => {
    const { login, password, email } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE));
    if (users.find(u => u.login === login)) return res.json({ success: false, message: "Користувач існує" });
    
    users.push({ login, pass: password, email, role: 'user' });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    res.json({ success: true });
});

app.post('/login', (req, res) => {
    const { login, password } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE));
    const user = users.find(u => u.login === login && u.pass === password);
    
    if (user) {
        res.json({ success: true, role: user.role, login: user.login });
    } else {
        res.json({ success: false, message: "Невірні дані" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер працює на порту ${PORT}`));