// Componentes compartilhados: injeta header (com sidebar) e footer em todos os
// páginas a partir de um único template. Os links são root-relative; cada página
// define um <base href> apropriado à sua profundidade para resolvê-los.
// Carregado como script clássico (defer). Depende de theme-toggle.js e
// navigation.js (que definem window.initThemeToggle / window.initNavigation).

(function () {
  const headerHTML = `
<div class="ifro-topbar"></div>
<button class="back-to-top" id="back-to-top" aria-label="Voltar ao topo" title="Voltar ao topo">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
</button>
<header class="header">
    <div class="container">
        <div class="header-content">
            <div class="logo">
                <a href="index.html">
                    <img src="assets/images/logo-ifro.png" alt="IFRO Campus Ariquemes" width="180">
                </a>
            </div>
            <nav class="nav">
                <button class="nav-toggle" aria-label="Menu">
                    <span class="hamburger">
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                    </span>
                </button>
                <ul class="nav-list">
                    <li><a href="index.html" class="nav-link">Início</a></li>
                    <li><a href="pages/estagio-info.html" class="nav-link">Informações de Estágio</a></li>
                    <li><a href="pages/documentos.html" class="nav-link">Documentos</a></li>
                    <li class="nav-dropdown">
                        <a href="pages/dicas/index.html" class="nav-link">Dicas</a>
                        <button class="dropdown-toggle" aria-label="Abrir categorias">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a href="pages/dicas/programacao.html" class="dropdown-item">Programação</a></li>
                            <li><a href="pages/dicas/manutencao.html" class="dropdown-item">Manutenção de Computadores</a></li>
                            <li><a href="pages/dicas/banco-dados.html" class="dropdown-item">Banco de Dados</a></li>
                            <li><a href="pages/dicas/impressoras.html" class="dropdown-item">Manutenção de Impressoras</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a href="pages/enviar-dica.html" class="dropdown-item">Envie sua Dica</a></li>
                        </ul>
                    </li>
                    <li><a href="pages/guia-estagiario.html" class="nav-link">Guia do Estagiário</a></li>
                    <li><a href="pages/professores.html" class="nav-link">Professores</a></li>
                    <li><a href="pages/sobre.html" class="nav-link">Sobre</a></li>
                </ul>
            </nav>
            <div class="header-actions">
                <button class="theme-toggle" id="theme-toggle" aria-label="Alternar tema">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                </button>
            </div>
        </div>
    </div>
</header>

<div class="sidebar-overlay"></div>
<aside class="sidebar">
    <div class="sidebar-header">
        <div class="logo-small">
            <img src="assets/images/logo-ifro.png" alt="IFRO" width="40">
        </div>
        <div class="sidebar-header-text">
            <h2 class="sidebar-title">Menu</h2>
            <p class="sidebar-subtitle">Portal de Estágio &bull; IFRO Ariquemes</p>
        </div>
        <button class="sidebar-close" aria-label="Fechar menu" title="Fechar menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    </div>
    <p class="sidebar-section-label">Navegação</p>
    <nav class="sidebar-nav">
        <ul class="sidebar-menu">
            <li class="sidebar-item">
                <a href="index.html" class="sidebar-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span>Início</span>
                </a>
            </li>
            <li class="sidebar-item">
                <a href="#" class="sidebar-link" id="sidebar-open-game">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="9"></circle>
                        <path d="M12 7v5l3 3"></path>
                    </svg>
                    <span>Entrar no Jogo 🎀</span>
                </a>
            </li>
            <li class="sidebar-item">
                <a href="pages/estagio-info.html" class="sidebar-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <polyline points="16 21 16 7 8 7 8 21"></polyline>
                    </svg>
                    <span>Informações de Estágio</span>
                </a>
            </li>
            <li class="sidebar-item">
                <a href="pages/documentos.html" class="sidebar-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span>Documentos</span>
                </a>
            </li>
            <li class="sidebar-item">
                <a href="pages/dicas/index.html" class="sidebar-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z"></path>
                    </svg>
                    <span>Dicas Técnicas</span>
                </a>
            </li>
            <li class="sidebar-item">
                <ul class="sidebar-submenu">
                    <li><a href="pages/dicas/programacao.html" class="sidebar-sublink">Programação</a></li>
                    <li><a href="pages/dicas/manutencao.html" class="sidebar-sublink">Manutenção de Computadores</a></li>
                    <li><a href="pages/dicas/banco-dados.html" class="sidebar-sublink">Banco de Dados</a></li>
                    <li><a href="pages/dicas/impressoras.html" class="sidebar-sublink">Manutenção de Impressoras</a></li>
                    <li><a href="pages/enviar-dica.html" class="sidebar-sublink">Envie sua Dica</a></li>
                </ul>
            </li>
            <li class="sidebar-item">
                <a href="pages/guia-estagiario.html" class="sidebar-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                    </svg>
                    <span>Guia do Estagiário</span>
                </a>
            </li>
            <li class="sidebar-item">
                <a href="pages/professores.html" class="sidebar-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span>Professores</span>
                </a>
            </li>
            <li class="sidebar-item">
                <a href="pages/sobre.html" class="sidebar-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Sobre</span>
                </a>
            </li>
            <li class="sidebar-item">
                <a href="pages/jogo.html" class="sidebar-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="9"></circle>
                        <path d="M12 7v5l3 3"></path>
                    </svg>
                    <span>Jogar 🎀</span>
                </a>
            </li>
        </ul>
    </nav>
    <div class="sidebar-footer">
        <div class="theme-toggle-sidebar">
            <button class="theme-toggle-btn" id="theme-toggle-sidebar" aria-label="Alternar tema">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
                <span>Tema</span>
            </button>
        </div>
    </div>
</aside>`;

  const footerHTML = `
<footer class="footer">
    <div class="container">
        <div class="footer-content">
            <div class="footer-section">
                <div class="footer-logo">
                    <img src="assets/images/logo-ifro.png" alt="IFRO" width="150">
                </div>
                <p class="footer-description">Portal de Estágio do IFRO Campus Ariquemes<br>Gerido por estudantes de informática para estudantes de informática.</p>
            </div>
            <div class="footer-section">
                <h4 class="footer-title">Links Rápidos</h4>
                <ul class="footer-links">
                    <li><a href="index.html">Início</a></li>
                    <li><a href="pages/estagio-info.html">Informações de Estágio</a></li>
                    <li><a href="pages/documentos.html">Documentos</a></li>
                    <li><a href="pages/dicas/index.html">Dicas Técnicas</a></li>
                    <li><a href="pages/guia-estagiario.html">Guia do Estagiário</a></li>
                    <li><a href="pages/professores.html">Professores</a></li>
                    <li><a href="pages/sobre.html">Sobre</a></li>
                    <li><a href="pages/jogo.html">🎀 Jogar Hello Kitty</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4 class="footer-title">Categorias de Dicas</h4>
                <ul class="footer-links">
                    <li><a href="pages/dicas/programacao.html">Programação</a></li>
                    <li><a href="pages/dicas/manutencao.html">Manutenção de Computadores</a></li>
                    <li><a href="pages/dicas/banco-dados.html">Banco de Dados</a></li>
                    <li><a href="pages/dicas/impressoras.html">Manutenção de Impressoras</a></li>
                    <li><a href="pages/enviar-dica.html">Envie sua Dica</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4 class="footer-title">Contato</h4>
                <ul class="footer-contact">
                    <li>IFRO Campus Ariquemes</li>
                    <li>Telefone: 2103 - 0121</li>
                    <li>Email: caed.ariquemes@ifro.edu.br</li>
                </ul>
            </div>
            <div class="footer-section">
                <h4 class="footer-title">Criadores</h4>
                <ul class="footer-contact">
                    <li>Mariana Deganute Rodrigues</li>
                    <li><a href="mailto:marianadeganute7@gmail.com" class="footer-link">marianadeganute7@gmail.com</a></li>
                    <li style="margin-top: var(--spacing-sm)">Vinicius Gabriel Ferreira de Araújo</li>
                    <li><a href="mailto:g27826909@gmail.com" class="footer-link">g27826909@gmail.com</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 IFRO Campus Ariquemes - Todos os direitos reservados.</p>
        </div>
    </div>
</footer>`;

  const gameHTML = `
    <button class="game-fab" id="game-fab" aria-label="Abrir jogo da Hello Kitty" title="Jogar Hello Kitty">
        <span class="game-fab-label">JOGAR</span>
        <span class="game-fab-emoji" aria-hidden="true">🎀</span>
    </button>

    <div class="modal-overlay" id="game-modal" role="dialog" aria-modal="true" aria-label="Jogo Hello Kitty">
        <div class="modal game-modal">
            <div class="modal-header game-modal-header">
                <h3 class="modal-title">🎀 Pegue os Laços da Hello Kitty</h3>
                <button class="modal-close" id="game-close" aria-label="Fechar jogo" title="Fechar">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body game-modal-body">
                <div class="game-hud">
                    <span class="game-stat">⏱️ <b id="game-time">30</b>s</span>
                    <span class="game-stat">🎯 <b id="game-score">0</b></span>
                    <span class="game-stat">🏆 <b id="game-best">0</b></span>
                    <button class="btn btn-ghost btn-sm game-menu-btn" id="game-menu" type="button" title="Abrir menu do site">☰ Menu</button>
                </div>
                <div class="game-stage" id="game-stage" aria-label="Área do jogo">
                    <div class="game-kitty" id="game-kitty" aria-hidden="true">
                        <svg viewBox="0 0 100 100" width="64" height="64">
                            <circle cx="50" cy="54" r="40" fill="#fff" stroke="#ff9ec4" stroke-width="3"/>
                            <circle cx="20" cy="22" r="12" fill="#ff9ec4"/>
                            <circle cx="80" cy="22" r="12" fill="#ff9ec4"/>
                            <circle cx="36" cy="50" r="4" fill="#3a2e2e"/>
                            <circle cx="64" cy="50" r="4" fill="#3a2e2e"/>
                            <ellipse cx="50" cy="62" rx="4" ry="3" fill="#ff7eb3"/>
                            <path d="M50 64 Q44 72 38 66 M50 64 Q56 72 62 66" stroke="#ff7eb3" stroke-width="2" fill="none"/>
                            <path d="M30 60 Q24 70 18 64 M70 60 Q76 70 82 64" stroke="#ffd1e6" stroke-width="2" fill="none"/>
                        </svg>
                    </div>
                </div>
                <p class="game-tip">Arraste ou toque na Hello Kitty para pegá-la antes que o tempo acabe! 💕</p>
                <div class="game-over" id="game-over" hidden>
                    <p class="game-over-msg" id="game-over-msg"></p>
                    <button class="btn btn-primary" id="game-restart">Jogar de novo</button>
                </div>
            </div>
        </div>
    </div>`;

  function mount() {
    const hr = document.getElementById('header-root');
    const fr = document.getElementById('footer-root');
    if (hr) hr.innerHTML = headerHTML;
    if (fr) fr.innerHTML = footerHTML;

    if (window.initNavigation) window.initNavigation();
    if (window.initThemeToggle) window.initThemeToggle();
    initPWA();
    if (window.initGame) window.initGame();
    if (window.initGamePage) window.initGamePage();
  }

  function initPWA() {
    if (!('serviceWorker' in navigator)) return;

    const head = document.head;
    if (head && !head.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      head.appendChild(link);

      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#003366';
      head.appendChild(meta);
    }

    navigator.serviceWorker.register('/sw.js').catch(function () {});

    let deferredPrompt = null;
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline btn-sm install-btn';
    btn.type = 'button';
    btn.textContent = 'Instalar';
    btn.style.display = 'none';
    btn.setAttribute('aria-label', 'Instalar site no computador');
    btn.addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
        btn.style.display = 'none';
      });
    });

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      btn.style.display = '';
    });

    window.addEventListener('appinstalled', function () {
      deferredPrompt = null;
      btn.style.display = 'none';
    });

    const mountBtn = function () {
      const actions = document.querySelector('.header-actions');
      if (actions && !actions.contains(btn)) actions.appendChild(btn);
    };
    mountBtn();
    const obs = new MutationObserver(mountBtn);
    obs.observe(document.getElementById('header-root'), { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, 5000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.Components = { mount, headerHTML, footerHTML };
})();
