(function () {
  const API = '/api/tips';

  function load(containerId, status) {
    const container = document.getElementById(containerId);
    if (!container) return;

    fetch(API + (status ? `?status=${status}` : ''))
      .then(r => r.json())
      .then(tips => {
        if (!tips.length) {
          container.innerHTML = '<p class="text-muted">Nenhuma dica encontrada.</p>';
          return;
        }
        container.innerHTML = tips.map(t => `
          <div class="admin-tip-card" data-id="${t.id}">
            <div class="admin-tip-header">
              <h3>${esc(t.title)}</h3>
              <span class="badge badge-${t.status === 'approved' ? 'success' : t.status === 'rejected' ? 'danger' : 'warning'}">${t.status}</span>
            </div>
            <div class="admin-tip-meta">
              <span><strong>${esc(t.name)}</strong> &lt;${esc(t.email)}&gt;</span>
              <span>${esc(t.category)}</span>
              <span>${new Date(t.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="admin-tip-body">${esc(t.content)}</div>
            ${t.tags?.length ? `<div class="admin-tip-tags">${t.tags.map(tag => `<span class="tip-tag">${esc(tag)}</span>`).join('')}</div>` : ''}
            <div class="admin-tip-actions">
              ${t.status !== 'approved' ? `<button class="btn btn-sm btn-success" onclick="window.adminApprove('${t.id}')">Aprovar</button>` : ''}
              ${t.status !== 'rejected' ? `<button class="btn btn-sm btn-danger" onclick="window.adminReject('${t.id}')">Rejeitar</button>` : ''}
              <button class="btn btn-sm btn-ghost" onclick="window.adminDelete('${t.id}')">Excluir</button>
            </div>
          </div>
        `).join('');
      })
      .catch(err => { container.innerHTML = `<p class="text-danger">Erro ao carregar: ${err.message}</p>`; });
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  window.adminApprove = function (id) {
    fetch(`${API}/${id}/approve`, { method: 'PUT' })
      .then(r => r.ok ? (loadAll(), null) : r.json().then(e => { throw e; }))
      .catch(err => alert('Erro: ' + err.message));
  };

  window.adminReject = function (id) {
    fetch(`${API}/${id}/reject`, { method: 'PUT' })
      .then(r => r.ok ? (loadAll(), null) : r.json().then(e => { throw e; }))
      .catch(err => alert('Erro: ' + err.message));
  };

  window.adminDelete = function (id) {
    if (!confirm('Excluir esta dica?')) return;
    fetch(`${API}/${id}`, { method: 'DELETE' })
      .then(r => r.ok ? (loadAll(), null) : r.json().then(e => { throw e; }))
      .catch(err => alert('Erro: ' + err.message));
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

  window.Admin = { load, loadAll };
})();
