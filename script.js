// Configuration
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwgZ-CvpBQjQ_12oiaEjCFuq4pTM6hor7bohWPdEaS_PRWI4LCTclQfrTlWQipRvJf_/exec'; // Replace with your web app URL

// State Management
let currentUser = null;
let isAdmin = false;
let leadersData = [];
let donationData = [];

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
const authModal = document.getElementById('authModal');
const modalTitle = document.getElementById('modalTitle');
const authForms = document.querySelectorAll('.auth-form');
const tabBtns = document.querySelectorAll('.tab-btn');
const closeModal = document.querySelector('.close-modal');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userNameSpan = document.getElementById('userName');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const adminForm = document.getElementById('adminForm');
const leadersGrid = document.getElementById('leadersGrid');
const adminControls = document.getElementById('adminControls');
const messageForm = document.getElementById('messageForm');
const donationTableBody = document.getElementById('donationTableBody');
const donationCards = document.getElementById('donationCards');
const adminDonationControls = document.getElementById('adminDonationControls');
const allDonations = document.getElementById('allDonations');
const allDonationsBody = document.getElementById('allDonationsBody');
const toast = document.getElementById('toast');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check for saved user session
    const savedUser = localStorage.getItem('communityUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isAdmin = localStorage.getItem('isAdmin') === 'true';
        updateUIForAuth();
    }
    
    // Load initial data
    loadLeaders();
    if (currentUser) {
        loadDonationData();
    }
    
    // Event Listeners
    setupEventListeners();
    
    // Show home section by default
    showSection('home');
});

// Event Listeners Setup
function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Close mobile menu if open
            document.querySelector('.nav-menu').classList.remove('active');
        });
    });
    
    // Modal Controls
    loginBtn.addEventListener('click', () => showAuthModal('login'));
    signupBtn.addEventListener('click', () => showAuthModal('signup'));
    logoutBtn.addEventListener('click', handleLogout);
    closeModal.addEventListener('click', () => authModal.style.display = 'none');
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
    });
    
    // Auth Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchAuthTab(tab);
        });
    });
    
    // Switch between login/signup forms
    document.querySelectorAll('.switch-tab').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = this.getAttribute('data-tab');
            switchAuthTab(tab);
        });
    });
    
    // Form Submissions
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    adminForm.addEventListener('submit', handleAdminLogin);
    messageForm.addEventListener('submit', handleMessageSubmit);
    
    // Admin Controls
    document.getElementById('addLeaderBtn')?.addEventListener('click', handleAddLeader);
    document.getElementById('updateLeadersBtn')?.addEventListener('click', loadLeaders);
    document.getElementById('updateDonationBtn')?.addEventListener('click', handleUpdateDonation);
    
    // Donation View Toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            toggleDonationView(view);
        });
    });
    
    // Mobile Menu Toggle
    document.querySelector('.menu-toggle').addEventListener('click', function() {
        document.querySelector('.nav-menu').classList.toggle('active');
    });
}

// Section Navigation
function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) {
            section.classList.add('active');
        }
    });
    
    // Load data for specific sections
    if (sectionId === 'donation' && currentUser) {
        loadDonationData();
    }
}

// Authentication Modal
function showAuthModal(tab = 'login') {
    authModal.style.display = 'flex';
    switchAuthTab(tab);
}

function switchAuthTab(tab) {
    // Update tab buttons
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
        }
    });
    
    // Update forms
    authForms.forEach(form => {
        form.classList.remove('active');
        if (form.id === `${tab}Form`) {
            form.classList.add('active');
        }
    });
    
    // Update modal title
    const titles = {
        login: 'Welcome Back',
        signup: 'Join Our Community',
        admin: 'Admin Login'
    };
    modalTitle.textContent = titles[tab];
}

