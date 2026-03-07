// Guard Portal JavaScript
const API_BASE = 'http://localhost:5000/api';
let authToken = localStorage.getItem('guard_token');
let guardInfo = JSON.parse(localStorage.getItem('guard_info') || '{}');
let refreshTimer = null;
let visitorsData = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (authToken && guardInfo.role === 'guard') {
        showDashboard();
        loadVisitors();
        setupAutoRefresh();
    } else {
        showLogin();
    }
});

// Show/hide sections
function showLogin() {
    document.getElementById('login-section').classList.add('active');
    document.getElementById('dashboard-section').classList.remove('active');
    document.getElementById('logoutBtn').style.display = 'none';
}

function showDashboard() {
    document.getElementById('login-section').classList.remove('active');
    document.getElementById('dashboard-section').classList.add('active');
    document.getElementById('logoutBtn').style.display = 'inline-block';
    document.getElementById('guardName').textContent = guardInfo.name || 'Guard';
}

// Status message helper
function showStatus(message, type = 'info') {
    const statusBox = document.getElementById('statusBox');
    statusBox.textContent = message;
    statusBox.className = `status-box status-${type}`;
    statusBox.style.display = 'block';
    
    setTimeout(() => {
        statusBox.style.display = 'none';
    }, 5000);
}

// API request helper
async function apiRequest(endpoint, method = 'GET', body = null, useAuth = false) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (useAuth && authToken) {
            options.headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                logout();
            }
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

// Login Form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value
    };
    
    try {
        showStatus('Logging in...', 'info');
        const result = await apiRequest('/auth/login', 'POST', formData);
        
        if (result.user.role !== 'guard') {
            showStatus('✗ Access denied: Guard role required', 'error');
            return;
        }
        
        authToken = result.token;
        guardInfo = result.user;
        
        localStorage.setItem('guard_token', authToken);
        localStorage.setItem('guard_info', JSON.stringify(guardInfo));
        
        showStatus('✓ Login successful!', 'success');
        
        setTimeout(() => {
            showDashboard();
            loadVisitors();
            setupAutoRefresh();
        }, 1000);
        
    } catch (error) {
        showStatus(`✗ Login failed: ${error.message}`, 'error');
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', logout);

function logout() {
    authToken = null;
    guardInfo = {};
    localStorage.removeItem('guard_token');
    localStorage.removeItem('guard_info');
    
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
    
    showStatus('✓ Logged out successfully', 'success');
    setTimeout(showLogin, 1000);
}

// Check-In Form
document.getElementById('checkInForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const phone = document.getElementById('checkInPhone').value.trim();
    
    if (!/^\d{10}$/.test(phone)) {
        showStatus('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    
    try {
        showStatus('Checking in visitor...', 'info');
        const result = await apiRequest('/visitors/check-in', 'POST', { phone }, true);
        
        showStatus(`✓ Check-in successful: ${result.visitor.name}`, 'success');
        document.getElementById('checkInPhone').value = '';
        
        loadVisitors();
        
    } catch (error) {
        showStatus(`✗ Check-in failed: ${error.message}`, 'error');
    }
});

// Load Visitors
async function loadVisitors(silent = false) {
    try {
        if (!silent) showStatus('Loading visitors...', 'info');
        
        const result = await apiRequest('/visitors/active', 'GET', null, true);
        visitorsData = result.visitors || [];
        
        updateMetrics();
        renderVisitors();
        
        if (!silent) showStatus('✓ Visitors loaded', 'success');
        
    } catch (error) {
        if (!silent) showStatus(`✗ Failed to load visitors: ${error.message}`, 'error');
    }
}

// Update Metrics
function updateMetrics() {
    const activeVisitors = visitorsData.filter(v => v.status === 'checked-in');
    const todayVisitors = visitorsData.filter(v => {
        const checkIn = new Date(v.checkInTime);
        const today = new Date();
        return checkIn.toDateString() === today.toDateString();
    });
    
    document.getElementById('activeCount').textContent = activeVisitors.length;
    document.getElementById('todayCount').textContent = todayVisitors.length;
    document.getElementById('lastSync').textContent = new Date().toLocaleTimeString();
}

// Render Visitors Table
function renderVisitors() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filtered = visitorsData;
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(v => v.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(v => 
            v.name.toLowerCase().includes(searchTerm) ||
            v.phone.includes(searchTerm) ||
            v.host.toLowerCase().includes(searchTerm)
        );
    }
    
    const container = document.getElementById('visitorsTable');
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">No visitors found</p>';
        return;
    }
    
    const table = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Host</th>
                    <th>Check-In Time</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(visitor => `
                    <tr>
                        <td>${visitor.name}</td>
                        <td>${visitor.phone}</td>
                        <td>${visitor.host}</td>
                        <td>${visitor.checkInTime ? new Date(visitor.checkInTime).toLocaleString() : '-'}</td>
                        <td><span class="badge badge-${visitor.status}">${visitor.status}</span></td>
                        <td>
                            ${visitor.status === 'checked-in' ? 
                                `<button class="btn btn-danger btn-small" onclick="checkOutVisitor('${visitor._id}')">Check Out</button>` :
                                '-'
                            }
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

// Check-Out Visitor
async function checkOutVisitor(visitorId) {
    if (!confirm('Are you sure you want to check out this visitor?')) {
        return;
    }
    
    try {
        showStatus('Checking out visitor...', 'info');
        await apiRequest(`/visitors/check-out/${visitorId}`, 'PUT', null, true);
        
        showStatus('✓ Check-out successful', 'success');
        loadVisitors();
        
    } catch (error) {
        showStatus(`✗ Check-out failed: ${error.message}`, 'error');
    }
}

// Search and Filter
document.getElementById('searchInput').addEventListener('input', renderVisitors);
document.getElementById('statusFilter').addEventListener('change', renderVisitors);

// Refresh Button
document.getElementById('refreshBtn').addEventListener('click', () => loadVisitors());

// Auto-refresh
function setupAutoRefresh() {
    const checkbox = document.getElementById('autoRefresh');
    
    if (checkbox.checked) {
        refreshTimer = setInterval(() => loadVisitors(true), 20000);
    }
    
    checkbox.addEventListener('change', () => {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
        
        if (checkbox.checked) {
            refreshTimer = setInterval(() => loadVisitors(true), 20000);
        }
    });
}
