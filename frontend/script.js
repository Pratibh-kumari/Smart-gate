const appState = {
  token: localStorage.getItem('smartGateToken') || '',
  role: localStorage.getItem('smartGateRole') || '',
  lastVisitorId: localStorage.getItem('lastVisitorId') || '',
  refreshTimer: null,
  pendingVisitors: [],
  activeVisitors: []
};

const statusBox = document.getElementById('statusBox');
const roleLabel = document.getElementById('currentRole');
const otpVisitorId = document.getElementById('otpVisitorId');
const metricPending = document.getElementById('metricPending');
const metricActive = document.getElementById('metricActive');
const metricRole = document.getElementById('metricRole');
const metricSync = document.getElementById('metricSync');
const autoRefreshToggle = document.getElementById('autoRefreshToggle');

function currentTimeLabel() {
  return new Date().toLocaleTimeString();
}

function clearTable(id, message, columns) {
  document.getElementById(id).innerHTML = `<tr><td colspan="${columns}">${message}</td></tr>`;
}

function updateMetrics({ pending = '-', active = '-', syncNow = false } = {}) {
  metricPending.textContent = String(pending);
  metricActive.textContent = String(active);
  metricRole.textContent = appState.role || 'Guest';
  if (syncNow) {
    metricSync.textContent = currentTimeLabel();
  }
}

function canAccessTab(tabName) {
  if (tabName === 'visitor' || tabName === 'otp' || tabName === 'login') {
    return true;
  }
  if (!appState.token) return false;
  if (tabName === 'host') return appState.role === 'host' || appState.role === 'admin';
  if (tabName === 'guard') return appState.role === 'guard' || appState.role === 'admin';
  return true;
}

function updateRoleControls() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    const disabled = !canAccessTab(btn.dataset.tab);
    btn.classList.toggle('disabled', disabled);
  });
}

function startAutoRefresh() {
  if (appState.refreshTimer) {
    clearInterval(appState.refreshTimer);
    appState.refreshTimer = null;
  }

  if (autoRefreshToggle.checked) {
    appState.refreshTimer = setInterval(() => {
      refreshDynamicData({ silent: true });
    }, 20000);
  }
}

function apiBase() {
  return document.getElementById('apiBase').value.replace(/\/$/, '');
}

function setStatus(message, type = 'info') {
  statusBox.textContent = message;
  statusBox.className = 'status-box';
  if (type === 'success') statusBox.classList.add('success');
  if (type === 'error') statusBox.classList.add('error');
}

function saveAuth() {
  localStorage.setItem('smartGateToken', appState.token || '');
  localStorage.setItem('smartGateRole', appState.role || '');
}

function saveLastVisitorId() {
  if (appState.lastVisitorId) {
    localStorage.setItem('lastVisitorId', appState.lastVisitorId);
  }
}

async function apiRequest(path, method = 'GET', body = null, withAuth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (withAuth && appState.token) {
    headers.Authorization = `Bearer ${appState.token}`;
  }

  const response = await fetch(`${apiBase()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status})`);
  }
  return data;
}

function activateTab(tabName) {
  if (!canAccessTab(tabName)) {
    setStatus(`Access denied for ${tabName} module. Please login with correct role.`, 'error');
    tabName = 'login';
  }

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach((section) => {
    section.classList.toggle('active', section.id === `tab-${tabName}`);
  });
}

function updateRoleLabel() {
  roleLabel.textContent = appState.role || 'Not logged in';
  otpVisitorId.value = appState.lastVisitorId || '';
  updateRoleControls();
  updateMetrics();
}

function toDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function matchesSearch(visitor, term) {
  if (!term) return true;
  const normalizedTerm = normalizeText(term);
  const haystack = [visitor.name, visitor.phone, visitor.host, visitor.purpose, visitor.status]
    .map(normalizeText)
    .join(' ');
  return haystack.includes(normalizedTerm);
}