// Authentication Handlers
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    showToast('Logging in...', 'info');
    
    try {
        const response = await fetch(`${BACKEND_URL}?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            isAdmin = false;
            localStorage.setItem('communityUser', JSON.stringify(currentUser));
            localStorage.setItem('isAdmin', 'false');
            
            updateUIForAuth();
            authModal.style.display = 'none';
            loginForm.reset();
            showToast('Login successful!', 'success');
            
            // Load donation data for user
            loadDonationData();
        } else {
            showToast(data.message || 'Invalid credentials', 'error');
        }
    } catch (error) {
        showToast('Connection error. Please try again.', 'error');
        console.error('Login error:', error);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const userData = {
        name: document.getElementById('signupName').value,
        email: document.getElementById('signupEmail').value,
        password: document.getElementById('signupPassword').value,
        address: document.getElementById('signupAddress').value,
        phone: document.getElementById('signupPhone').value
    };
    
    // Validate all fields
    for (const [key, value] of Object.entries(userData)) {
        if (!value) {
            showToast(`Please fill in ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
            return;
        }
    }
    
    showToast('Creating account...', 'info');
    
    try {
        const response = await fetch(`${BACKEND_URL}?action=signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            isAdmin = false;
            localStorage.setItem('communityUser', JSON.stringify(currentUser));
            localStorage.setItem('isAdmin', 'false');
            
            updateUIForAuth();
            authModal.style.display = 'none';
            signupForm.reset();
            showToast('Account created successfully!', 'success');
            
            // Initialize donation data for new user
            initializeDonationData();
        } else {
            showToast(data.message || 'Signup failed', 'error');
        }
    } catch (error) {
        showToast('Connection error. Please try again.', 'error');
        console.error('Signup error:', error);
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    // Hardcoded admin credentials (as specified)
    if (email === 'admin@community.com' && password === 'admin123') {
        currentUser = { name: 'Admin', email: 'admin@community.com' };
        isAdmin = true;
        localStorage.setItem('communityUser', JSON.stringify(currentUser));
        localStorage.setItem('isAdmin', 'true');
        
        updateUIForAuth();
        authModal.style.display = 'none';
        adminForm.reset();
        showToast('Admin login successful!', 'success');
        
        // Load all data for admin
        loadLeaders();
        loadAllDonations();
    } else {
        showToast('Invalid admin credentials', 'error');
    }
}

function handleLogout() {
    currentUser = null;
    isAdmin = false;
    localStorage.removeItem('communityUser');
    localStorage.removeItem('isAdmin');
    
    updateUIForAuth();
    showSection('home');
    showToast('Logged out successfully', 'info');
    
    // Reset donation view
    donationTableBody.innerHTML = `
        <tr>
            <td colspan="3" class="no-data">Please login to view your donation status</td>
        </tr>
    `;
}

function updateUIForAuth() {
    if (currentUser) {
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        userNameSpan.textContent = currentUser.name;
        userNameSpan.style.display = 'inline-block';
        
        // Show admin controls if admin
        if (isAdmin) {
            adminControls.style.display = 'block';
            adminDonationControls.style.display = 'block';
            allDonations.style.display = 'block';
            loadAllDonations();
            loadDonorList();
        } else {
            adminControls.style.display = 'none';
            adminDonationControls.style.display = 'none';
            allDonations.style.display = 'none';
        }
    } else {
        loginBtn.style.display = 'block';
        signupBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        userNameSpan.style.display = 'none';
        adminControls.style.display = 'none';
        adminDonationControls.style.display = 'none';
        allDonations.style.display = 'none';
    }
}

// Leaders Management
async function loadLeaders() {
    try {
        const response = await fetch(`${BACKEND_URL}?action=getLeaders`);
        const data = await response.json();
        
        if (data.success) {
            leadersData = data.leaders;
            renderLeaders();
        } else {
            showToast('Failed to load leaders', 'error');
            leadersGrid.innerHTML = '<div class="loading">Error loading leaders. Please try again.</div>';
        }
    } catch (error) {
        console.error('Error loading leaders:', error);
        leadersGrid.innerHTML = '<div class="loading">Error loading leaders. Please check connection.</div>';
    }
}

function renderLeaders() {
    if (leadersData.length === 0) {
        leadersGrid.innerHTML = '<div class="loading">No leaders found. Add some as admin.</div>';
        return;
    }
    
    leadersGrid.innerHTML = '';
    
    leadersData.forEach(leader => {
        const leaderCard = document.createElement('div');
        leaderCard.className = 'leader-card';
        
        // Generate initials for avatar
        const initials = leader.name.split(' ').map(n => n[0]).join('').toUpperCase();
        
        leaderCard.innerHTML = `
            <div class="leader-img">${initials}</div>
            <div class="leader-info">
                <h3 class="leader-name">${leader.name}</h3>
                <p class="leader-work">${leader.work || 'No work description available'}</p>
            </div>
        `;
        
        leadersGrid.appendChild(leaderCard);
    });
}

async function handleAddLeader() {
    if (!isAdmin) {
        showToast('Admin access required', 'error');
        return;
    }
    
    const name = document.getElementById('leaderName').value;
    const work = document.getElementById('leaderWork').value;
    
    if (!name || !work) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}?action=addLeader`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, work })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Leader added successfully!', 'success');
            document.getElementById('leaderName').value = '';
            document.getElementById('leaderWork').value = '';
            loadLeaders();
        } else {
            showToast(data.message || 'Failed to add leader', 'error');
        }
    } catch (error) {
        showToast('Connection error', 'error');
        console.error('Error adding leader:', error);
    }
}

