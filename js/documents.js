// Trata os botões de download da página de documentos.
// Os arquivos PDF devem ser colocados em assets/docs/ (um por data-document).
// Global: window.initDocuments

window.initDocuments = function () {
  document.querySelectorAll('.download-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const file = btn.getAttribute('data-document');
      if (file) window.open('assets/docs/' + file, '_blank', 'noopener');
    });
  });
};

document.addEventListener('DOMContentLoaded', () => window.initDocuments && window.initDocuments());
