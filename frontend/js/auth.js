const API_BASE_URL = 'https://saukele-backend-production.up.railway.app';

const ROLE_PAGES = {
  COUPLE: ['dashboard', 'registry', 'family', 'orders'],
  GUEST: ['contribute'],
  VENDOR: ['vendor', 'orders'],
  COURIER: ['orders'],
  ADMIN: ['admin']
};

const NAV_LINKS = {
  COUPLE: [
    { href: '/pages/dashboard.html', label: 'Dashboard', id: 'dashboard' },
    { href: '/pages/registry.html', label: '💍 Registry', id: 'registry' },
    { href: '/pages/family.html', label: '👨‍👩‍👧‍👦 Family', id: 'family' },
    { href: '/pages/orders.html', label: '📦 Orders', id: 'orders' },
  ],
  GUEST: [
    { href: '/pages/contribute.html', label: '🤝 Contribute', id: 'contribute' },
  ],
  VENDOR: [
    { href: '/pages/vendor.html', label: '🛍️ My Shop', id: 'vendor' },
    { href: '/pages/orders.html', label: '📦 Orders', id: 'orders' },
  ],
  COURIER: [
    { href: '/pages/orders.html', label: '🚚 Deliveries', id: 'orders' },
  ],
  ADMIN: [
    { href: '/pages/admin.html', label: '⚙️ Admin', id: 'admin' },
  ]
};

function getUser() {
  return JSON.parse(localStorage.getItem('user') || 'null');
}

function requireAuth() {
  const user = getUser();
  if (!user) { location.href = '/pages/login.html'; return null; }
  return user;
}

function requireRole(allowedRoles) {
  const user = requireAuth();
  if (!user) return null;
  if (!allowedRoles.includes(user.role)) {
    alert(`Access denied. This page is for: ${allowedRoles.join(', ')}`);
    redirectToHome(user.role);
    return null;
  }
  return user;
}

function redirectToHome(role) {
  const homes = {
    COUPLE: '/pages/dashboard.html',
    GUEST: '/pages/contribute.html',
    VENDOR: '/pages/vendor.html',
    COURIER: '/pages/orders.html',
    ADMIN: '/pages/admin.html'
  };
  location.href = homes[role] || '/pages/login.html';
}

function buildNav(containerId, activePage) {
  const user = getUser();
  if (!user) return;
  const links = NAV_LINKS[user.role] || [];
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = links.map(l =>
    `<a href="${l.href}" ${l.id === activePage ? 'class="active"' : ''}>${l.label}</a>`
  ).join('') +
  `<span style="color:rgba(255,255,255,0.7);font-size:0.8rem">${user.email}</span>` +
  `<a href="#" onclick="logout()">Logout</a>`;
}

function logout() {
  const token = localStorage.getItem('refreshToken');
  if (token) {
    fetch(API_BASE_URL + '/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token })
    }).catch(() => {});
  }
  localStorage.clear();
  location.href = '/pages/login.html';
}

async function authFetch(url, opts = {}) {
  if (url.startsWith('/api/')) url = API_BASE_URL + url;
  const token = localStorage.getItem('accessToken');
  opts.headers = { ...opts.headers, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  let res = await fetch(url, opts);
  if (res.status === 401) {
    const rr = await fetch(API_BASE_URL + '/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') })
    });
    if (rr.ok) {
      const d = await rr.json();
      localStorage.setItem('accessToken', d.accessToken);
      localStorage.setItem('refreshToken', d.refreshToken);
      opts.headers['Authorization'] = `Bearer ${d.accessToken}`;
      res = await fetch(url, opts);
    } else { logout(); }
  }
  return res;
}