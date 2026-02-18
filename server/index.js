const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// 👇 Import the medicine list
const medicineList = require('./data/medicines');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect Database
connectDB();

// Routes
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// --- ⚡ AUTO-COMPLETE MEDICINE ROUTE ---
app.get('/api/drugs/search', (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        // Filter list (Case Insensitive)
        const results = medicineList.filter(med => 
            med.toLowerCase().includes(q.toLowerCase())
        );

        // Return top 10 matches
        res.json(results.slice(0, 10));
    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ error: "Search failed" });
    }
});


// Add this route
app.get('/api/drugs/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    const results = medicineList.filter(med => med.toLowerCase().includes(q.toLowerCase()));
    res.json(results.slice(0, 10));
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Node Server running on port ${PORT}`));