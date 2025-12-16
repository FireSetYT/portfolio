const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // Обов'язково встановіть npm install dotenv

// --- 1. Ініціалізація та конфігурація ---
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (проміжне ПЗ)
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Для обробки JSON-тіл запитів
app.use(express.urlencoded({ extended: true })); // Для обробки даних форм

// --- 2. Налаштування статичних файлів ---
// Обслуговування файлів із папки 'public' (HTML, CSS, JS, зображення)
app.use(express.static(path.join(__dirname, 'public')));

console.log('Скрипт app.js розпочав виконання.'); 

// --- 3. СХЕМИ ТА МОДЕЛІ ---
const CommentSchema = new mongoose.Schema({
    author: String,
    text: String,
    date: { type: String, default: () => new Date().toLocaleString('uk-UA') }
}, { _id: false });

const NewsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: String,
    date: { type: String, default: () => new Date().toLocaleDateString('uk-UA') },
    comments: [CommentSchema]
});

const UserSchema = new mongoose.Schema({
    login: { type: String, required: true, unique: true },
    pass: { type: String, required: true },
    email: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

const QuestionSchema = new mongoose.Schema({
    name: String,
    contact: String,
    question: String,
    date: { type: String, default: () => new Date().toLocaleString('uk-UA') }
});

const News = mongoose.models.News || mongoose.model('News', NewsSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
// ------------------------------------------------


// ===========================
//       4. API МАРШРУТИ (/api/...)
// ===========================

// 1. ОТРИМАННЯ НОВИН (GET /api/news)
app.get('/api/news', async (req, res) => {
    try {
        const news = await News.find({}).lean(); 
        res.json(news);
    } catch (e) {
        console.error('Помилка в /api/news:', e);
        res.status(500).json([]);
    }
});

// 2. ДОДАВАННЯ НОВИНИ (POST /api/news)
app.post('/api/news', async (req, res) => {
    try {
        const { title, content, image } = req.body;
        const newPost = new News({ title, content, image });
        await newPost.save();
        res.json({ success: true, message: "Новина успішно додана" });
    } catch (e) {
        console.error('Помилка в /api/news POST:', e);
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

// 3. ДОДАВАННЯ КОМЕНТАРЯ (POST /api/news/comment)
app.post('/api/news/comment', async (req, res) => {
    try {
        const { newsId, author, text } = req.body;
        const updatedNews = await News.findByIdAndUpdate(
            newsId,
            { $push: { comments: { author, text } } },
            { new: true }
        );

        if (!updatedNews) return res.json({ success: false, message: "Новину не знайдено" });
        res.json({ success: true, message: "Коментар додано" });
    } catch (e) {
        console.error('Помилка в /api/news/comment:', e);
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

// 4. ЗАПИТАННЯ (POST /api/ask)
app.post('/api/ask', async (req, res) => {
    try {
        const { name, contact, question } = req.body;
        const newQuestion = new Question({ name, contact, question });
        await newQuestion.save();
        res.json({ success: true, message: "Запитання успішно надіслано" });
    } catch (e) {
        console.error('Помилка в /api/ask:', e);
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

// 5. АВТОРИЗАЦІЯ (Реєстрація - POST /api/register)
app.post('/api/register', async (req, res) => {
    try {
        const { login, password, email } = req.body;
        const existingUser = await User.findOne({ login });
        if (existingUser) return res.json({ success: false, message: "Користувач з цим логіном вже існує" });
        
        const newUser = new User({ login, pass: password, email });
        await newUser.save();
        res.json({ success: true, message: "Користувач успішно зареєстрований" });
    } catch (e) {
        console.error('Помилка в /api/register:', e);
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

// 6. АВТОРИЗАЦІЯ (Вхід - POST /api/login)
app.post('/api/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        const user = await User.findOne({ login, pass: password });
        
        if (user) {
            // Передаємо role та login назад до фронтенду
            res.json({ success: true, role: user.role, login: user.login }); 
        } else {
            res.json({ success: false, message: "Невірні логін або пароль" });
        }
    } catch (e) {
        console.error('Помилка в /api/login:', e);
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});


// --- 5. Логіка підключення до MongoDB та запуск сервера ---
const startServer = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        console.error('❌ ПОМИЛКА: MONGO_URI не знайдено у змінних оточення.');
        console.error('Переконайтеся, що ви створили файл .env у корені проекту.');
        return;
    }

    try {
        // Підключення до бази даних
        await mongoose.connect(mongoUri); 
        console.log('✅ MongoDB підключено.'); 

        // Запуск Express-сервера
        app.listen(PORT, () => {
            console.log(`🚀 Сервер Express запущено на порту ${PORT}`);
            console.log(`🔗 Локальна адреса: http://localhost:${PORT}/index.html`);
        });

    } catch (err) {
        // Обробка помилок підключення
        console.error('❌ ПОМИЛКА ПІДКЛЮЧЕННЯ ДО БД ТА ЗАПУСКУ СЕРВЕРА:');
        console.error(err.message);
        process.exit(1);
    }
};

startServer();