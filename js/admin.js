(function () {
  const API = '/api/tips';

  function getLocalTips() {
    try {
      return JSON.parse(localStorage.getItem('pendingTips') || '[]');
    } catch {
      return [];
    }
  }

  function mergeTips(apiTips, localTips) {
    const ids = new Set(apiTips.map(function(t) { return t.id; }));
    var merged = apiTips.slice();
    localTips.forEach(function(t) {
      if (!ids.has(t.id)) merged.push(t);
    });
    return merged;
  }

  function load(containerId, status) {
    const container = document.getElementById(containerId);
    if (!container) return;

    var localTips = getLocalTips();

    fetch(API + (status ? '?status=' + status : ''))
      .then(function(r) { return r.json(); })
      .then(function(apiTips) {
        var tips = mergeTips(apiTips, localTips);
        if (status) tips = tips.filter(function(t) { return t.status === status; });
        render(container, tips);
      })
      .catch(function() {
        var tips = localTips;
        if (status) tips = tips.filter(function(t) { return t.status === status; });
        render(container, tips);
      });
  }

  function render(container, tips) {
    if (!tips.length) {
      container.innerHTML = '<p class="text-muted">Nenhuma dica encontrada.</p>';
      return;
    }
    container.innerHTML = tips.map(function(t) {
      return '<div class="admin-tip-card" data-id="' + t.id + '">' +
        '<div class="admin-tip-header">' +
          '<h3>' + esc(t.title) + '</h3>' +
          '<span class="badge badge-' + (t.status === 'approved' ? 'success' : t.status === 'rejected' ? 'danger' : 'warning') + '">' + t.status + '</span>' +
        '</div>' +
        '<div class="admin-tip-meta">' +
          '<span><strong>' + esc(t.name) + '</strong> &lt;' + esc(t.email) + '&gt;</span>' +
          '<span>' + esc(t.category) + '</span>' +
          '<span>' + new Date(t.createdAt).toLocaleDateString('pt-BR') + '</span>' +
        '</div>' +
        '<div class="admin-tip-body">' + esc(t.content) + '</div>' +
        (t.tags && t.tags.length ? '<div class="admin-tip-tags">' + t.tags.map(function(tag) { return '<span class="tip-tag">' + esc(tag) + '</span>'; }).join('') + '</div>' : '') +
        '<div class="admin-tip-actions">' +
          (t.status !== 'approved' ? '<button class="btn btn-sm btn-success" onclick="window.adminApprove(\'' + t.id + '\')">Aprovar</button>' : '') +
          (t.status !== 'rejected' ? '<button class="btn btn-sm btn-danger" onclick="window.adminReject(\'' + t.id + '\')">Rejeitar</button>' : '') +
          '<button class="btn btn-sm btn-ghost" onclick="window.adminDelete(\'' + t.id + '\')">Excluir</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function removeLocalTip(id) {
    var tips = getLocalTips().filter(function(t) { return t.id !== id; });
    localStorage.setItem('pendingTips', JSON.stringify(tips));
  }

  window.adminApprove = function (id) {
    fetch(API + '/' + id + '/approve', { method: 'PUT' })
      .then(function(r) { return r.ok ? loadAll() : r.json().then(function(e) { throw e; }); })
      .catch(function() {
        removeLocalTip(id);
        loadAll();
      });
  };

  window.adminReject = function (id) {
    fetch(API + '/' + id + '/reject', { method: 'PUT' })
      .then(function(r) { return r.ok ? loadAll() : r.json().then(function(e) { throw e; }); })
      .catch(function() {
        removeLocalTip(id);
        loadAll();
      });
  };

  window.adminDelete = function (id) {
    if (!confirm('Excluir esta dica?')) return;
    fetch(API + '/' + id, { method: 'DELETE' })
      .then(function(r) { return r.ok ? loadAll() : r.json().then(function(e) { throw e; }); })
      .catch(function() {
        removeLocalTip(id);
        loadAll();
      });
  };

  function loadAll() {
    load('admin-pending', 'pending');
    load('admin-approved', 'approved');
    load('admin-rejected', 'rejected');
  }

  if (document.getElementById('admin-panel')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadAll);
    } else {
      loadAll();
    }
  }

  window.Admin = { load: load, loadAll: loadAll };
})();
