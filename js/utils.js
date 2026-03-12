/* ============================================================
   UTILS.JS — Shared utilities for Restaurant Pro
   ============================================================ */

// ─── Theme Management ────────────────────────────────────
const ThemeManager = {
  current: () => document.documentElement.getAttribute('data-theme') || 'dark',

  toggle() {
    const next = this.current() === 'dark' ? 'light' : 'dark';
    this.set(next);
  },

  set(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rms_theme', theme);
    // Save to Firestore if user is logged in
    const user = firebase.auth().currentUser;
    if (user) {
      db.collection(Collections.USERS).doc(user.uid).update({
        'preferences.theme': theme
      }).catch(() => {});
    }
    const icon = document.getElementById('themeToggleIcon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  },

  load(savedTheme) {
    const theme = savedTheme || localStorage.getItem('rms_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('themeToggleIcon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
};

// ─── Toast Notifications ─────────────────────────────────
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container-custom';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    this.init();
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const t = document.createElement('div');
    t.className = `toast-custom ${type}`;
    t.innerHTML = `
      <span style="font-size:18px">${icons[type] || '•'}</span>
      <span style="flex:1">${message}</span>
      <span onclick="this.parentElement.remove()" style="cursor:pointer;color:var(--text-muted);font-size:16px">✕</span>
    `;
    this.container.appendChild(t);
    setTimeout(() => {
      t.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => t.remove(), 280);
    }, duration);
  },

  success: (msg, d) => Toast.show(msg, 'success', d),
  error:   (msg, d) => Toast.show(msg, 'error', d),
  info:    (msg, d) => Toast.show(msg, 'info', d),
  warning: (msg, d) => Toast.show(msg, 'warning', d),
};

// ─── Loading Overlay ──────────────────────────────────────
const Loader = {
  show() {
    let el = document.getElementById('globalLoader');
    if (!el) {
      el = document.createElement('div');
      el.id = 'globalLoader';
      el.className = 'loading-overlay';
      el.innerHTML = `
        <div style="text-align:center">
          <div class="spinner-amber mb-3" style="margin:0 auto 16px"></div>
          <div style="font-family:var(--font-display);color:var(--text-secondary);font-size:14px">Loading…</div>
        </div>`;
      document.body.appendChild(el);
    }
    el.style.display = 'flex';
  },
  hide() {
    const el = document.getElementById('globalLoader');
    if (el) el.style.display = 'none';
  }
};

// ─── Format Helpers ───────────────────────────────────────
const fmt = {
  currency(amount, symbol = '$') {
    return `${symbol}${Number(amount || 0).toFixed(2)}`;
  },
  date(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  time(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  },
  datetime(ts) {
    return `${this.date(ts)} ${this.time(ts)}`;
  },
  orderId(id) {
    return '#' + (id || '').slice(-6).toUpperCase();
  }
};

// ─── Status Chip HTML ─────────────────────────────────────
function statusChip(status) {
  const map = {
    Available:  'chip-success',
    Occupied:   'chip-danger',
    Reserved:   'chip-warning',
    Pending:    'chip-warning',
    Cooking:    'chip-info',
    Ready:      'chip-purple',
    Served:     'chip-success',
    Paid:       'chip-success',
    Unpaid:     'chip-danger',
    Cancelled:  'chip-muted',
    Takeaway:   'chip-info',
    'Pre-order':'chip-purple',
    'Table Order':'chip-success',
  };
  const cls = map[status] || 'chip-muted';
  return `<span class="chip ${cls}">${status}</span>`;
}

// ─── Auth Guard ───────────────────────────────────────────
function requireAuth(callback) {
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'index.html';
    } else {
      callback(user);
    }
  });
}

// ─── Sidebar Collapse ─────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('appSidebar');
  if (sidebar) sidebar.classList.toggle('sidebar-collapsed');
}

// ─── Active Nav Link ──────────────────────────────────────
function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-link-custom').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === page) link.classList.add('active');
  });
}

