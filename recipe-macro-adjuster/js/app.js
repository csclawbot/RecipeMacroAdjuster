window.App = window.App || {};

// ── Toast ──────────────────────────────────────────────────────────────────
App.showToast = function(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 2200);
};

// ── Router ─────────────────────────────────────────────────────────────────
(function() {
  const main = document.getElementById('app-main');

  function route() {
    const hash  = location.hash || '';
    const parts = hash.replace(/^#\/?/, '').split('/');
    const view  = parts[0] || 'library';
    const param = parts[1];

    main.innerHTML = '';

    switch (view) {
      case 'library':
        App.views.library.render(main);
        break;
      case 'new':
        App.views.editor.render(main, null);
        break;
      case 'edit':
        if (!param) { window.location.replace('#library'); return; }
        App.views.editor.render(main, param);
        break;
      case 'adjust':
        if (!param) { window.location.replace('#library'); return; }
        App.views.adjuster.render(main, param);
        break;
      default:
        window.location.replace('#library');
        return;
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  document.addEventListener('DOMContentLoaded', () => {
    App.storage.seedIfEmpty();
    route();
  });

  window.addEventListener('hashchange', route);
})();
