(function () {
  const app = document.getElementById('docs-app');
  if (!app) return;

  const API_BASE = (app.dataset.apiBase || window.location.origin).replace(/\/$/, '');
  const TOKEN_KEY = 'xp_docs_access_token';
  const USER_KEY = 'xp_docs_user_id';

  let catalog = { events: [], tiers: [] };

  function $(id) { return document.getElementById(id); }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || $('access-token')?.value?.trim() || '';
  }

  function setToken(access, userId) {
    if (access) {
      localStorage.setItem(TOKEN_KEY, access);
      if ($('access-token')) $('access-token').value = access;
    }
    if (userId) {
      localStorage.setItem(USER_KEY, userId);
      if ($('pg-user-id')) $('pg-user-id').value = userId;
      if ($('auth-user-id')) $('auth-user-id').textContent = 'User ID: ' + userId;
    }
  }

  function showResponse(data, ok) {
    const el = $('pg-response');
    if (!el) return;
    el.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    el.style.borderColor = ok ? 'var(--accent2)' : 'var(--danger)';
  }

  async function apiFetch(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    const res = await fetch(API_BASE + path, { ...options, headers });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    return { ok: res.ok, status: res.status, body };
  }

  // Navigation
  document.querySelectorAll('.docs-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.docs-nav-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.docs-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = $('panel-' + btn.dataset.panel);
      if (panel) panel.classList.add('active');
    });
  });

  // Restore token
  const saved = localStorage.getItem(TOKEN_KEY);
  if (saved && $('access-token')) $('access-token').value = saved;
  const savedUser = localStorage.getItem(USER_KEY);
  if (savedUser) {
    if ($('pg-user-id')) $('pg-user-id').value = savedUser;
    if ($('auth-user-id')) $('auth-user-id').textContent = 'User ID: ' + savedUser;
  }

  $('btn-clear-token')?.addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if ($('access-token')) $('access-token').value = '';
    if ($('auth-user-id')) $('auth-user-id').textContent = '';
  });

  $('access-token')?.addEventListener('change', (e) => {
    localStorage.setItem(TOKEN_KEY, e.target.value.trim());
  });

  // Mock login
  $('btn-mock-login')?.addEventListener('click', async () => {
    const phone = $('auth-phone').value.trim();
    const otp = $('auth-otp').value.trim();
    const result = await apiFetch('/api/v1/mock/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phone, otp_code: otp }),
    });
    const box = $('auth-result');
    if (result.ok && result.body.access) {
      const uid = result.body.user?.id;
      setToken(result.body.access, uid);
      box.innerHTML = '<div class="docs-alert docs-alert--ok">JWT obtained. Token saved for playground.</div>';
    } else {
      box.innerHTML = '<div class="docs-alert docs-alert--error">' + (result.body.error || result.body.message || JSON.stringify(result.body)) + '</div>';
    }
  });

  // Catalog
  async function loadCatalog() {
    const res = await fetch(window.location.pathname.replace(/\/portal\/?$/, '') + '/catalog/');
    if (!res.ok) return;
    catalog = await res.json();
    renderRules();
    renderTiers();
  }

  function renderTiers() {
    const tbody = $('tiers-tbody');
    if (!tbody) return;
    tbody.innerHTML = (catalog.tiers || []).map((t) => {
      const range = t.max_xp != null ? t.min_xp + ' – ' + t.max_xp : t.min_xp + '+';
      return '<tr><td>' + t.label + '</td><td>' + range + '</td><td>' + t.multiplier + 'x</td><td>' + t.expiry_days + '</td></tr>';
    }).join('');
  }

  function renderRules() {
    const tbody = $('rules-tbody');
    if (!tbody) return;
    const cat = ($('rules-filter')?.value || '').toLowerCase();
    const q = ($('rules-search')?.value || '').toLowerCase();
    const rows = [];
    (catalog.events || []).forEach((ev) => {
      if (cat && ev.category !== cat) return;
      if (q && !ev.event_code.toLowerCase().includes(q)) return;
      const rule = (ev.rules && ev.rules[0]) || {};
      rows.push(
        '<tr><td><code>' + ev.event_code + '</code><br><small style="color:var(--muted)">' + (ev.description || '') + '</small></td>' +
        '<td><span class="docs-tag docs-tag--' + ev.category + '">' + ev.category + '</span></td>' +
        '<td>' + (rule.base_xp ?? '—') + '</td>' +
        '<td>' + (rule.daily_cap_xp ?? '—') + '</td>' +
        '<td>' + (rule.cooldown_seconds ? rule.cooldown_seconds + 's' : '—') + '</td>' +
        '<td>' + (rule.max_per_lifetime ?? '—') + '</td>' +
        '<td>' + (rule.expiry_days ?? '—') + '</td>' +
        '<td><button type="button" class="docs-btn docs-btn--sm use-event" data-code="' + ev.event_code + '">Try</button></td></tr>'
      );
    });
    tbody.innerHTML = rows.join('') || '<tr><td colspan="8">No events. Run: python manage.py seed_xp_events</td></tr>';
    tbody.querySelectorAll('.use-event').forEach((btn) => {
      btn.addEventListener('click', () => {
        $('pg-event').value = btn.dataset.code;
        document.querySelector('.docs-nav-btn[data-panel="playground"]')?.click();
        $('btn-gen-idem')?.click();
      });
    });
  }

  $('rules-filter')?.addEventListener('change', renderRules);
  $('rules-search')?.addEventListener('input', renderRules);

  // Playground
  function nowIso() {
    return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
  if ($('pg-occurred')) $('pg-occurred').value = nowIso();

  $('btn-gen-idem')?.addEventListener('click', () => {
    $('pg-idem').value = 'demo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  });
  $('btn-gen-idem')?.click();

  $('btn-trigger')?.addEventListener('click', async () => {
    let meta = {};
    try { meta = JSON.parse($('pg-meta').value || '{}'); } catch (e) {
      showResponse('Invalid JSON in source_metadata', false);
      return;
    }
    const payload = {
      event_code: $('pg-event').value.trim(),
      user_id: $('pg-user-id').value.trim(),
      idempotency_key: $('pg-idem').value.trim(),
      occurred_at: $('pg-occurred').value.trim() || nowIso(),
      source_metadata: meta,
      unit_count: parseInt($('pg-units').value, 10) || 1,
    };
    const r = await apiFetch('/api/v1/xp/trigger-event', { method: 'POST', body: JSON.stringify(payload) });
    showResponse(r.body, r.ok);
  });

  $('btn-balance')?.addEventListener('click', async () => {
    const uid = $('pg-user-id').value.trim();
    const r = await apiFetch('/api/v1/xp/balance?user_id=' + encodeURIComponent(uid));
    showResponse(r.body, r.ok);
  });

  $('btn-txns')?.addEventListener('click', async () => {
    const uid = $('pg-user-id').value.trim();
    const r = await apiFetch('/api/v1/xp/transactions?user_id=' + encodeURIComponent(uid) + '&per_page=10');
    showResponse(r.body, r.ok);
  });

  $('btn-leaderboard')?.addEventListener('click', async () => {
    const period = $('pg-lb-period').value;
    const r = await apiFetch('/api/v1/xp/leaderboard?period=' + period + '&limit=20');
    showResponse(r.body, r.ok);
  });

  // cURL blocks
  const curls = [
    { title: '1. Mock login (sandbox JWT)', method: 'POST', path: '/api/v1/mock/auth/verify-otp', body: { phone_number: '+93700123456', otp_code: '123456' }, auth: false },
    { title: '2. Trigger XP event', method: 'POST', path: '/api/v1/xp/trigger-event', body: { event_code: 'WIN_MATCH_CASUAL', user_id: '$USER_ID', idempotency_key: 'match-001-user-001', occurred_at: '2026-05-21T12:00:00Z', source_metadata: { match_id: 'm1' }, unit_count: 1 } },
    { title: '3. Get balance', method: 'GET', path: '/api/v1/xp/balance?user_id=$USER_ID', body: null },
    { title: '4. List transactions', method: 'GET', path: '/api/v1/xp/transactions?user_id=$USER_ID&per_page=20', body: null },
    { title: '5. List rules', method: 'GET', path: '/api/v1/xp/rules?category=win', body: null },
    { title: '6. Leaderboard', method: 'GET', path: '/api/v1/xp/leaderboard?period=weekly&limit=50', body: null },
  ];

  const curlContainer = $('curl-blocks');
  if (curlContainer) {
    curlContainer.innerHTML = curls.map((c) => {
      let cmd = 'curl -s -X ' + c.method + ' "' + API_BASE + c.path.replace(/\$USER_ID/g, '$USER_ID') + '"';
      if (c.auth !== false) cmd += ' \\\n  -H "Authorization: Bearer $TOKEN"';
      cmd += ' \\\n  -H "Content-Type: application/json"';
      if (c.body) cmd += ' \\\n  -d \'' + JSON.stringify(c.body, null, 0).replace(/'/g, "'\\''") + "'";
      return '<div style="margin-bottom:1.25rem"><h4 style="margin:0 0 0.5rem;font-size:0.95rem">' + c.title + '</h4><pre class="docs-pre">' + cmd + '</pre><button type="button" class="docs-btn docs-btn--sm copy-curl" data-cmd="' + encodeURIComponent(cmd) + '">Copy</button></div>';
    }).join('');
    curlContainer.querySelectorAll('.copy-curl').forEach((btn) => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(decodeURIComponent(btn.dataset.cmd));
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      });
    });
  }

  loadCatalog();
})();
