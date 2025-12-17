const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const serverless = require('serverless-http');
require('dotenv').config(); 

const app = express();

// --- 1. ПЕРЕГЛЯД MIDDLEWARE ---
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Дозволяє передавати великі зображення Base64
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- 2. СХЕМИ ТА МОДЕЛІ ---
const CommentSchema = new mongoose.Schema({
    author: String,
    text: String,
    date: { type: String, default: () => new Date().toLocaleString('uk-UA') }
}, { _id: false });

const NewsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String, default: "" }, // Виправлено для публікації без фото
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

// Перевірка існуючих моделей для уникнення помилок при гарячому перезавантаженні
const News = mongoose.models.News || mongoose.model('News', NewsSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);

// --- 3. ПІДКЛЮЧЕННЯ ДО БД (SERVERLESS) ---
const connectDB = async () => {
    if (mongoose.connections[0].readyState) return; 
    
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error("MONGO_URI is missing in environment variables.");
    }

    try {
        await mongoose.connect(mongoUri);
        console.log("✅ MongoDB підключено.");
    } catch (e) {
        console.error("❌ Помилка підключення до БД:", e.message);
        throw e;
    }
};

// Middleware для підключення до БД перед кожним маршрутом
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (e) {
        res.status(503).json({ success: false, message: "Сервіс тимчасово недоступний (DB)" });
    }
});

// --- 4. API МАРШРУТИ ---

// Отримання всіх новин (нові зверху)
app.get('/api/news', async (req, res) => {
    try {
        const news = await News.find({}).sort({ _id: -1 }).lean();
        res.json(news);
    } catch (e) {
        res.status(500).json([]);
    }
});

// Додавання новини з адмін-панелі
app.post('/api/news', async (req, res) => {
    try {
        const { title, content, image } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: "Заголовок та текст обов'язкові" });
        }
        
        const newPost = new News({ 
            title, 
            content, 
            image: image || "" // Якщо фото не вибрано, зберігаємо порожній рядок
        });
        
        await newPost.save();
        res.json({ success: true, message: "Новина успішно додана!" });
    } catch (e) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

// Додавання коментаря
app.post('/api/news/comment', async (req, res) => {
    try {
        const { newsId, author, text } = req.body;
        const updated = await News.findByIdAndUpdate(
            newsId,
            { $push: { comments: { author, text } } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: "Новину не знайдено" });
        res.json({ success: true, message: "Коментар додано" });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// Форма зворотного зв'язку
app.post('/api/ask', async (req, res) => {
    try {
        const { name, contact, question } = req.body;
        const newQ = new Question({ name, contact, question });
        await newQ.save();
        res.json({ success: true, message: "Запитання надіслано" });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// Вхід користувача/адміна
app.post('/api/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        const user = await User.findOne({ login, pass: password });
        
        if (user) {
            res.json({ success: true, role: user.role, login: user.login });
        } else {
            res.json({ success: false, message: "Невірний логін або пароль" });
        }
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// Реєстрація
app.post('/api/register', async (req, res) => {
    try {
        const { login, password, email } = req.body;
        const exists = await User.findOne({ login });
        if (exists) return res.json({ success: false, message: "Користувач вже існує" });
        
        const newUser = new User({ login, pass: password, email });
        await newUser.save();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// --- 5. ЕКСПОРТ ДЛЯ NETLIFY FUNCTIONS ---
module.exports.handler = serverless(app);