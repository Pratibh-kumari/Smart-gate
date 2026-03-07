// Visitor Portal JavaScript
const API_BASE = 'http://localhost:5000/api';

// Show/hide sections
function showSection(sectionId) {
    document.querySelectorAll('.card-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
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
async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

// Visitor Registration Form
document.getElementById('visitorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        host: document.getElementById('host').value.trim(),
        purpose: document.getElementById('purpose').value.trim()
    };
    
    // Validate phone number
    if (!/^\d{10}$/.test(formData.phone)) {
        showStatus('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    
    try {
        showStatus('Registering visitor...', 'info');
        const result = await apiRequest('/visitors/register', 'POST', formData);
        
        // Show OTP prominently for testing (remove in production)
        if (result.otp) {
            showStatus(`✓ Registration successful! Your OTP is: ${result.otp} (Valid for 2 minutes)`, 'success');
            console.log('='.repeat(50));
            console.log('🔐 YOUR OTP CODE: ' + result.otp);
            console.log('='.repeat(50));
        } else {
            showStatus(`✓ Registration successful! OTP sent to ${formData.phone}`, 'success');
        }
        
        // Pre-fill OTP form with phone number
        document.getElementById('otpPhone').value = formData.phone;
        
        // Clear registration form
        document.getElementById('visitorForm').reset();
        
        // Auto-switch to OTP section after 4 seconds (give time to see OTP)
        setTimeout(() => {
            showSection('otp-section');
        }, 4000);
        
    } catch (error) {
        showStatus(`✗ Registration failed: ${error.message}`, 'error');
    }
});

// OTP Verification Form
document.getElementById('otpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        phone: document.getElementById('otpPhone').value.trim(),
        otp: document.getElementById('otp').value.trim()
    };
    
    // Validate inputs
    if (!/^\d{10}$/.test(formData.phone)) {
        showStatus('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    
    if (!/^\d{6}$/.test(formData.otp)) {
        showStatus('Please enter a valid 6-digit OTP', 'error');
        return;
    }
    
    try {
        showStatus('Verifying OTP...', 'info');
        const result = await apiRequest('/visitors/verify-otp', 'POST', formData);
        
        showStatus(`✓ OTP verified successfully! Your request is pending host approval.`, 'success');
        
        // Clear form
        document.getElementById('otpForm').reset();
        
        // Show success message with instructions
        setTimeout(() => {
            showStatus('✓ You will be notified once your host approves your visit. Please wait...', 'success');
        }, 3000);
        
    } catch (error) {
        showStatus(`✗ OTP verification failed: ${error.message}`, 'error');
    }
});

// Section toggle links
document.getElementById('showOtpSection').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('otp-section');
});

document.getElementById('showRegisterSection').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('register-section');
});
