const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    time: { type: String, required: true },
    clientName: { type: String, required: true },
    typeOfService: { type: String, required: true },
    cleanerAssigned: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);