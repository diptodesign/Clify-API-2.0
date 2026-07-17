const express = require('express');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// ─── Notification Schema ──────────────────────────────────────
const NotificationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    link: { type: String, default: '' },
    priority: { type: String, default: 'normal' },
    target: { type: String, default: 'all' },
    read_count: { type: Number, default: 0 },
    created_at: { type: Number, default: Date.now },
    expires_at: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
});

const Notification = mongoose.model('Notification', NotificationSchema);

// ─── Auth middleware ───────────────────────────────────────────
const ADMIN_KEY = process.env.ADMIN_KEY || 'clify-admin-2026';

function requireAdmin(req, res, next) {
    const key = req.headers['x-admin-key'] || req.query.key;
    if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
    next();
}

// ─── PUBLIC: Extension polls this ─────────────────────────────
router.get('/notifications', async (req, res) => {
    try {
        const since = parseInt(req.query.since) || 0;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const notifications = await Notification.find({
            active: true,
            $or: [{ expires_at: 0 }, { expires_at: { $gt: Date.now() } }],
            created_at: { $gt: since }
        }).sort({ created_at: -1 }).limit(limit).lean();
        res.json({ notifications, serverTime: Date.now() });
    } catch (e) {
        res.json({ notifications: [], serverTime: Date.now() });
    }
});

router.get('/notifications/stats', async (req, res) => {
    try {
        const total = await Notification.countDocuments({ active: true });
        const reads = await Notification.aggregate([
            { $match: { active: true } },
            { $group: { _id: null, total: { $sum: '$read_count' } } }
        ]);
        res.json({ totalNotifications: total, totalReads: reads[0]?.total || 0 });
    } catch (e) {
        res.json({ totalNotifications: 0, totalReads: 0 });
    }
});

router.post('/notifications/:id/read', async (req, res) => {
    try {
        await Notification.updateOne({ id: req.params.id }, { $inc: { read_count: 1 } });
    } catch (e) {}
    res.json({ success: true });
});

// ─── ADMIN: CRUD ──────────────────────────────────────────────
router.get('/admin/notifications', requireAdmin, async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ created_at: -1 }).limit(200).lean();
        res.json({ notifications });
    } catch (e) {
        res.json({ notifications: [] });
    }
});

router.post('/admin/notifications', requireAdmin, async (req, res) => {
    try {
        const { title, message, type, link, priority, target, expires_at } = req.body;
        if (!title || !message) return res.status(400).json({ error: 'title and message required' });
        const id = uuidv4();
        const now = Date.now();
        await Notification.create({
            id, title, message,
            type: type || 'info',
            link: link || '',
            priority: priority || 'normal',
            target: target || 'all',
            created_at: now,
            expires_at: expires_at || 0,
            active: true
        });
        res.json({ success: true, id, created_at: now });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/admin/notifications/:id', requireAdmin, async (req, res) => {
    try {
        const existing = await Notification.findOne({ id: req.params.id });
        if (!existing) return res.status(404).json({ error: 'Not found' });
        const { title, message, type, link, priority, target, active, expires_at } = req.body;
        await Notification.updateOne({ id: req.params.id }, {
            $set: {
                title: title ?? existing.title,
                message: message ?? existing.message,
                type: type ?? existing.type,
                link: link ?? existing.link,
                priority: priority ?? existing.priority,
                target: target ?? existing.target,
                active: active ?? existing.active,
                expires_at: expires_at ?? existing.expires_at
            }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/admin/notifications/:id', requireAdmin, async (req, res) => {
    try {
        const r = await Notification.deleteOne({ id: req.params.id });
        if (r.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
const express = require('express');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// ─── Notification Schema ──────────────────────────────────────
const NotificationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    link: { type: String, default: '' },
    priority: { type: String, default: 'normal' },
    target: { type: String, default: 'all' },
    read_count: { type: Number, default: 0 },
    created_at: { type: Number, default: Date.now },
    expires_at: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
});

const Notification = mongoose.model('Notification', NotificationSchema);

// ─── Auth middleware ───────────────────────────────────────────
const ADMIN_KEY = process.env.ADMIN_KEY || 'clify-admin-2026';

function requireAdmin(req, res, next) {
    const key = req.headers['x-admin-key'] || req.query.key;
    if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
    next();
}

// ─── PUBLIC: Extension polls this ─────────────────────────────
router.get('/notifications', async (req, res) => {
    try {
        const since = parseInt(req.query.since) || 0;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const notifications = await Notification.find({
            active: true,
            $or: [{ expires_at: 0 }, { expires_at: { $gt: Date.now() } }],
            created_at: { $gt: since }
        }).sort({ created_at: -1 }).limit(limit).lean();
        res.json({ notifications, serverTime: Date.now() });
    } catch (e) {
        res.json({ notifications: [], serverTime: Date.now() });
    }
});

router.get('/notifications/stats', async (req, res) => {
    try {
        const total = await Notification.countDocuments({ active: true });
        const reads = await Notification.aggregate([
            { $match: { active: true } },
            { $group: { _id: null, total: { $sum: '$read_count' } } }
        ]);
        res.json({ totalNotifications: total, totalReads: reads[0]?.total || 0 });
    } catch (e) {
        res.json({ totalNotifications: 0, totalReads: 0 });
    }
});

router.post('/notifications/:id/read', async (req, res) => {
    try {
        await Notification.updateOne({ id: req.params.id }, { $inc: { read_count: 1 } });
    } catch (e) {}
    res.json({ success: true });
});

// ─── ADMIN: CRUD ──────────────────────────────────────────────
router.get('/admin/notifications', requireAdmin, async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ created_at: -1 }).limit(200).lean();
        res.json({ notifications });
    } catch (e) {
        res.json({ notifications: [] });
    }
});

router.post('/admin/notifications', requireAdmin, async (req, res) => {
    try {
        const { title, message, type, link, priority, target, expires_at } = req.body;
        if (!title || !message) return res.status(400).json({ error: 'title and message required' });
        const id = uuidv4();
        const now = Date.now();
        await Notification.create({
            id, title, message,
            type: type || 'info',
            link: link || '',
            priority: priority || 'normal',
            target: target || 'all',
            created_at: now,
            expires_at: expires_at || 0,
            active: true
        });
        res.json({ success: true, id, created_at: now });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/admin/notifications/:id', requireAdmin, async (req, res) => {
    try {
        const existing = await Notification.findOne({ id: req.params.id });
        if (!existing) return res.status(404).json({ error: 'Not found' });
        const { title, message, type, link, priority, target, active, expires_at } = req.body;
        await Notification.updateOne({ id: req.params.id }, {
            $set: {
                title: title ?? existing.title,
                message: message ?? existing.message,
                type: type ?? existing.type,
                link: link ?? existing.link,
                priority: priority ?? existing.priority,
                target: target ?? existing.target,
                active: active ?? existing.active,
                expires_at: expires_at ?? existing.expires_at
            }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/admin/notifications/:id', requireAdmin, async (req, res) => {
    try {
        const r = await Notification.deleteOne({ id: req.params.id });
        if (r.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