function renderPendingVisitors(visitors) {
  const body = document.getElementById('pendingTableBody');
  body.innerHTML = '';

  if (!Array.isArray(visitors) || visitors.length === 0) {
    body.innerHTML = '<tr><td colspan="6">No pending visitors found.</td></tr>';
    return;
  }

  visitors.forEach((visitor) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${visitor.name || '-'}</td>
      <td>${visitor.phone || '-'}</td>
      <td>${visitor.host || '-'}</td>
      <td>${visitor.purpose || '-'}</td>
      <td><span class="pill">${visitor.status || '-'}</span></td>
      <td>
        <button data-approve-id="${visitor._id}" data-hours="24">Approve 24h</button>
        <button data-approve-id="${visitor._id}" data-hours="72">Approve 72h</button>
      </td>
    `;
    body.appendChild(row);
  });
}

function renderActiveVisitors(visitors) {
  const body = document.getElementById('activeTableBody');
  body.innerHTML = '';

  if (!Array.isArray(visitors) || visitors.length === 0) {
    body.innerHTML = '<tr><td colspan="5">No active visitors found.</td></tr>';
    return;
  }

  visitors.forEach((visitor) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${visitor.name || '-'}</td>
      <td>${visitor.phone || '-'}</td>
      <td><span class="pill">${visitor.status || '-'}</span></td>
      <td>${toDate(visitor.checkInTime)}</td>
      <td><button data-checkout-id="${visitor._id}">Check-Out</button></td>
    `;
    body.appendChild(row);
  });
}

function applyHostFilters() {
  const searchTerm = document.getElementById('hostSearchInput').value.trim();
  const statusFilter = document.getElementById('hostStatusFilter').value;

  const filtered = appState.pendingVisitors.filter((visitor) => {
    const statusMatch = statusFilter === 'all' || normalizeText(visitor.status) === statusFilter;
    const searchMatch = matchesSearch(visitor, searchTerm);
    return statusMatch && searchMatch;
  });

  renderPendingVisitors(filtered);
}

function applyGuardFilters() {
  const searchTerm = document.getElementById('guardSearchInput').value.trim();
  const statusFilter = document.getElementById('guardStatusFilter').value;

  const filtered = appState.activeVisitors.filter((visitor) => {
    const statusMatch = statusFilter === 'all' || normalizeText(visitor.status) === statusFilter;
    const searchMatch = matchesSearch(visitor, searchTerm);
    return statusMatch && searchMatch;
  });

  renderActiveVisitors(filtered);
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    activateTab(btn.dataset.tab);
  });
});

