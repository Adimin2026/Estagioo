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

  if (navToggle && navList) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navList.classList.toggle('active');
    });
  }

  if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  dropdowns.forEach((dd) => {
    const btn = dd.querySelector('.dropdown-toggle');
    if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); dd.classList.toggle('active'); });
  });

  document.addEventListener('click', (e) => {
    if (navList && !navList.contains(e.target) && !navToggle?.contains(e.target)) navList.classList.remove('active');
    if (sidebar && !sidebar.contains(e.target) && !sidebarOverlay?.contains(e.target)) closeSidebar();
    dropdowns.forEach((dd) => { if (!dd.contains(e.target)) dd.classList.remove('active'); });
  });
};
// Observação: a inicialização é disparada por js/components.js após injetar o header.
