const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// --- СЕРВІСНИЙ БЛОК ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- 1. ЛОГІКА ПІДКЛЮЧЕННЯ (для Serverless) ---
const connectDB = async () => {
    // Якщо вже підключено (для гарячого старту), не підключатися повторно
    if (mongoose.connections[0].readyState) return; 
    
    try {
        // Використовує змінну середовища MONGO_URI
        await mongoose.connect(process.env.MONGO_URI); 
        console.log("MongoDB підключено.");
    } catch (e) {
        console.error("Помилка підключення MongoDB:", e);
    }
};

// Middleware: Підключаємося перед кожним маршрутом
app.use(async (req, res, next) => {
    await connectDB();
    next();
});
// ------------------------------------------------


// --- 2. СХЕМИ ТА МОДЕЛІ ---
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

// Моделі: Використовуються для CRUD операцій
const News = mongoose.models.News || mongoose.model('News', NewsSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
// ------------------------------------------------
// ===========================
//           3. API МАРШРУТИ
// ===========================

// 1. ОТРИМАННЯ НОВИН (GET /news)
app.get('/news', async (req, res) => {
    try {
        const news = await News.find({}).lean(); 
        res.json(news);
    } catch (e) {
        res.status(500).json([]);
    }
});

// 2. ДОДАВАННЯ НОВИНИ (POST /news)
app.post('/news', async (req, res) => {
    try {
        const { title, content, image } = req.body;
        const newPost = new News({ title, content, image });
        await newPost.save();
        res.json({ success: true, message: "Новина успішно додана" });
    } catch (e) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

// 3. ДОДАВАННЯ КОМЕНТАРЯ (POST /news/comment)
app.post('/news/comment', async (req, res) => {
    try {
        const { newsId, author, text } = req.body;
        const updatedNews = await News.findByIdAndUpdate(
            newsId,
            {
                $push: { 
                    comments: { author, text }
                }
            },
            { new: true }
        );

        if (!updatedNews) return res.json({ success: false, message: "Новину не знайдено" });
        res.json({ success: true, message: "Коментар додано" });
    } catch (e) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

// 4. ЗАПИТАННЯ (POST /ask)
app.post('/ask', async (req, res) => {
    try {
        const { name, contact, question } = req.body;
        const newQuestion = new Question({ name, contact, question });
        await newQuestion.save();
        res.json({ success: true, message: "Запитання успішно надіслано" });
    } catch (e) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

// 4.1 ОТРИМАННЯ ЗАПИТАНЬ (GET /questions)
app.get('/questions', async (req, res) => {
    try {
        const questions = await Question.find({}).lean();
        res.json(questions);
    } catch (e) {
        res.status(500).json([]);
    }
});


// 5. АВТОРИЗАЦІЯ (Реєстрація - POST /register)
app.post('/register', async (req, res) => {
    try {
        const { login, password, email } = req.body;
        const existingUser = await User.findOne({ login });
        if (existingUser) return res.json({ success: false, message: "Користувач з цим логіном вже існує" });
        
        const newUser = new User({ login, pass: password, email });
        await newUser.save();
        res.json({ success: true, message: "Користувач успішно зареєстрований" });
    } catch (e) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

// 6. АВТОРИЗАЦІЯ (Вхід - POST /login)
app.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        const user = await User.findOne({ login, pass: password });
        
        if (user) {
            res.json({ success: true, role: user.role, login: user.login });
        } else {
            res.json({ success: false, message: "Невірні логін або пароль" });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});


// --- ЕКСПОРТ ДЛЯ SERVERLESS-HTTP (КІНЕЦЬ app.js) ---
module.exports = app;