document.getElementById('registerVisitorForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);

  try {
    const payload = Object.fromEntries(form.entries());
    const data = await apiRequest('/visitors/register', 'POST', payload);
    appState.lastVisitorId = data.visitorId;
    saveLastVisitorId();
    otpVisitorId.value = data.visitorId;
    setStatus(`Visitor registered successfully. Visitor ID: ${data.visitorId}`, 'success');
    activateTab('otp');
    updateMetrics({ syncNow: true });
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.getElementById('sendOtpBtn').addEventListener('click', async () => {
  const visitorId = otpVisitorId.value.trim();
  if (!visitorId) {
    setStatus('Enter visitor ID first to send OTP.', 'error');
    return;
  }

  try {
    const data = await apiRequest('/visitors/send-otp', 'POST', { visitorId });
    setStatus(`OTP sent. Demo OTP: ${data.otp || 'sent'}`, 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.getElementById('verifyOtpForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  try {
    const payload = Object.fromEntries(form.entries());
    await apiRequest('/visitors/verify-otp', 'POST', payload);
    setStatus('OTP verified. Visitor moved to pending approval.', 'success');
    activateTab(appState.role === 'guard' ? 'guard' : 'host');
    await refreshDynamicData({ silent: true });
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.getElementById('staffLoginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  try {
    const payload = Object.fromEntries(form.entries());
    const data = await apiRequest('/auth/login', 'POST', payload);
    appState.token = data.token;
    appState.role = data.user?.role || '';
    saveAuth();
    updateRoleLabel();
    setStatus(`Login successful as ${appState.role}.`, 'success');
    activateTab(appState.role === 'guard' ? 'guard' : 'host');
    startAutoRefresh();
    await refreshDynamicData({ silent: true });
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  appState.token = '';
  appState.role = '';
  saveAuth();
  updateRoleLabel();
  startAutoRefresh();
  clearTable('pendingTableBody', 'Login as host to view pending visitors.', 6);
  clearTable('activeTableBody', 'Login as guard to view active visitors.', 5);
  updateMetrics({ pending: '-', active: '-', syncNow: true });
  setStatus('Logged out.', 'success');
});

async function loadPendingVisitors({ silent = false } = {}) {
  if (!appState.token) {
    if (!silent) setStatus('Please login first as host.', 'error');
    clearTable('pendingTableBody', 'Login required to view pending visitors.', 6);
    return 0;
  }

  try {
    const visitors = await apiRequest('/visitors/pending', 'GET', null, true);
    appState.pendingVisitors = Array.isArray(visitors) ? visitors : [];

    if (appState.pendingVisitors.length === 0) {
      renderPendingVisitors([]);
      if (!silent) setStatus('Pending visitors loaded: 0', 'success');
      return 0;
    }

    applyHostFilters();

    if (!silent) setStatus(`Pending visitors loaded: ${appState.pendingVisitors.length}`, 'success');
    return appState.pendingVisitors.length;
  } catch (error) {
    if (!silent) setStatus(error.message, 'error');
    clearTable('pendingTableBody', 'Failed to load pending visitors.', 6);
    return 0;
  }
}

async function approveVisitor(visitorId, validityHours) {
  try {
    await apiRequest('/visitors/approve', 'POST', { visitorId, validityHours: Number(validityHours) }, true);
    setStatus(`Visitor ${visitorId} approved for ${validityHours}h.`, 'success');
    await refreshDynamicData({ silent: true });
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

async function loadActiveVisitors({ silent = false } = {}) {
  if (!appState.token) {
    if (!silent) setStatus('Please login first as guard.', 'error');
    clearTable('activeTableBody', 'Login required to view active visitors.', 5);
    return 0;
  }

  try {
    const visitors = await apiRequest('/visitors/active', 'GET', null, true);
    appState.activeVisitors = Array.isArray(visitors) ? visitors : [];

    if (appState.activeVisitors.length === 0) {
      renderActiveVisitors([]);
      if (!silent) setStatus('Active visitors loaded: 0', 'success');
      return 0;
    }

    applyGuardFilters();

    if (!silent) setStatus(`Active visitors loaded: ${appState.activeVisitors.length}`, 'success');
    return appState.activeVisitors.length;
  } catch (error) {
    if (!silent) setStatus(error.message, 'error');
    clearTable('activeTableBody', 'Failed to load active visitors.', 5);
    return 0;
  }
}

async function checkOutVisitor(visitorId) {
  try {
    await apiRequest('/visitors/check-out', 'POST', { visitorId }, true);
    setStatus(`Visitor ${visitorId} checked out.`, 'success');
    await refreshDynamicData({ silent: true });
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

async function refreshDynamicData({ silent = false } = {}) {
  let pending = '-';
  let active = '-';

  if (!appState.token) {
    updateMetrics({ pending, active, syncNow: true });
    if (!silent) setStatus('Guest mode active. Login for live host/guard data.', 'success');
    return;
  }

  if (appState.role === 'host') {
    pending = await loadPendingVisitors({ silent: true });
    active = '-';
  } else if (appState.role === 'guard') {
    active = await loadActiveVisitors({ silent: true });
    pending = '-';
  } else {
    pending = await loadPendingVisitors({ silent: true });
    active = await loadActiveVisitors({ silent: true });
  }

  updateMetrics({ pending, active, syncNow: true });
  if (!silent) setStatus('Live data refreshed successfully.', 'success');
}

document.getElementById('loadPendingBtn').addEventListener('click', loadPendingVisitors);
document.getElementById('loadActiveBtn').addEventListener('click', loadActiveVisitors);
document.getElementById('refreshAllBtn').addEventListener('click', () => refreshDynamicData());
autoRefreshToggle.addEventListener('change', () => {
  startAutoRefresh();
  setStatus(autoRefreshToggle.checked ? 'Auto refresh enabled (20s).' : 'Auto refresh disabled.', 'success');
});

document.getElementById('checkInForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!appState.token) {
    setStatus('Please login first as guard.', 'error');
    return;
  }

  const form = new FormData(event.target);
  const payload = Object.fromEntries(form.entries());

  try {
    await apiRequest('/visitors/check-in', 'POST', payload, true);
    event.target.reset();
    setStatus(`Visitor ${payload.visitorId} checked in.`, 'success');
    await refreshDynamicData({ silent: true });
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.getElementById('pendingTableBody').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-approve-id]');
  if (!button) return;
  approveVisitor(button.dataset.approveId, button.dataset.hours);
});

document.getElementById('activeTableBody').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-checkout-id]');
  if (!button) return;
  checkOutVisitor(button.dataset.checkoutId);
});

document.getElementById('hostSearchInput').addEventListener('input', applyHostFilters);
document.getElementById('hostStatusFilter').addEventListener('change', applyHostFilters);
document.getElementById('guardSearchInput').addEventListener('input', applyGuardFilters);
document.getElementById('guardStatusFilter').addEventListener('change', applyGuardFilters);

document.getElementById('rruLogo').addEventListener('error', () => {
  setStatus('Logo not found. Add your RRU logo at frontend/assets/rru-logo.png', 'error');
});

clearTable('pendingTableBody', 'Login as host to view pending visitors.', 6);
clearTable('activeTableBody', 'Login as guard to view active visitors.', 5);
updateRoleLabel();
updateMetrics({ pending: '-', active: '-', syncNow: true });
setStatus('Ready. Configure API base and start using modules.', 'success');
