(function () {
  const API = '/api/tips';
  var tipsById = {};

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

  function renderReplies(t) {
    if (!t.replies || !t.replies.length) return '';
    var items = t.replies.map(function(r) {
      var when = new Date(r.at).toLocaleString('pt-BR');
      return '<li><span class="reply-date">' + esc(when) + '</span>: ' + esc(r.message) + '</li>';
    }).join('');
    return '<div class="admin-tip-replies">' +
      '<strong>Respostas (' + t.replies.length + '):</strong>' +
      '<ul class="admin-tip-replies-list">' + items + '</ul>' +
    '</div>';
  }

  function render(container, tips) {
    tipsById = {};
    tips.forEach(function(t) { tipsById[t.id] = t; });

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
        renderReplies(t) +
        '<div class="admin-tip-actions">' +
          '<button class="btn btn-sm btn-primary" onclick="window.adminReply(\'' + t.id + '\')">Responder</button>' +
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

  var replyId = null;

  function openReplyModal(id) {
    var tip = tipsById[id];
    if (!tip) return;
    replyId = id;
    var modal = document.getElementById('reply-modal');
    var to = document.getElementById('reply-to');
    var msg = document.getElementById('reply-message');
    var status = document.getElementById('reply-status');
    if (to) to.textContent = 'Responder para: ' + (tip.name || 'Autor') + ' <' + tip.email + '>';
    if (msg) msg.value = '';
    if (status) { status.style.display = 'none'; status.textContent = ''; }
    if (fab) fab.style.display = 'none';
    if (modal) modal.classList.add('open');
    if (msg) setTimeout(function () { msg.focus(); }, 50);
  }

  function closeReplyModal() {
    var modal = document.getElementById('reply-modal');
    if (modal) modal.classList.remove('open');
    if (fab) fab.style.display = '';
    replyId = null;
  }

  function sendReply() {
    if (!replyId) return;
    var tip = tipsById[replyId];
    var msgEl = document.getElementById('reply-message');
    var status = document.getElementById('reply-status');
    var message = msgEl ? msgEl.value.trim() : '';
    if (!message) {
      if (status) { status.style.display = 'block'; status.textContent = 'Escreva uma mensagem antes de enviar.'; }
      return;
    }
    fetch(API + '/' + replyId + '/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message })
    })
      .then(function (r) {
        if (r.ok) return r.json();
        return r.json().then(function (e) { throw e; });
      })
      .then(function () {
        closeReplyModal();
        loadAll();
        alert('Resposta enviada para ' + (tip ? tip.email : 'o autor') + '!');
      })
      .catch(function (err) {
        var subject = 'Resposta sobre sua dica' + (tip && tip.title ? ' "' + tip.title + '"' : '') + ' - Portal de Estágio IFRO';
        var mailto = 'mailto:' + encodeURIComponent(tip ? tip.email : '') +
          '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message);
        window.location.href = mailto;
        closeReplyModal();
        alert((err && err.error ? err.error + '. ' : '') + 'O e-mail foi aberto no seu cliente para envio manual.');
      });
  }

  function initReplyModal() {
    var modal = document.getElementById('reply-modal');
    if (!modal) return;
    var close = document.getElementById('reply-close');
    var cancel = document.getElementById('reply-cancel');
    var send = document.getElementById('reply-send');
    if (close) close.addEventListener('click', closeReplyModal);
    if (cancel) cancel.addEventListener('click', closeReplyModal);
    if (send) send.addEventListener('click', sendReply);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeReplyModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeReplyModal();
    });
  }

  function loadAll() {
    load('admin-pending', 'pending');
    load('admin-approved', 'approved');
    load('admin-rejected', 'rejected');
  }

  if (document.getElementById('admin-panel')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { loadAll(); initReplyModal(); });
    } else {
      loadAll();
      initReplyModal();
    }
  }

  window.adminReply = openReplyModal;
  window.Admin = { load: load, loadAll: loadAll };
})();
