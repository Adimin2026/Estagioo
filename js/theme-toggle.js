// Toggle de tema claro/escuro com persistência via localStorage.
// Auto-inicializa e é idempotente (pode ser carregado em qualquer página).

window.initThemeToggle = function () {
  if (document.documentElement.dataset.themeToggle === 'true') return;
  document.documentElement.dataset.themeToggle = 'true';

  const toggle = document.getElementById('theme-toggle');
  const toggleSidebar = document.getElementById('theme-toggle-sidebar');

  const apply = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    window.Storage?.set('theme', theme);
  };

  const saved = window.Storage?.get('theme', 'light') || 'light';
  document.documentElement.setAttribute('data-theme', saved);

  const handler = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    apply(current === 'light' ? 'dark' : 'light');
  };

  if (toggle) toggle.addEventListener('click', handler);
  if (toggleSidebar) toggleSidebar.addEventListener('click', handler);
};
// Observação: a inicialização é disparada por js/components.js após injetar o header.
