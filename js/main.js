// Inicialização principal (global: window.initMain)

window.initMain = function () {
  // Aplica tema salvo antes da pintura (components.js também aplica após injetar)
  const saved = window.Storage?.get('theme', 'light') || 'light';
  document.documentElement.setAttribute('data-theme', saved);

  // Marca link ativo conforme a URL
  const current = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-link, .sidebar-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href.endsWith(current) && current !== '') {
      link.classList.add('active');
    }
  });

  // Accordion (FAQ) — funciona onde houver .faq-question/.faq-answer
  document.querySelectorAll('.faq-question').forEach((q) => {
    q.addEventListener('click', () => {
      const answer = q.nextElementSibling;
      q.classList.toggle('active');
      if (answer) answer.classList.toggle('active');
    });
  });

  console.log('Portal IFRO Ariquemes inicializado.');
};

document.addEventListener('DOMContentLoaded', window.initMain);
