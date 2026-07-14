(function () {
  const searchInput = document.getElementById('tip-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();

    document.querySelectorAll('.tip-card, .tip-category-card').forEach(card => {
      const title = card.querySelector('.tip-card-title, .tip-category-title')?.textContent?.toLowerCase() || '';
      const body = card.querySelector('.tip-card-body, .tip-category-desc')?.textContent?.toLowerCase() || '';
      const tags = card.querySelector('.tip-tags, .tip-category-desc')?.textContent?.toLowerCase() || '';

      const match = !q || title.includes(q) || body.includes(q) || tags.includes(q);
      card.style.display = match ? '' : 'none';
    });
  });
})();
