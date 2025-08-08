document.addEventListener('DOMContentLoaded', () => {
    const sections = {
        createAppointment: document.getElementById('createAppointmentSection'),
        addClient: document.getElementById('addClientSection'),
        showClients: document.getElementById('showClientsSection'),
        complaintsReport: document.getElementById('complaintsReportSection')
    };

    const navButtons = {
        createAppointment: document.getElementById('createAppointmentBtn'),
        addClient: document.getElementById('addClientBtn'),
        showClients: document.getElementById('showClientsBtn'),
        complaintsReport: document.getElementById('complaintsReportBtn'),
        adminLogout: document.getElementById('adminLogoutBtn')
    };

    const createAppointmentForm = document.getElementById('createAppointmentForm');
    const createAppointmentMessage = document.getElementById('createAppointmentMessage');
    const currentAppointmentsList = document.getElementById('currentAppointmentsList');

    const addClientForm = document.getElementById('addClientForm');
    const addClientMessage = document.getElementById('addClientMessage');
    const clientsList = document.getElementById('clientsList');

    const complaintsList = document.getElementById('complaintsList');

    // --- Check Admin Session on Load ---
    // This is a basic check. A more robust solution would involve a dedicated API endpoint
    // to verify session status. For this example, if admin.html loads, we assume session is active.
    // If not, the server-side isAuthenticated middleware will redirect or send 401.

    // --- Navigation Logic ---
    const showSection = (sectionName) => {
        for (const key in sections) {
            sections[key].classList.add('hidden');
        }
        sections[sectionName].classList.remove('hidden');
    };

    navButtons.createAppointment.addEventListener('click', () => {
        showSection('createAppointment');
        fetchAppointments(); // Refresh appointments list
    });
    navButtons.addClient.addEventListener('click', () => showSection('addClient'));
    navButtons.showClients.addEventListener('click', () => {
        showSection('showClients');
        fetchClients(); // Refresh clients list
    });
    navButtons.complaintsReport.addEventListener('click', () => {
        showSection('complaintsReport');
        fetchComplaints(); // Refresh complaints list
    });
    navButtons.adminLogout.addEventListener('click', async () => {
        try {
            const response = await fetch('/admin/logout', { method: 'POST' });
            const result = await response.json();
            if (response.ok) {
                window.location.href = result.redirect; // Redirect to public site
            } else {
                alert(result.message || 'Logout failed.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('An error occurred during logout.');
        }
    });

    // --- Admin Login Form (only on login.html) ---
    const adminLoginForm = document.getElementById('adminLoginForm');
    const loginMessageStatus = document.getElementById('loginMessageStatus');

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(adminLoginForm);
            const data = Object.fromEntries(formData.entries());

            loginMessageStatus.classList.remove('hidden', 'success', 'error');
            loginMessageStatus.textContent = 'Logging in...';

            try {
                const response = await fetch('/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();

                if (response.ok) {
                    loginMessageStatus.classList.add('success');
                    loginMessageStatus.textContent = result.message;
                    window.location.href = result.redirect; // Redirect to admin dashboard
                } else {
                    loginMessageStatus.classList.add('error');
                    loginMessageStatus.textContent = result.message || 'Login failed.';
                }
            } catch (error) {
                console.error('Login error:', error);
                loginMessageStatus.classList.add('error');
                loginMessageStatus.textContent = 'An unexpected error occurred during login.';
            } finally {
                loginMessageStatus.classList.remove('hidden');
                setTimeout(() => {
                    loginMessageStatus.classList.add('hidden');
                }, 5000);
            }
        });
    }

    // --- Create Appointment ---
    if (createAppointmentForm) {
        createAppointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(createAppointmentForm);
            const data = Object.fromEntries(formData.entries());

            createAppointmentMessage.classList.remove('hidden', 'success', 'error');
            createAppointmentMessage.textContent = 'Adding appointment...';

            try {
                const response = await fetch('/admin/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();

                if (response.ok) {
                    createAppointmentMessage.classList.add('success');
                    createAppointmentMessage.textContent = result.message;
                    createAppointmentForm.reset();
                    fetchAppointments(); // Refresh the list
                } else {
                    createAppointmentMessage.classList.add('error');
                    createAppointmentMessage.textContent = result.message || 'Failed to add appointment.';
                }
            } catch (error) {
                console.error('Error creating appointment:', error);
                createAppointmentMessage.classList.add('error');
                createAppointmentMessage.textContent = 'An unexpected error occurred.';
            } finally {
                createAppointmentMessage.classList.remove('hidden');
                setTimeout(() => {
                    createAppointmentMessage.classList.add('hidden');
                }, 5000);
            }
        });
    }

    // --- Fetch and Display Appointments (Admin) ---
    const fetchAppointments = async () => {
        if (!currentAppointmentsList) return; // Ensure element exists
        currentAppointmentsList.innerHTML = '<p>Loading appointments...</p>';
        try {
            const response = await fetch('/api/appointments'); // Public endpoint for display
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const appointments = await response.json();

            if (appointments.length === 0) {
                currentAppointmentsList.innerHTML = '<p>No appointments scheduled yet.</p>';
                return;
            }

            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Client Name</th>
                            <th>Service</th>
                            <th>Cleaner</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            appointments.forEach(app => {
                tableHTML += `
                    <tr>
                        <td>${app.time}</td>
                        <td>${app.clientName}</td>
                        <td>${app.typeOfService}</td>
                        <td>${app.cleanerAssigned}</td>
                        <td><button data-id="${app._id}" class="delete-appointment-btn">Delete</button></td>
                    </tr>
                `;
            });
            tableHTML += `
                    </tbody>
                </table>
            `;
            currentAppointmentsList.innerHTML = tableHTML;

            // Add event listeners for delete buttons
            currentAppointmentsList.querySelectorAll('.delete-appointment-btn').forEach(button => {
                button.addEventListener('click', (e) => deleteAppointment(e.target.dataset.id));
            });

        } catch (error) {
            console.error('Error fetching appointments:', error);
            currentAppointmentsList.innerHTML = '<p class="message error">Failed to load appointments.</p>';
        }
    };

    // --- Delete Appointment ---
    const deleteAppointment = async (id) => {
        if (!confirm('Are you sure you want to delete this appointment?')) {
            return;
        }
        try {
            const response = await fetch(`/admin/appointments/${id}`, { method: 'DELETE' });
            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                fetchAppointments(); // Refresh the list
            } else {
                alert(result.message || 'Failed to delete appointment.');
            }
        } catch (error) {
            console.error('Error deleting appointment:', error);
            alert('An error occurred while deleting the appointment.');
        }
    };

    // --- Add Client ---
    if (addClientForm) {
        addClientForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addClientForm);
            const data = Object.fromEntries(formData.entries());

            addClientMessage.classList.remove('hidden', 'success', 'error');
            addClientMessage.textContent = 'Adding client...';

            try {
                const response = await fetch('/admin/clients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();

                if (response.ok) {
                    addClientMessage.classList.add('success');
                    addClientMessage.textContent = result.message;
                    addClientForm.reset();
                } else {
                    addClientMessage.classList.add('error');
                    addClientMessage.textContent = result.message || 'Failed to add client.';
                }
            } catch (error) {
                console.error('Error adding client:', error);
                addClientMessage.classList.add('error');
                addClientMessage.textContent = 'An unexpected error occurred.';
            } finally {
                addClientMessage.classList.remove('hidden');
                setTimeout(() => {
                    addClientMessage.classList.add('hidden');
                }, 5000);
            }
        });
    }

    // --- Fetch and Display Clients ---
    const fetchClients = async () => {
        if (!clientsList) return;
        clientsList.innerHTML = '<p>Loading clients...</p>';
        try {
            const response = await fetch('/admin/clients');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const clients = await response.json();

            if (clients.length === 0) {
                clientsList.innerHTML = '<p>No clients added yet.</p>';
                return;
            }

            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Address</th>
                            <th>Contact Number</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            clients.forEach(client => {
                tableHTML += `
                    <tr>
                        <td>${client.name}</td>
                        <td>${client.address}</td>
                        <td>${client.contactNumber}</td>
                    </tr>
                `;
            });
            tableHTML += `
                    </tbody>
                </table>
            `;
            clientsList.innerHTML = tableHTML;

        } catch (error) {
            console.error('Error fetching clients:', error);
            clientsList.innerHTML = '<p class="message error">Failed to load clients.</p>';
        }
    };

    // --- Fetch and Display Complaints ---
    const fetchComplaints = async () => {
        if (!complaintsList) return;
        complaintsList.innerHTML = '<p>Loading complaints...</p>';
        try {
            const response = await fetch('/admin/complaints');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const complaints = await response.json();

            if (complaints.length === 0) {
                complaintsList.innerHTML = '<p>No complaints/messages received yet.</p>';
                return;
            }

            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Sender Name</th>
                            <th>Sender Email</th>
                            <th>Message</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            complaints.forEach(complaint => {
                const date = new Date(complaint.createdAt).toLocaleString();
                tableHTML += `
                    <tr>
                        <td>${complaint.senderName}</td>
                        <td>${complaint.senderEmail}</td>
                        <td>${complaint.message}</td>
                        <td>${date}</td>
                        <td><button data-id="${complaint._id}" class="delete-complaint-btn">Delete</button></td>
                    </tr>
                `;
            });
            tableHTML += `
                    </tbody>
                </table>
            `;
            complaintsList.innerHTML = tableHTML;

            // Add event listeners for delete buttons
            complaintsList.querySelectorAll('.delete-complaint-btn').forEach(button => {
                button.addEventListener('click', (e) => deleteComplaint(e.target.dataset.id));
            });

        } catch (error) {
            console.error('Error fetching complaints:', error);
            complaintsList.innerHTML = '<p class="message error">Failed to load complaints.</p>';
        }
    };

    // --- Delete Complaint ---
    const deleteComplaint = async (id) => {
        if (!confirm('Are you sure you want to delete this complaint/message?')) {
            return;
        }
        try {
            const response = await fetch(`/admin/complaints/${id}`, { method: 'DELETE' });
            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                fetchComplaints(); // Refresh the list
            } else {
                alert(result.message || 'Failed to delete complaint.');
            }
        } catch (error) {
            console.error('Error deleting complaint:', error);
            alert('An error occurred while deleting the complaint.');
        }
    };

    // Initial fetches for admin dashboard if on admin.html
    if (document.body.id !== 'login-page') { // Check if not on login page
        fetchAppointments();
        // Other fetches will happen when their respective buttons are clicked
    }
});