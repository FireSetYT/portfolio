const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const serverless = require('serverless-http');
require('dotenv').config(); 

const app = express();

// --- 1. МАКСИМАЛЬНІ ЛІМІТИ ---
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 2. СХЕМИ ТА МОДЕЛІ ---
const CommentSchema = new mongoose.Schema({
    author: String,
    text: String,
    date: { type: String, default: () => new Date().toLocaleString('uk-UA') }
}, { _id: false });

const NewsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String, default: "" }, 
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

// --- 3. ПІДКЛЮЧЕННЯ ДО БД ---
const connectDB = async () => {
    if (mongoose.connections[0].readyState) return; 
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 15000,
            bufferCommands: false
        });
        console.log("✅ MongoDB підключено.");
    } catch (e) {
        console.error("❌ Помилка підключення:", e.message);
        throw e;
    }
};

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (e) {
        res.status(503).json({ success: false, message: "DB Error" });
    }
});

// --- 4. API МАРШРУТИ ---

// ПУБЛІКАЦІЯ (З ігноруванням помилок фото)
app.post('/api/news', async (req, res) => {
    const { title, content, image } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: "Заповніть текст" });

    try {
        // Спроба 1: Публікація з фото
        const newPost = new News({ title, content, image: image || "" });
        await newPost.save();
        return res.json({ success: true, message: "Опубліковано!" });
    } catch (e) {
        console.warn("⚠️ Помилка фото/пам'яті, публікую тільки текст:", e.message);
        try {
            // Спроба 2: Якщо фото не пройшло, публікуємо без нього
            const textOnlyPost = new News({ title, content, image: "" });
            await textOnlyPost.save();
            return res.json({ success: true, message: "Опубліковано (без фото через розмір)" });
        } catch (e2) {
            return res.status(500).json({ success: false, message: "Помилка сервера" });
        }
    }
});

app.get('/api/news', async (req, res) => {
    try {
        const news = await News.find({}).sort({ _id: -1 }).lean();
        res.json(news);
    } catch (e) {
        res.status(500).json([]);
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        const user = await User.findOne({ login, pass: password }).lean();
        if (user) res.json({ success: true, role: user.role, login: user.login });
        else res.json({ success: false, message: "Невірні дані" });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/news/comment', async (req, res) => {
    try {
        const { newsId, author, text } = req.body;
        await News.findByIdAndUpdate(newsId, { $push: { comments: { author, text } } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/ask', async (req, res) => {
    try {
        const { name, contact, question } = req.body;
        await new Question({ name, contact, question }).save();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// --- 5. ЕКСПОРТ ---
module.exports.handler = serverless(app);