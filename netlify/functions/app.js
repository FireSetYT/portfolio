const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const serverless = require('serverless-http');
require('dotenv').config(); 

const app = express();

// --- 1. ПЕРЕГЛЯД MIDDLEWARE ---
app.use(cors());
// Збільшено ліміти для обробки великих фото в форматі Base64
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// --- 3. ПІДКЛЮЧЕННЯ ДО БД (SERVERLESS) ---
const connectDB = async () => {
    // Важливо для Serverless: перевіряємо, чи є вже активне з'єднання
    if (mongoose.connections[0].readyState) return; 
    
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI is missing");

    try {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000 // Швидка відмова при помилці з'єднання
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

app.get('/api/news', async (req, res) => {
    try {
        const news = await News.find({}).sort({ _id: -1 }).lean();
        res.json(news);
    } catch (e) {
        res.status(500).json([]);
    }
});

app.post('/api/news', async (req, res) => {
    try {
        const { title, content, image } = req.body;
        if (!title || !content) return res.status(400).json({ success: false, message: "Заповніть поля" });
        
        const newPost = new News({ title, content, image: image || "" });
        await newPost.save();
        res.json({ success: true, message: "Новина успішно додана!" });
    } catch (e) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

app.post('/api/news/comment', async (req, res) => {
    try {
        const { newsId, author, text } = req.body;
        const updated = await News.findByIdAndUpdate(
            newsId,
            { $push: { comments: { author, text } } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/ask', async (req, res) => {
    try {
        const { name, contact, question } = req.body;
        const newQ = new Question({ name, contact, question });
        await newQ.save();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        const user = await User.findOne({ login, pass: password });
        if (user) {
            res.json({ success: true, role: user.role, login: user.login });
        } else {
            res.json({ success: false, message: "Невірні дані" });
        }
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { login, password, email } = req.body;
        const exists = await User.findOne({ login });
        if (exists) return res.json({ success: false, message: "Логін зайнятий" });
        
        const newUser = new User({ login, pass: password, email });
        await newUser.save();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// --- 5. ЕКСПОРТ ---
module.exports.handler = serverless(app);