// Navegação: menu mobile, dropdown e sidebar.
// Auto-inicializa e é idempotente.

window.initNavigation = function () {
  if (document.documentElement.dataset.navInit === 'true') return;
  document.documentElement.dataset.navInit = 'true';

  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-list');
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  const sidebar = document.querySelector('.sidebar');
  const sidebarClose = document.querySelector('.sidebar-close');
  const sidebarOverlay = document.querySelector('.sidebar-overlay');

  const openSidebar = () => {
    sidebar?.classList.add('active');
    sidebarOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  const closeSidebar = () => {
    sidebar?.classList.remove('active');
    sidebarOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (navToggle) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navToggle.classList.toggle('active');
      if (sidebar) {
        sidebar.classList.toggle('active');
        sidebarOverlay?.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
      }
    });
  }

  if (sidebarClose) sidebarClose.addEventListener('click', () => { closeSidebar(); navToggle?.classList.remove('active'); });
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => { closeSidebar(); navToggle?.classList.remove('active'); });

  dropdowns.forEach((dd) => {
    const btn = dd.querySelector('.dropdown-toggle');
    if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); dd.classList.toggle('active'); });
  });

  document.addEventListener('click', (e) => {
    if (sidebar && !sidebar.contains(e.target) && !sidebarOverlay?.contains(e.target) && !navToggle?.contains(e.target)) {
      closeSidebar();
      navToggle?.classList.remove('active');
    }
    dropdowns.forEach((dd) => { if (!dd.contains(e.target)) dd.classList.remove('active'); });
  });
};
// Observação: a inicialização é disparada por js/components.js após injetar o header.
