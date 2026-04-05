window.App = window.App || {};

App.utils = {
  uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  },

  fmt(n, decimals = 1) {
    if (!isFinite(n) || isNaN(n)) return '—';
    const m = 10 ** decimals;
    const r = Math.round(n * m) / m;
    return r % 1 === 0 ? r.toString() : r.toFixed(decimals);
  },

  fmtMacro(n, decimals = 1) {
    const s = this.fmt(n, decimals);
    return s === '—' ? '—' : s + (decimals > 0 ? 'g' : '');
  },

  escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },
};
