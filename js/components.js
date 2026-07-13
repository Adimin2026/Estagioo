// Componentes compartilhados: injeta header (com sidebar) e footer em todos os
// páginas a partir de um único template. Os links são root-relative; cada página
// define um <base href> apropriado à sua profundidade para resolvê-los.
// Carregado como script clássico (defer). Depende de theme-toggle.js e
// navigation.js (que definem window.initThemeToggle / window.initNavigation).

(function () {
  const headerHTML = `
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
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
                        </ul>
                    </li>
                    <li><a href="pages/chat.html" class="nav-link">Chat IA</a></li>
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
                </ul>
            </li>
            <li class="sidebar-item">
                <a href="pages/chat.html" class="sidebar-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>Chat IA</span>
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
                    <li><a href="pages/chat.html">Chat IA</a></li>
                    <li><a href="pages/sobre.html">Sobre</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4 class="footer-title">Categorias de Dicas</h4>
                <ul class="footer-links">
                    <li><a href="pages/dicas/programacao.html">Programação</a></li>
                    <li><a href="pages/dicas/manutencao.html">Manutenção de Computadores</a></li>
                    <li><a href="pages/dicas/banco-dados.html">Banco de Dados</a></li>
                    <li><a href="pages/dicas/impressoras.html">Manutenção de Impressoras</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4 class="footer-title">Contato</h4>
                <ul class="footer-contact">
                    <li>IFRO Campus Ariquemes</li>
                    <li>Telefone: (69) 3441-1234</li>
                    <li>Email: estagio.ariquemes@ifro.edu.br</li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2025 IFRO Campus Ariquemes - Todos os direitos reservados.</p>
        </div>
    </div>
</footer>`;

  function mount() {
    const hr = document.getElementById('header-root');
    const fr = document.getElementById('footer-root');
    if (hr) hr.innerHTML = headerHTML;
    if (fr) fr.innerHTML = footerHTML;

    if (window.initNavigation) window.initNavigation();
    if (window.initThemeToggle) window.initThemeToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.Components = { mount, headerHTML, footerHTML };
})();