// Contact Form
async function handleMessageSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Please login to send messages', 'error');
        showAuthModal('login');
        return;
    }
    
    const messageData = {
        name: document.getElementById('messageName').value || currentUser.name,
        email: document.getElementById('messageEmail').value || currentUser.email,
        subject: document.getElementById('messageSubject').value,
        message: document.getElementById('messageContent').value
    };
    
    if (!messageData.subject || !messageData.message) {
        showToast('Please fill in subject and message', 'error');
        return;
    }
    
    showToast('Sending message...', 'info');
    
    try {
        const response = await fetch(`${BACKEND_URL}?action=sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Message sent successfully!', 'success');
            messageForm.reset();
        } else {
            showToast('Failed to send message', 'error');
        }
    } catch (error) {
        showToast('Connection error', 'error');
        console.error('Error sending message:', error);
    }
}

// Donation Management
async function loadDonationData() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}?action=getDonations&email=${encodeURIComponent(currentUser.email)}`);
        const data = await response.json();
        
        if (data.success) {
            donationData = data.donations;
            renderDonationData();
            updateDonationStats();
        }
    } catch (error) {
        console.error('Error loading donation data:', error);
    }
}

async function loadAllDonations() {
    if (!isAdmin) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}?action=getAllDonations`);
        const data = await response.json();
        
        if (data.success) {
            renderAllDonationsTable(data.donations);
            updateDonationStats();
        }
    } catch (error) {
        console.error('Error loading all donations:', error);
    }
}

async function loadDonorList() {
    if (!isAdmin) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}?action=getUsers`);
        const data = await response.json();
        
        if (data.success) {
            const donorSelect = document.getElementById('donorSelect');
            donorSelect.innerHTML = '<option value="">Select a member</option>';
            
            data.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.email;
                option.textContent = `${user.name} (${user.email})`;
                donorSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading donor list:', error);
    }
}

function renderDonationData() {
    // Clear existing data
    donationTableBody.innerHTML = '';
    donationCards.innerHTML = '';
    
    if (donationData.length === 0) {
        donationTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="no-data">No donation records found</td>
            </tr>
        `;
        return;
    }
    
    // Sort by month
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    donationData.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
    
    // Render table rows
    donationData.forEach(record => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${record.month}</td>
            <td class="status-${record.status.toLowerCase()}">${record.status}</td>
            <td>${record.updated || 'N/A'}</td>
        `;
        
        donationTableBody.appendChild(row);
        
        // Render card
        const card = document.createElement('div');
        card.className = `donation-card ${record.status.toLowerCase()}`;
        
        card.innerHTML = `
            <h3>${record.month}</h3>
            <p class="status-${record.status.toLowerCase()}">${record.status}</p>
            <p><small>Updated: ${record.updated || 'N/A'}</small></p>
        `;
        
        donationCards.appendChild(card);
    });
}

