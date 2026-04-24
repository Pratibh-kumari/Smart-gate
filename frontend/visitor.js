// Visitor Portal JavaScript

let qrPollTimer = null;
const QR_POLL_INTERVAL_MS = 15000;

function setFieldError(elementId, message, show) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = message;
    element.style.display = show ? 'block' : 'none';
}

function isValidPhone(value) {
    return /^\d{10}$/.test(value);
}

function isValidEmail(value) {
    if (!value) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function persistVisitorIdentity(phone, email) {
    localStorage.setItem('smartGateVisitorPhone', phone);
    if (email) {
        localStorage.setItem('smartGateVisitorEmail', email);
    }
}

function stopQrPolling() {
    if (qrPollTimer) {
        clearInterval(qrPollTimer);
        qrPollTimer = null;
    }
}

function showQrStatus(text) {
    const statusMessage = document.getElementById('qrStatusMessage');
    if (statusMessage) {
        statusMessage.textContent = text;
    }
}

function renderQrState(data) {
    const pendingBox = document.getElementById('qrPendingBox');
    const displayBox = document.getElementById('qrDisplayBox');
    const qrImage = document.getElementById('visitorQrImage');

    if (!pendingBox || !displayBox) {
        return;
    }

    if (data.entrySuccessful) {
        pendingBox.style.display = 'none';
        displayBox.style.display = 'none';
        showQrStatus('Welcome to RRU. Entry Successful.');
        stopQrPolling();
        return;
    }

    if (data.status === 'approved' && data.qrCode) {
        pendingBox.style.display = 'none';
        displayBox.style.display = 'block';
        qrImage.src = data.qrCode;

        let suffix = '';
        if (data.validUntil) {
            const expiry = new Date(data.validUntil).toLocaleString();
            suffix = ` Valid until ${expiry}.`;
        }

        showQrStatus(`Approved.${suffix}`);
        return;
    }

    displayBox.style.display = 'none';
    pendingBox.style.display = 'block';

    if (data.status === 'rejected') {
        showQrStatus('Your request was rejected by the host.');
        stopQrPolling();
    } else if (data.status === 'checked-in') {
        showQrStatus('Welcome to RRU. Entry Successful.');
        stopQrPolling();
    } else {
        showQrStatus('Pending host approval...');
    }
}

async function fetchAndRenderVisitorQr(visitorId, silent = false) {
    try {
        const data = await apiRequest(`/visitor/${visitorId}/qr`, 'GET');
        renderQrState(data);

        if (!silent && data.status === 'approved' && data.qrCode) {
            showStatus('Your QR code is ready. Show this QR at entry gate.', 'success');
        }
    } catch (error) {
        if (!silent) {
            showStatus(`Unable to fetch QR status: ${error.message}`, 'error');
        }
    }
}

function startQrPolling(visitorId) {
    stopQrPolling();
    qrPollTimer = setInterval(() => {
        fetchAndRenderVisitorQr(visitorId, true);
    }, QR_POLL_INTERVAL_MS);
}

function openQrSection(visitorId) {
    localStorage.setItem('smartGateVisitorId', visitorId);
    showSection('qr-section');
    fetchAndRenderVisitorQr(visitorId, false);
    startQrPolling(visitorId);
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.card-section');
    sections.forEach(section => section.classList.remove('active'));

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        const statusBox = document.getElementById('statusBox');
        if (statusBox) statusBox.style.display = 'none';
    }
}

function showStatus(message, type = 'info') {
    const statusBox = document.getElementById('statusBox');
    if (!statusBox) {
        alert(message);
        return;
    }

    statusBox.textContent = message;
    statusBox.className = `status-box status-${type}`;
    statusBox.style.display = 'block';
    statusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (type !== 'success') {
        setTimeout(() => {
            if (statusBox.textContent === message) {
                statusBox.style.display = 'none';
            }
        }, 8000);
    }
}

async function apiRequest(endpoint, method = 'GET', body = null) {
    const queryApiBase = new URLSearchParams(window.location.search).get('apiBase');
    const storedApiBase = localStorage.getItem('smartGateApiBase');
    const configuredBase = document.getElementById('apiBase') ? document.getElementById('apiBase').value.trim() : '';
    const defaultBase = `${window.location.protocol}//${window.location.hostname}:5000/api`;
    const baseUrl = (queryApiBase || storedApiBase || configuredBase || defaultBase).replace(/\/$/, '');

    if (queryApiBase) {
        localStorage.setItem('smartGateApiBase', baseUrl);
    }

    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Request failed');
    }

    return data;
}

