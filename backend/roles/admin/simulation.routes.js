const express = require('express');
const router = express.Router();
const socket = require('../../core/socket');

// Simulate various system events
router.post('/', (req, res) => {
    const { type } = req.body;
    let io;
    try {
        io = socket.getIO();
    } catch (e) {
        return res.status(500).json({ success: false, message: "Socket not initialized" });
    }

    let eventData = {};
    let eventName = '';

    switch (type) {
        case 'appointment':
            eventName = 'new-appointment';
            eventData = {
                id: Math.floor(Math.random() * 10000),
                patientName: ['John Doe', 'Jane Smith', 'Alice Johnson'][Math.floor(Math.random() * 3)],
                doctorName: ['Dr. Sagar', 'Dr. Patel', 'Dr. Lee'][Math.floor(Math.random() * 3)],
                time: new Date().toLocaleTimeString(),
                status: 'pending'
            };
            break;
        case 'user':
            eventName = 'user-registered';
            eventData = {
                id: Math.floor(Math.random() * 10000),
                name: ['New User 1', 'New User 2'][Math.floor(Math.random() * 2)],
                role: ['patient', 'doctor'][Math.floor(Math.random() * 2)],
                timestamp: new Date().toISOString()
            };
            break;
        case 'emergency':
            eventName = 'emergency-alert';
            eventData = {
                id: Math.floor(Math.random() * 10000),
                message: 'Emergency reported in Ward A',
                severity: 'high',
                timestamp: new Date().toISOString()
            };
            break;
        default:
            return res.status(400).json({ success: false, message: 'Invalid event type' });
    }

    io.emit(eventName, eventData);
    res.json({ success: true, message: `Emitted ${eventName}`, data: eventData });
});

module.exports = router;