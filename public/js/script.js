document.addEventListener('DOMContentLoaded', () => {
    const sections = {
        appointments: document.getElementById('appointmentsSection'),
        contact: document.getElementById('contactSection'),
        aboutUs: document.getElementById('aboutUsSection'),
        settings: document.getElementById('settingsSection')
    };

    const navButtons = {
        appointments: document.getElementById('appointmentsBtn'),
        contact: document.getElementById('contactBtn'),
        aboutUs: document.getElementById('aboutUsBtn'),
        settings: document.getElementById('settingsBtn'),
        adminLogin: document.getElementById('adminLoginBtn')
    };

    const appointmentsContent = document.getElementById('appointmentsContent');
    const contactForm = document.getElementById('contactForm');
    const contactMessageStatus = document.getElementById('contactMessageStatus');
    const lightThemeBtn = document.getElementById('lightThemeBtn');
    const darkThemeBtn = document.getElementById('darkThemeBtn');

    // --- Theme Switching Logic ---
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    };

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    lightThemeBtn.addEventListener('click', () => applyTheme('light'));
    darkThemeBtn.addEventListener('click', () => applyTheme('dark'));

    // --- Navigation Logic ---
    const showSection = (sectionName) => {
        for (const key in sections) {
            sections[key].classList.add('hidden');
        }
        sections[sectionName].classList.remove('hidden');
    };

    navButtons.appointments.addEventListener('click', () => {
        showSection('appointments');
        fetchAppointments(); // Refresh appointments when section is shown
    });
    navButtons.contact.addEventListener('click', () => showSection('contact'));
    navButtons.aboutUs.addEventListener('click', () => showSection('aboutUs'));
    navButtons.settings.addEventListener('click', () => showSection('settings'));
    navButtons.adminLogin.addEventListener('click', () => window.location.href = '/login.html');

    // --- Fetch and Display Appointments ---
    const fetchAppointments = async () => {
        appointmentsContent.innerHTML = '<p>Loading appointments...</p>';
        try {
            const response = await fetch('/api/appointments');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const appointments = await response.json();

            if (appointments.length === 0) {
                appointmentsContent.innerHTML = '<p>No appointments scheduled yet.</p>';
                return;
            }

            let tableHTML = `
                <table class="appointment-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Client Name</th>
                            <th>Type of Service</th>
                            <th>Cleaner Assigned</th>
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
                    </tr>
                `;
            });
            tableHTML += `
                    </tbody>
                </table>
            `;
            appointmentsContent.innerHTML = tableHTML;

        } catch (error) {
            console.error('Error fetching appointments:', error);
            appointmentsContent.innerHTML = '<p class="message error">Failed to load appointments. Please try again later.</p>';
        }
    };

    // Initial load of appointments
    fetchAppointments();

    // --- Contact Form Submission ---
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        contactMessageStatus.classList.remove('hidden', 'success', 'error');
        contactMessageStatus.textContent = 'Sending message...';

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                contactMessageStatus.classList.add('success');
                contactMessageStatus.textContent = result.message;
                contactForm.reset(); // Clear form on success
            } else {
                contactMessageStatus.classList.add('error');
                contactMessageStatus.textContent = result.message || 'Failed to send message.';
            }
        } catch (error) {
            console.error('Error submitting contact form:', error);
            contactMessageStatus.classList.add('error');
            contactMessageStatus.textContent = 'An unexpected error occurred. Please try again.';
        } finally {
            contactMessageStatus.classList.remove('hidden');
            setTimeout(() => {
                contactMessageStatus.classList.add('hidden');
            }, 5000); // Hide message after 5 seconds
        }
    });
});