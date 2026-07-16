window.initGamePage = function () {
  if (document.documentElement.dataset.gamePageInit === 'true') return;
  document.documentElement.dataset.gamePageInit = 'true';
  window.initGame({ autoStart: true });
};