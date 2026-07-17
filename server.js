const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const notificationRoutes = require('./notification-routes');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ YOUR MONGODB CONNECTION - WORKING!
const MONGODB_URI = 'mongodb+srv://diptofreelancedesigner_db_user:XCUA8g2Rvn6Sk8bV@clifydb.a3wkhyc.mongodb.net/clifyDB?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to clifyDB'))
    .catch(err => console.log('❌ MongoDB error:', err.message));

// User Schema
const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    userId: String,
    createdAt: Date
});

const UserDataSchema = new mongoose.Schema({
    userId: String,
    blockedVideos: Object,
    keywords: Array,
    lastSync: Date
});

const User = mongoose.model('User', UserSchema);
const UserData = mongoose.model('UserData', UserDataSchema);

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const exists = await User.findOne({ username });
        if (exists) return res.json({ error: 'Username exists' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = 'CLY' + Date.now();
        
        const user = new User({ username, password: hashedPassword, userId, createdAt: new Date() });
        await user.save();
        
        const userData = new UserData({ userId, blockedVideos: {}, keywords: [], lastSync: new Date() });
        await userData.save();
        
        const token = jwt.sign({ userId, username }, 'clify-secret-2026');
        
        res.json({ 
            success: true, 
            token, 
            userId, 
            username,
            dashboardUrl: `https://diptodesign.github.io/cdashboard/v7/dashboard/${userId}`
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) return res.json({ error: 'User not found' });
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.json({ error: 'Wrong password' });
        
        const token = jwt.sign({ userId: user.userId, username }, 'clify-secret-2026');
        
        res.json({ 
            success: true, 
            token, 
            userId: user.userId, 
            username,
            dashboardUrl: `https://diptodesign.github.io/cdashboard/v7/dashboard/${user.userId}`
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Get user data
app.get('/api/data/:userId', async (req, res) => {
    const data = await UserData.findOne({ userId: req.params.userId });
    res.json({ success: true, data });
});

// Sync data
app.post('/api/sync', async (req, res) => {
    const { userId, data } = req.body;
    await UserData.findOneAndUpdate(
        { userId },
        { ...data, lastSync: new Date() },
        { upsert: true }
    );
    res.json({ success: true });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online', 
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        time: new Date().toISOString()
    });
});

// Ping (used by extension keep-alive)
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', time: Date.now() });
});

// Notification routes
app.use('/api', notificationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});