(function () {
  const form = document.getElementById('tip-form');
  if (!form) return;

  const successMsg = document.getElementById('form-success');
  const errorMsg = document.getElementById('form-error');
  const errorText = errorMsg?.querySelector('.alert-message');

  function saveToLocal(data) {
    const tips = JSON.parse(localStorage.getItem('pendingTips') || '[]');
    tips.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ...data,
      tags: data.tags ? data.tags.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [],
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('pendingTips', JSON.stringify(tips));
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (successMsg) successMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';

    if (!this.checkValidity()) {
      this.reportValidity();
      return;
    }

    var data = {
      name: document.getElementById('name')?.value,
      email: document.getElementById('email')?.value,
      category: document.getElementById('category')?.value,
      title: document.getElementById('title')?.value,
      content: document.getElementById('content')?.value,
      tags: document.getElementById('tags')?.value
    };

    try {
      var controller = new AbortController();
      var timeout = setTimeout(function() { controller.abort(); }, 5000);

      var res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) {
        var msg = 'Erro ao enviar dica';
        try { var err = await res.json(); msg = err.error || msg; } catch (ex) {}
        throw new Error(msg);
      }

      if (successMsg) successMsg.style.display = 'flex';
      this.reset();
      setTimeout(function() { if (successMsg) successMsg.style.display = 'none'; }, 8000);
    } catch (err) {
      saveToLocal(data);
      if (successMsg) successMsg.style.display = 'flex';
      this.reset();
      setTimeout(function() { if (successMsg) successMsg.style.display = 'none'; }, 8000);
    }
  });
})();
