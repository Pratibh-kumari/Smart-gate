// Guard Portal JavaScript
// API_BASE is already defined in firebase-auth.js, don't redeclare
// Check for Firebase auth token first, fallback to old guard_token
let authToken = localStorage.getItem('authToken') || localStorage.getItem('guard_token');
let guardInfo = localStorage.getItem('userRole') ? {
    name: localStorage.getItem('userEmail'),
    email: localStorage.getItem('userEmail'),
    role: localStorage.getItem('userRole'),
    emailVerified: localStorage.getItem('emailVerified') === 'true'
} : JSON.parse(localStorage.getItem('guard_info') || '{}');
let refreshTimer = null;
let visitorsData = [];
let approvedVisitorsData = [];
let guardSummary = {
    approvedByHost: 0,
    activeVisitors: 0,
    todaysCheckIns: 0,
    todaysCheckOuts: 0,
};
let qrScanner = null;
let qrScannerRunning = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (authToken && (guardInfo.role === 'guard' || localStorage.getItem('userRole') === 'guard')) {
        showDashboard();
        loadVisitors();
        setupAutoRefresh();
    } else {
        showLogin();
    }

    setupQrScannerControls();
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
    // Get name from guardInfo or fallback to email
    const displayName = guardInfo.name || localStorage.getItem('userEmail') || 'Guard';
    document.getElementById('guardName').textContent = displayName;
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

// Login Form - Firebase Authentication
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    try {
        showStatus('Logging in with Firebase...', 'info');
        
        // Use Firebase auth if available, fallback to old auth
        if (window.firebaseAuth) {
            const result = await window.firebaseAuth.login(email, password);
            
            if (result.user.role !== 'guard') {
                showStatus('✗ Access denied: Guard role required', 'error');
                return;
            }
            
            if (!result.user.emailVerified) {
                showStatus('✗ Please verify your email before logging in. Check your inbox for verification link.', 'error');
                return;
            }
            
            authToken = result.token;
            guardInfo = result.user;
        } else {
            // Fallback to old JWT login
            const formData = { email, password };
            const result = await apiRequest('/auth/login', 'POST', formData);
            
            if (result.user.role !== 'guard') {
                showStatus('✗ Access denied: Guard role required', 'error');
                return;
            }
            
            authToken = result.token;
            guardInfo = result.user;
        }
        
        // Store in both old and new format for compatibility
        localStorage.setItem('guard_token', authToken);
        localStorage.setItem('guard_info', JSON.stringify(guardInfo));
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userRole', guardInfo.role);
        localStorage.setItem('userEmail', guardInfo.email || email);
        localStorage.setItem('emailVerified', guardInfo.emailVerified || 'true');
        
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
    stopQrScanner(true);

    authToken = null;
    guardInfo = {};
    // Clear old tokens
    localStorage.removeItem('guard_token');
    localStorage.removeItem('guard_info');
    // Clear Firebase tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('emailVerified');
    
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
    
    showStatus('✓ Logged out successfully', 'success');
    setTimeout(showLogin, 1000);
}

function setupQrScannerControls() {
    const scanBtn = document.getElementById('scanQrBtn');
    const closeBtn = document.getElementById('closeQrScannerBtn');
    const stopBtn = document.getElementById('stopQrScannerBtn');
    const modal = document.getElementById('qrScannerModal');

    if (scanBtn) {
        scanBtn.addEventListener('click', openQrScannerModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => stopQrScanner(true));
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => stopQrScanner(false));
    }

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                stopQrScanner(true);
            }
        });
    }
}

function setQrScanMessage(message, type = 'info') {
    const messageNode = document.getElementById('qrScanMessage');
    if (!messageNode) return;

    messageNode.textContent = message;
    messageNode.className = `section-desc qr-scan-message ${type}`;
}

async function openQrScannerModal() {
    const modal = document.getElementById('qrScannerModal');
    if (!modal) return;

    if (typeof Html5Qrcode === 'undefined') {
        showStatus('QR scanner library failed to load. Refresh and try again.', 'error');
        return;
    }

    modal.style.display = 'flex';
    setQrScanMessage('Starting camera...');

    try {
        if (!qrScanner) {
            qrScanner = new Html5Qrcode('qrReader');
        }

        if (qrScannerRunning) {
            return;
        }

        await qrScanner.start(
            { facingMode: 'environment' },
            {
                fps: 10,
                qrbox: { width: 240, height: 240 },
                aspectRatio: 1,
            },
            onQrScanSuccess,
            () => {}
        );

        qrScannerRunning = true;
        setQrScanMessage('Point the camera at the visitor QR code.');
    } catch (error) {
        modal.style.display = 'none';
        showStatus(`Unable to open camera: ${error.message}`, 'error');
    }
}