function renderAllDonationsTable(donations) {
    if (!donations || !Array.isArray(donations)) return;
    
    // Group donations by user
    const usersMap = new Map();
    
    donations.forEach(donation => {
        if (!usersMap.has(donation.email)) {
            usersMap.set(donation.email, {
                name: donation.name,
                email: donation.email,
                phone: donation.phone,
                address: donation.address,
                donations: {}
            });
        }
        
        usersMap.get(donation.email).donations[donation.month] = donation.status;
    });
    
    // Render table
    allDonationsBody.innerHTML = '';
    
    usersMap.forEach(user => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'N/A'}</td>
            <td>${user.address ? user.address.substring(0, 30) + '...' : 'N/A'}</td>
            <td class="status-${(user.donations.January || 'Unpaid').toLowerCase()}">${user.donations.January || 'Unpaid'}</td>
            <td class="status-${(user.donations.February || 'Unpaid').toLowerCase()}">${user.donations.February || 'Unpaid'}</td>
            <td class="status-${(user.donations.March || 'Unpaid').toLowerCase()}">${user.donations.March || 'Unpaid'}</td>
            <td class="status-${(user.donations.April || 'Unpaid').toLowerCase()}">${user.donations.April || 'Unpaid'}</td>
            <td class="status-${(user.donations.May || 'Unpaid').toLowerCase()}">${user.donations.May || 'Unpaid'}</td>
            <td class="status-${(user.donations.June || 'Unpaid').toLowerCase()}">${user.donations.June || 'Unpaid'}</td>
            <td class="status-${(user.donations.July || 'Unpaid').toLowerCase()}">${user.donations.July || 'Unpaid'}</td>
            <td class="status-${(user.donations.August || 'Unpaid').toLowerCase()}">${user.donations.August || 'Unpaid'}</td>
            <td class="status-${(user.donations.September || 'Unpaid').toLowerCase()}">${user.donations.September || 'Unpaid'}</td>
            <td class="status-${(user.donations.October || 'Unpaid').toLowerCase()}">${user.donations.October || 'Unpaid'}</td>
            <td class="status-${(user.donations.November || 'Unpaid').toLowerCase()}">${user.donations.November || 'Unpaid'}</td>
            <td class="status-${(user.donations.December || 'Unpaid').toLowerCase()}">${user.donations.December || 'Unpaid'}</td>
        `;
        
        allDonationsBody.appendChild(row);
    });
}

async function handleUpdateDonation() {
    if (!isAdmin) {
        showToast('Admin access required', 'error');
        return;
    }
    
    const donorEmail = document.getElementById('donorSelect').value;
    const month = document.getElementById('monthSelect').value;
    const status = document.getElementById('statusSelect').value;
    
    if (!donorEmail || !month) {
        showToast('Please select a member and month', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}?action=updateDonation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: donorEmail,
                month,
                status
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Donation status updated!', 'success');
            
            // Refresh data
            if (currentUser && currentUser.email === donorEmail) {
                loadDonationData();
            }
            loadAllDonations();
            updateDonationStats();
        } else {
            showToast(data.message || 'Update failed', 'error');
        }
    } catch (error) {
        showToast('Connection error', 'error');
        console.error('Error updating donation:', error);
    }
}

async function initializeDonationData() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}?action=initializeDonations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email })
        });
        
        const data = await response.json();
        if (data.success) {
            loadDonationData();
        }
    } catch (error) {
        console.error('Error initializing donation data:', error);
    }
}

function updateDonationStats() {
    if (!donationData || donationData.length === 0) return;
    
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentMonthData = donationData.find(d => d.month === currentMonth);
    
    if (currentMonthData) {
        const paidCount = donationData.filter(d => d.status === 'Paid').length;
        const unpaidCount = donationData.filter(d => d.status === 'Unpaid').length;
        
        document.getElementById('paidCount').textContent = paidCount;
        document.getElementById('unpaidCount').textContent = unpaidCount;
        document.getElementById('totalMembers').textContent = donationData.length;
    }
}

function toggleDonationView(view) {
    const tableContainer = document.querySelector('.donation-table-container');
    const cardsContainer = document.getElementById('donationCards');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    
    toggleBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-view') === view) {
            btn.classList.add('active');
        }
    });
    
    if (view === 'table') {
        tableContainer.style.display = 'block';
        cardsContainer.style.display = 'none';
    } else {
        tableContainer.style.display = 'none';
        cardsContainer.style.display = 'grid';
    }
}

// Utility Functions
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initial data loading
loadLeaders();