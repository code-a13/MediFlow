// server/index.js
const express = require('express');
const cors = require('cors');
const http = require('http'); // New import
const { Server } = require('socket.io'); // New import
const axios = require('axios'); // New import
const connectDB = require('./config/db');
const Prescription = require('./models/Prescription'); // Import your model
const Patient = require('./models/Patient'); // Import your model

const medicineList = require('./data/medicines');

const app = express();
const server = http.createServer(app); // Wrap Express

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your React frontend URL
    methods: ["GET", "POST"]
  }
});


app.use(express.json());
app.use(cors());

// Connect Database
connectDB();

// Routes
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

app.get('/api/drugs/search', (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        
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

app.get('/api/drugs/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    const results = medicineList.filter(med => med.toLowerCase().includes(q.toLowerCase()));
    res.json(results.slice(0, 10));
});

io.on('connection', (socket) => {
    console.log(`User connected to chat: ${socket.id}`);

    
        socket.join(prescriptionId);
        console.log(`Socket ${socket.id} joined room ${prescriptionId}`);
    });

    // 2. Patient sends a message
    socket.on('send_message', async (data) => {
        const { prescriptionId, text } = data;
        
        // Broadcast user message to room instantly (for UI)
        io.to(prescriptionId).emit('receive_message', { sender: 'patient', text });

        // GUARDRAIL: Emergency Detection
        const emergencyKeywords = ["blood", "bleeding", "chest pain", "fainted", "double dose", "overdose"];
        const isEmergency = emergencyKeywords.some(keyword => text.toLowerCase().includes(keyword));

        if (isEmergency) {
             io.to(prescriptionId).emit('receive_message', { 
                 sender: 'system', 
                 text: " EMERGENCY DETECTED: Please stop chatting and contact emergency services or visit the nearest hospital immediately. Your doctor has been notified." 
             });
             // Here you would add logic to trigger an alert on the Doctor's Dashboard
             return; 
        }

        try {
            // Fetch Context from MongoDB
            const rx = await Prescription.findById(prescriptionId).populate('patientId');
            if (!rx) throw new Error("Prescription not found");

            const contextPayload = {
                diagnosis: rx.diagnosis,
                medications: rx.medications,
                patientAge: new Date().getFullYear() - new Date(rx.patientId.dateOfBirth).getFullYear(),
            };

            // Call Python AI Service
            const aiResponse = await axios.post('http://localhost:8000/api/rag/chat', {
                query: text,
                context: contextPayload
            });

            // Emit AI response back to the patient
            io.to(prescriptionId).emit('receive_message', { 
                sender: 'ai', 
                text: aiResponse.data.answer 
            });

        } catch (error) {
            console.error("Chat Error:", error);
            io.to(prescriptionId).emit('receive_message', { 
                sender: 'system', 
                text: "Sorry, I am having trouble accessing your records right now. Please try again later." 
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Node Server running on port ${PORT}`));
// Make sure to listen on the 'server', not 'app'
server.listen(PORT, () => console.log(`🚀 Node & Socket Server running on port ${PORT}`));