async function stopQrScanner(closeModal = false) {
    const modal = document.getElementById('qrScannerModal');

    if (qrScanner && qrScannerRunning) {
        try {
            await qrScanner.stop();
            await qrScanner.clear();
        } catch (error) {
            console.error('Failed to stop QR scanner:', error);
        }
    }

    qrScannerRunning = false;

    if (closeModal && modal) {
        modal.style.display = 'none';
    }
}

async function onQrScanSuccess(decodedText) {
    if (!decodedText) {
        return;
    }

    const qrToken = decodedText.trim();
    setQrScanMessage('QR detected. Validating token...');

    await stopQrScanner(true);

    try {
        const result = await apiRequest('/scan-qr', 'POST', { qrToken });
        showStatus(`✓ Check-in Successful: ${result.message || 'Access Granted'}`, 'success');
        loadVisitors();
    } catch (error) {
        const denied = (error.message || '').toLowerCase().includes('denied');
        showStatus(denied ? '✗ Invalid or Already Used QR' : `✗ QR scan failed: ${error.message}`, 'error');
    }
}

// Load Visitors
async function loadVisitors(silent = false) {
    try {
        if (!silent) showStatus('Loading visitors...', 'info');
        
        // Load approved, active and summary metrics
        const [approvedResult, activeResult, summaryResult] = await Promise.all([
            apiRequest('/visitors/approved', 'GET', null, true),
            apiRequest('/visitors/active', 'GET', null, true),
            apiRequest('/visitors/guard-summary', 'GET', null, true)
        ]);
        
        approvedVisitorsData = approvedResult.visitors || [];
        visitorsData = activeResult.visitors || [];
        guardSummary = summaryResult || guardSummary;
        
        updateMetrics();
        renderApprovedVisitors();
        renderVisitors();
        
        if (!silent) showStatus('✓ Visitors loaded', 'success');
        
    } catch (error) {
        if (!silent) showStatus(`✗ Failed to load visitors: ${error.message}`, 'error');
    }
}

// Update Metrics
function updateMetrics() {
    document.getElementById('approvedCount').textContent = guardSummary.approvedByHost || 0;
    document.getElementById('activeCount').textContent = guardSummary.activeVisitors || 0;
    document.getElementById('todayCount').textContent = guardSummary.todaysCheckIns || 0;
    document.getElementById('checkoutCount').textContent = guardSummary.todaysCheckOuts || 0;
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

// Render Approved Visitors Table (NEW)
function renderApprovedVisitors() {
    const searchTerm = document.getElementById('searchApprovedInput').value.toLowerCase();
    
    let filtered = approvedVisitorsData;
    
    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(v => 
            v.name.toLowerCase().includes(searchTerm) ||
            v.phone.includes(searchTerm) ||
            v.host.toLowerCase().includes(searchTerm) ||
            v.purpose.toLowerCase().includes(searchTerm)
        );
    }
    
    const container = document.getElementById('approvedVisitorsTable');
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">No approved visitors waiting for check-in</p>';
        return;
    }
    
    const table = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Host</th>
                    <th>Purpose</th>
                    <th>Approved At</th>
                    <th>Valid Until</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(visitor => `
                    <tr>
                        <td><strong>${visitor.name}</strong></td>
                        <td>${visitor.phone}</td>
                        <td>${visitor.host}</td>
                        <td>${visitor.purpose}</td>
                        <td>${visitor.approvedAt ? new Date(visitor.approvedAt).toLocaleString() : '-'}</td>
                        <td>${visitor.validUntil ? new Date(visitor.validUntil).toLocaleString() : '-'}</td>
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
        await apiRequest('/visitors/check-out', 'POST', { visitorId }, true);
        
        showStatus('✓ Check-out successful', 'success');
        loadVisitors();
        
    } catch (error) {
        showStatus(`✗ Check-out failed: ${error.message}`, 'error');
    }
}

// Search and Filter
document.getElementById('searchInput').addEventListener('input', renderVisitors);
document.getElementById('searchApprovedInput').addEventListener('input', renderApprovedVisitors);
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
