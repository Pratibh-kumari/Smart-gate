// Host Portal JavaScript
const API_BASE = 'http://localhost:5000/api';
let authToken = localStorage.getItem('host_token');
let hostInfo = JSON.parse(localStorage.getItem('host_info') || '{}');
let refreshTimer = null;
let visitorsData = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (authToken && hostInfo.role === 'host') {
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
    document.getElementById('hostName').textContent = hostInfo.name || 'Host';
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
        
        if (result.user.role !== 'host') {
            showStatus('✗ Access denied: Host role required', 'error');
            return;
        }
        
        authToken = result.token;
        hostInfo = result.user;
        
        localStorage.setItem('host_token', authToken);
        localStorage.setItem('host_info', JSON.stringify(hostInfo));
        
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
    hostInfo = {};
    localStorage.removeItem('host_token');
    localStorage.removeItem('host_info');
    
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
    
    showStatus('✓ Logged out successfully', 'success');
    setTimeout(showLogin, 1000);
}

// Load Visitors
async function loadVisitors(silent = false) {
    try {
        if (!silent) showStatus('Loading visitors...', 'info');
        
        const result = await apiRequest('/visitors/pending', 'GET', null, true);
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
    const pendingVisitors = visitorsData.filter(v => v.status === 'pending');
    const approvedToday = visitorsData.filter(v => {
        if (v.status !== 'approved' || !v.approvedAt) return false;
        const approved = new Date(v.approvedAt);
        const today = new Date();
        return approved.toDateString() === today.toDateString();
    });
    
    document.getElementById('pendingCount').textContent = pendingVisitors.length;
    document.getElementById('approvedCount').textContent = approvedToday.length;
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
            v.purpose.toLowerCase().includes(searchTerm)
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
                    <th>Purpose</th>
                    <th>Requested</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(visitor => `
                    <tr>
                        <td>${visitor.name}</td>
                        <td>${visitor.phone}</td>
                        <td>${visitor.purpose}</td>
                        <td>${new Date(visitor.createdAt).toLocaleString()}</td>
                        <td><span class="badge badge-${visitor.status}">${visitor.status}</span></td>
                        <td>
                            ${visitor.status === 'pending' ? `
                                <button class="btn btn-success btn-small" onclick="approveVisitor('${visitor._id}', 24)">24h</button>
                                <button class="btn btn-success btn-small" onclick="approveVisitor('${visitor._id}', 72)">72h</button>
                                <button class="btn btn-danger btn-small" onclick="rejectVisitor('${visitor._id}')">Reject</button>
                            ` : visitor.status === 'approved' ? `
                                <span class="text-success">✓ Approved</span>
                            ` : `
                                <span class="text-danger">✗ Rejected</span>
                            `}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

// Approve Visitor
async function approveVisitor(visitorId, validityHours) {
    if (!confirm(`Approve this visitor for ${validityHours} hours?`)) {
        return;
    }
    
    try {
        showStatus('Approving visitor...', 'info');
        await apiRequest('/visitors/approve', 'POST', { visitorId, validityHours }, true);
        
        showStatus(`✓ Visitor approved for ${validityHours} hours`, 'success');
        loadVisitors();
        
    } catch (error) {
        showStatus(`✗ Approval failed: ${error.message}`, 'error');
    }
}

// Reject Visitor (not implemented in backend yet, but prepared)
async function rejectVisitor(visitorId) {
    if (!confirm('Are you sure you want to reject this visitor?')) {
        return;
    }
    
    showStatus('Reject functionality coming soon', 'info');
    // TODO: Implement reject endpoint in backend
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
