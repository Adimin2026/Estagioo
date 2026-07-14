(function () {
  const form = document.getElementById('tip-form');
  if (!form) return;

  const successMsg = document.getElementById('form-success');
  const errorMsg = document.getElementById('form-error');
  const errorText = errorMsg?.querySelector('.alert-message');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (successMsg) successMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';

    if (!this.checkValidity()) {
      this.reportValidity();
      return;
    }

    const data = {
      name: document.getElementById('name')?.value,
      email: document.getElementById('email')?.value,
      category: document.getElementById('category')?.value,
      title: document.getElementById('title')?.value,
      content: document.getElementById('content')?.value,
      tags: document.getElementById('tags')?.value
    };

    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        let msg = 'Erro ao enviar dica';
        try { const err = await res.json(); msg = err.error || msg; } catch {}
        throw new Error(msg);
      }

      if (successMsg) successMsg.style.display = 'flex';
      this.reset();
      setTimeout(() => { if (successMsg) successMsg.style.display = 'none'; }, 8000);
    } catch (err) {
      if (errorText) errorText.textContent = err.message;
      if (errorMsg) errorMsg.style.display = 'flex';
    }
  });
})();