// ─── Sidebar HTML Generator ───────────────────────────────
function getSidebarHTML(activeUserId) {
  return `
  <div class="sidebar-brand">
    <div class="brand-logo">🍽️</div>
    <div>
      <div class="brand-name">Restaurant Pro</div>
      <div class="brand-tagline">Management System</div>
    </div>
  </div>

  <div class="sidebar-section">
    <div class="sidebar-section-label">Main</div>
    <a class="nav-link-custom" href="dashboard.html">
      <span class="nav-icon">📊</span><span>Dashboard</span>
    </a>
    <a class="nav-link-custom" href="tables.html">
      <span class="nav-icon">🪑</span><span>Tables</span>
    </a>
    <a class="nav-link-custom" href="orders.html">
      <span class="nav-icon">🛒</span><span>Orders</span>
      <span class="nav-badge" id="pendingOrdersBadge" style="display:none">0</span>
    </a>
    <a class="nav-link-custom" href="kitchen.html">
      <span class="nav-icon">👨‍🍳</span><span>Kitchen</span>
    </a>
  </div>

  <div class="sidebar-section">
    <div class="sidebar-section-label">Management</div>
    <a class="nav-link-custom" href="menu.html">
      <span class="nav-icon">🍕</span><span>Menu</span>
    </a>
    <a class="nav-link-custom" href="billing.html">
      <span class="nav-icon">💳</span><span>Billing</span>
    </a>
    <a class="nav-link-custom" href="history.html">
      <span class="nav-icon">📜</span><span>History</span>
    </a>
  </div>

  <div class="sidebar-section">
    <div class="sidebar-section-label">Account</div>
    <a class="nav-link-custom" href="profile.html">
      <span class="nav-icon">👤</span><span>Profile</span>
    </a>
  </div>

  <div class="sidebar-footer">
    <div class="user-pill" onclick="window.location='profile.html'">
      <div class="user-avatar" id="sidebarAvatar">?</div>
      <div>
        <div class="user-name" id="sidebarUserName">Loading…</div>
        <div class="user-role" id="sidebarUserRole">Staff</div>
      </div>
    </div>
  </div>
  `;
}

// ─── Topbar HTML ──────────────────────────────────────────
function getTopbarHTML(title, subtitle) {
  return `
  <button class="icon-btn me-2" onclick="toggleSidebar()" title="Toggle sidebar">☰</button>
  <div>
    <div class="topbar-title">${title}</div>
    ${subtitle ? `<div class="topbar-subtitle">${subtitle}</div>` : ''}
  </div>
  <div class="topbar-spacer"></div>
  <div class="topbar-search">
    <span class="search-icon">🔍</span>
    <input type="text" placeholder="Search…" id="globalSearch" autocomplete="off">
  </div>
  <button class="icon-btn" id="themeToggleBtn" onclick="ThemeManager.toggle()" title="Toggle theme">
    <span id="themeToggleIcon">☀️</span>
  </button>
  <button class="icon-btn" onclick="auth.signOut().then(()=>window.location='index.html')" title="Sign out">🚪</button>
  `;
}

// ─── Load sidebar user info ───────────────────────────────
async function loadSidebarUser(user) {
  try {
    const doc = await db.collection(Collections.USERS).doc(user.uid).get();
    const data = doc.data() || {};
    const name = data.displayName || user.displayName || user.email.split('@')[0];
    const role = data.role || 'Staff';

    document.getElementById('sidebarUserName').textContent = name;
    document.getElementById('sidebarUserRole').textContent = role;

    const avatar = document.getElementById('sidebarAvatar');
    if (data.photoURL) {
      avatar.innerHTML = `<img src="${data.photoURL}" alt="avatar">`;
    } else {
      avatar.textContent = name.charAt(0).toUpperCase();
    }

    // Load theme
    ThemeManager.load(data.preferences?.theme);

    // Live order badge
    db.collection(Collections.ORDERS)
      .where('status', 'in', ['Pending', 'Cooking'])
      .onSnapshot(snap => {
        const badge = document.getElementById('pendingOrdersBadge');
        if (badge) {
          badge.textContent = snap.size;
          badge.style.display = snap.size > 0 ? 'inline' : 'none';
        }
      });
  } catch (e) {}
}

// ─── Log Activity ─────────────────────────────────────────
async function logActivity(action, details = {}) {
  const user = firebase.auth().currentUser;
  if (!user) return;
  try {
    await db.collection(Collections.ACTIVITY).add({
      uid: user.uid,
      action,
      details,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {}
}

// ─── Confirm Dialog ───────────────────────────────────────
function confirmDialog(message, onConfirm, onCancel) {
  const modal = document.getElementById('confirmModal');
  if (!modal) {
    // fallback
    if (window.confirm(message)) onConfirm();
    return;
  }
  document.getElementById('confirmMessage').textContent = message;
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
  document.getElementById('confirmOkBtn').onclick = () => {
    bsModal.hide();
    onConfirm();
  };
  if (onCancel) {
    document.getElementById('confirmCancelBtn').onclick = () => {
      bsModal.hide();
      onCancel();
    };
  }
}

// ─── Generate Order ID ────────────────────────────────────
function generateOrderId() {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase();
}

// ─── Tax Rate ─────────────────────────────────────────────
const TAX_RATE = 0.08; // 8%

function calcBillAmounts(subtotal) {
  const tax   = subtotal * TAX_RATE;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}