function setupLiveValidation() {
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const otpPhoneInput = document.getElementById('otpPhone');

    if (phoneInput) {
        phoneInput.addEventListener('input', () => {
            const cleaned = phoneInput.value.replace(/\D/g, '').slice(0, 10);
            phoneInput.value = cleaned;
            setFieldError('phoneError', 'Enter a valid 10-digit phone number', cleaned.length > 0 && !isValidPhone(cleaned));
        });
    }

    if (emailInput) {
        emailInput.addEventListener('input', () => {
            const value = emailInput.value.trim();
            setFieldError('emailError', 'Enter a valid email address', value.length > 0 && !isValidEmail(value));
        });
    }

    if (otpPhoneInput) {
        otpPhoneInput.addEventListener('input', () => {
            const cleaned = otpPhoneInput.value.replace(/\D/g, '').slice(0, 10);
            otpPhoneInput.value = cleaned;
            setFieldError('otpPhoneError', 'Enter a valid 10-digit phone number', cleaned.length > 0 && !isValidPhone(cleaned));
        });
    }
}

function initializeQrSection() {
    const savedVisitorId = localStorage.getItem('smartGateVisitorId');
    if (savedVisitorId) {
        openQrSection(savedVisitorId);
    }

    const savedPhone = localStorage.getItem('smartGateVisitorPhone');
    const savedEmail = localStorage.getItem('smartGateVisitorEmail');

    if (savedPhone) {
        const phoneInput = document.getElementById('phone');
        const otpPhoneInput = document.getElementById('otpPhone');
        if (phoneInput) phoneInput.value = savedPhone;
        if (otpPhoneInput) otpPhoneInput.value = savedPhone;
    }

    if (savedEmail) {
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = savedEmail;
    }

    const refreshLink = document.getElementById('refreshQrLink');
    if (refreshLink) {
        refreshLink.addEventListener('click', (e) => {
            e.preventDefault();
            const visitorId = localStorage.getItem('smartGateVisitorId');
            if (!visitorId) {
                showStatus('No visitor request found. Please complete OTP verification first.', 'error');
                return;
            }

            fetchAndRenderVisitorQr(visitorId, false);
        });
    }

    const backLink = document.getElementById('backToRegisterLink');
    if (backLink) {
        backLink.addEventListener('click', (e) => {
            e.preventDefault();
            stopQrPolling();
            localStorage.removeItem('smartGateVisitorId');
            setFieldError('phoneError', '', false);
            setFieldError('emailError', '', false);
            setFieldError('otpPhoneError', '', false);
            showSection('register-section');
        });
    }
}

document.getElementById('visitorForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim().replace(/\D/g, ''),
        email: document.getElementById('email').value.trim(),
        host: document.getElementById('host').value.trim(),
        purpose: document.getElementById('purpose').value.trim(),
    };

    const hasValidPhone = isValidPhone(formData.phone);
    const hasValidEmail = isValidEmail(formData.email);

    setFieldError('phoneError', 'Enter a valid 10-digit phone number', !hasValidPhone);
    setFieldError('emailError', 'Enter a valid email address', !!formData.email && !hasValidEmail);

    if (!hasValidPhone || (!hasValidEmail && formData.email)) {
        return;
    }

    try {
        showStatus('Registering visitor...', 'info');
        const result = await apiRequest('/visitors/register', 'POST', formData);

        persistVisitorIdentity(formData.phone, formData.email);

        if (result.otp) {
            showStatus(`✓ Registration successful! Your OTP is: ${result.otp} (Valid for 2 minutes)`, 'success');
        } else {
            showStatus(`✓ Registration successful! A numeric OTP has been sent via SMS to ${formData.phone}`, 'success');
        }

        document.getElementById('otpPhone').value = formData.phone;
        document.getElementById('visitorForm').reset();

        setTimeout(() => showSection('otp-section'), 4000);
    } catch (error) {
        showStatus(`✗ Registration failed: ${error.message}`, 'error');
    }
});

document.getElementById('otpForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const rawPhone = document.getElementById('otpPhone').value.trim();
    const rawOtp = document.getElementById('otp').value.trim();

    const formData = {
        phone: rawPhone.replace(/\D/g, ''),
        otp: rawOtp.replace(/\D/g, ''),
    };

    setFieldError('otpPhoneError', 'Enter a valid 10-digit phone number', !isValidPhone(formData.phone));

    if (!isValidPhone(formData.phone)) {
        showStatus('Enter a valid 10-digit phone number', 'error');
        return;
    }

    if (formData.otp.length < 4 || formData.otp.length > 8) {
        showStatus('Please enter a valid OTP code', 'error');
        return;
    }

    try {
        showStatus('Verifying OTP...', 'info');
        const result = await apiRequest('/visitors/verify-otp', 'POST', formData);

        showStatus('✓ OTP verified successfully! Your request is pending host approval.', 'success');
        document.getElementById('otpForm').reset();

        setTimeout(() => {
            if (result.visitor && result.visitor.id) {
                openQrSection(result.visitor.id);
            }
        }, 1500);
    } catch (error) {
        showStatus(`✗ OTP verification failed: ${error.message}`, 'error');
    }
});

document.getElementById('showOtpSection').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('otp-section');
});

document.getElementById('showRegisterSection').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('register-section');
});

setupLiveValidation();
initializeQrSection();