// server.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(bodyParser.json()); // To parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true })); // To parse URL-encoded request bodies

// Session middleware configuration
app.use(session({
    secret: 'your_secret_key_for_sessions_mad_dreams', // IMPORTANT: Replace with a strong, random string in production
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // Session lasts 24 hours
        secure: false // Set to true if using HTTPS
    }
}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- In-memory Data Stores (for demonstration purposes) ---
// In a real application, you would use a database (e.g., MongoDB, PostgreSQL)
let appointments = [
    { _id: uuidv4(), time: '10:00 AM, Aug 10', clientName: 'John Doe', typeOfService: 'Deep Cleaning', cleanerAssigned: 'Alice' },
    { _id: uuidv4(), time: '02:00 PM, Aug 12', clientName: 'Jane Smith', typeOfService: 'Office Cleaning', cleanerAssigned: 'Bob' }
];
let clients = [
    { _id: uuidv4(), name: 'John Doe', address: '123 Main St', contactNumber: '555-1234' },
    { _id: uuidv4(), name: 'Jane Smith', address: '456 Oak Ave', contactNumber: '555-5678' }
];
let complaints = [
    { _id: uuidv4(), senderName: 'Customer A', senderEmail: 'a@example.com', message: 'The cleaner was late.', createdAt: new Date() },
    { _id: uuidv4(), senderName: 'Customer B', senderEmail: 'b@example.com', message: 'Great service!', createdAt: new Date() }
];

// --- Admin Credentials (Hardcoded for simplicity) ---
const ADMIN_USERNAME = 'paulworkcc';
const ADMIN_PASSWORD = 'adminpaul9612';

// --- Authentication Middleware ---
// This middleware checks if the user is logged in as an admin.
const isAuthenticated = (req, res, next) => {
    if (req.session.isAdmin) {
        next(); // User is authenticated, proceed to the next middleware/route handler
    } else {
        // If not authenticated, send a 401 Unauthorized response for API calls,
        // or redirect to the login page for direct page access.
        if (req.xhr || req.headers.accept.includes('json')) { // Check if it's an AJAX request
            res.status(401).json({ message: 'Unauthorized. Please log in.' });
        } else {
            res.redirect('/admin-login.html');
        }
    }
};

// --- Routes ---

// Admin Login Endpoint
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true; // Set session variable to mark user as logged in
        res.status(200).json({ message: 'Login successful!', redirect: '/admin.html' });
    } else {
        res.status(401).json({ message: 'Invalid User ID or Password.' });
    }
});

// Admin Logout Endpoint
app.post('/admin/logout', isAuthenticated, (req, res) => {
    req.session.destroy(err => { // Destroy the session
        if (err) {
            return res.status(500).json({ message: 'Could not log out, please try again.' });
        }
        res.status(200).json({ message: 'Logged out successfully.', redirect: '/' }); // Redirect to public site
    });
});

// --- Admin Dashboard API Endpoints (Protected by isAuthenticated middleware) ---

// Create Appointment
app.post('/admin/appointments', isAuthenticated, (req, res) => {
    const { time, clientName, typeOfService, cleanerAssigned } = req.body;
    if (!time || !clientName || !typeOfService || !cleanerAssigned) {
        return res.status(400).json({ message: 'All appointment fields are required.' });
    }
    const newAppointment = { _id: uuidv4(), time, clientName, typeOfService, cleanerAssigned };
    appointments.push(newAppointment);
    res.status(201).json({ message: 'Appointment added successfully!', appointment: newAppointment });
});

// Delete Appointment
app.delete('/admin/appointments/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const initialLength = appointments.length;
    appointments = appointments.filter(app => app._id !== id); // Filter out the deleted appointment
    if (appointments.length < initialLength) {
        res.status(200).json({ message: 'Appointment deleted successfully.' });
    } else {
        res.status(404).json({ message: 'Appointment not found.' });
    }
});

// Add Client
app.post('/admin/clients', isAuthenticated, (req, res) => {
    const { name, address, contactNumber } = req.body;
    if (!name || !address || !contactNumber) {
        return res.status(400).json({ message: 'All client fields are required.' });
    }
    const newClient = { _id: uuidv4(), name, address, contactNumber };
    clients.push(newClient);
    res.status(201).json({ message: 'Client added successfully!', client: newClient });
});

// Get All Clients
app.get('/admin/clients', isAuthenticated, (req, res) => {
    res.status(200).json(clients);
});

// Get All Complaints/Messages
app.get('/admin/complaints', isAuthenticated, (req, res) => {
    // Sort complaints by creation date, newest first
    const sortedComplaints = [...complaints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json(sortedComplaints);
});

// Delete Complaint/Message
app.delete('/admin/complaints/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const initialLength = complaints.length;
    complaints = complaints.filter(comp => comp._id !== id);
    if (complaints.length < initialLength) {
        res.status(200).json({ message: 'Complaint/message deleted successfully.' });
    } else {
        res.status(404).json({ message: 'Complaint/message not found.' });
    }
});

// --- Public API Endpoints ---

// Get Appointments (for public display on index.html)
app.get('/api/appointments', (req, res) => {
    res.status(200).json(appointments);
});

// Contact Form Submission (saves as a complaint/message)
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All contact form fields are required.' });
    }
    const newComplaint = { _id: uuidv4(), senderName: name, senderEmail: email, message, createdAt: new Date() };
    complaints.push(newComplaint);
    res.status(200).json({ message: 'Your message has been sent successfully!' });
});

// --- Serve HTML files directly ---
// These routes ensure that if a user tries to access /admin.html directly without being logged in,
// the isAuthenticated middleware will redirect them to /admin-login.html.
app.get('/admin.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin-login.html', (req, res) => {
    // If already logged in, redirect to admin dashboard
    if (req.session.isAdmin) {
        return res.redirect('/admin.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all for other routes (e.g., 404 Not Found)
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin Login Page: http://localhost:${PORT}/admin-login.html`);
    console.log(`Public Site: http://localhost:${PORT}/`);
});