window.App = window.App || {};
App.views = App.views || {};

App.views.library = {
  render(container) {
    const recipes = App.storage.getAll();
    container.innerHTML = recipes.length === 0 ? this._emptyState() : this._grid(recipes);
    this._bindEvents(container);
  },

  _grid(recipes) {
    return `
      <div class="page-header">
        <div>
          <h2 class="page-title">My Recipes</h2>
          <p class="page-subtitle">${recipes.length} recipe${recipes.length !== 1 ? 's' : ''} saved</p>
        </div>
      </div>
      <div class="recipe-grid">
        ${recipes.map(r => this._card(r)).join('')}
      </div>
    `;
  },

  _card(r) {
    const { fmt, escapeHtml } = App.utils;
    const updated = r.updatedAt
      ? new Date(r.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';
    const servingLabel = `${fmt(r.servings, 1)} serving${r.servings === 1 ? '' : 's'}`;
    const id = escapeHtml(r.id);

    return `
      <div class="recipe-card" data-id="${id}">
        <div class="recipe-card-body">
          <div class="recipe-card-meta">${updated}</div>
          <h3 class="recipe-card-name">${escapeHtml(r.name)}</h3>
          <p class="recipe-card-servings">${servingLabel} &middot; per serving</p>
          <div class="recipe-card-macros">
            <div class="macro-pill macro-pill-cal">
              <span class="mp-val">${fmt(r.macros.calories, 0)}</span>
              <span class="mp-lbl">kcal</span>
            </div>
            <div class="macro-pill macro-pill-prot">
              <span class="mp-val">${fmt(r.macros.protein, 1)}g</span>
              <span class="mp-lbl">pro</span>
            </div>
            <div class="macro-pill macro-pill-carb">
              <span class="mp-val">${fmt(r.macros.carbs, 1)}g</span>
              <span class="mp-lbl">carb</span>
            </div>
            <div class="macro-pill macro-pill-fat">
              <span class="mp-val">${fmt(r.macros.fat, 1)}g</span>
              <span class="mp-lbl">fat</span>
            </div>
          </div>
        </div>
        <div class="recipe-card-footer">
          <a href="#adjust/${id}" class="btn btn-primary btn-sm">Adjust</a>
          <a href="#edit/${id}"   class="btn btn-secondary btn-sm">Edit</a>
          <button class="btn btn-danger btn-sm btn-delete" data-id="${id}">Delete</button>
        </div>
      </div>
    `;
  },

  _emptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">🥗</div>
        <h2>No recipes yet</h2>
        <p>Add your first recipe to get started.</p>
        <a href="#new" class="btn btn-primary">+ New Recipe</a>
      </div>
    `;
  },

  _bindEvents(container) {
    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const recipe = App.storage.get(btn.dataset.id);
        if (!recipe) return;
        if (!confirm(`Delete "${recipe.name}"? This cannot be undone.`)) return;
        App.storage.remove(btn.dataset.id);
        this.render(container);
      });
    });
  },
};
