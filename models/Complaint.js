const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', complaintSchema);