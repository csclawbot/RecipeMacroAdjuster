window.App = window.App || {};
App.views = App.views || {};

App.views.editor = {
  _rowId: 0,

  render(container, recipeId) {
    const recipe = recipeId ? App.storage.get(recipeId) : null;

    if (recipeId && !recipe) {
      // Recipe was deleted or id is stale — go back to library
      window.location.replace('#library');
      return;
    }

    const isNew = !recipe;
    container.innerHTML = this._html(recipe, isNew);
    this._bindEvents(container, recipe);
  },

  _html(recipe, isNew) {
    const { escapeAttr } = App.utils;
    const name     = recipe ? escapeAttr(recipe.name) : '';
    const servings = recipe ? recipe.servings : 1;
    const m        = recipe ? recipe.macros : { calories: '', protein: '', carbs: '', fat: '' };

    return `
      <a href="#library" class="btn-back">← Library</a>
      <div class="page-header">
        <h2 class="page-title">${isNew ? 'New Recipe' : 'Edit Recipe'}</h2>
      </div>
      <div class="editor-layout">

        <div class="card">
          <div class="card-title"><div class="icon icon-purple">📋</div>Recipe Details</div>
          <div class="two-col">
            <div class="field">
              <label for="ed-name">Recipe Name</label>
              <input type="text" id="ed-name" placeholder="e.g. Overnight Oats" value="${name}" />
            </div>
            <div class="field">
              <label for="ed-servings">Servings</label>
              <input type="number" id="ed-servings" placeholder="1" min="0.01" step="0.5" value="${servings}" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title"><div class="icon icon-green">🧂</div>Ingredients</div>
          <div class="ingredient-header">
            <span>Ingredient</span><span>Amount</span><span>Unit</span><span></span>
          </div>
          <div id="ed-ingredient-list"></div>
          <button class="btn-add" id="ed-add-ing">+ Add Ingredient</button>
        </div>

        <div class="card">
          <div class="card-title"><div class="icon icon-orange">📊</div>Macros Per Serving</div>
          <div class="macro-grid">
            <div class="macro-field cal-field">
              <div class="macro-label">Calories (kcal)</div>
              <input type="number" id="ed-cal"  placeholder="0" min="0" step="1"   value="${m.calories}" />
            </div>
            <div class="macro-field prot-field">
              <div class="macro-label">Protein (g)</div>
              <input type="number" id="ed-prot" placeholder="0" min="0" step="0.1" value="${m.protein}" />
            </div>
            <div class="macro-field carb-field">
              <div class="macro-label">Carbs (g)</div>
              <input type="number" id="ed-carb" placeholder="0" min="0" step="0.1" value="${m.carbs}" />
            </div>
            <div class="macro-field fat-field">
              <div class="macro-label">Fat (g)</div>
              <input type="number" id="ed-fat"  placeholder="0" min="0" step="0.1" value="${m.fat}" />
            </div>
          </div>
        </div>

        <div id="ed-error" class="error-box"></div>

        <div class="editor-actions">
          <a href="#library" class="btn btn-secondary">Cancel</a>
          <button class="btn btn-primary" id="ed-save">
            ${isNew ? 'Save Recipe' : 'Save Changes'}
          </button>
        </div>

      </div>
    `;
  },

  _bindEvents(container, recipe) {
    const list = container.querySelector('#ed-ingredient-list');
    const ingredients = recipe && recipe.ingredients.length
      ? recipe.ingredients
      : [{ name: '', amount: '', unit: '' }, { name: '', amount: '', unit: '' }, { name: '', amount: '', unit: '' }];

    ingredients.forEach(ing => this._addRow(list, ing.name, ing.amount, ing.unit));

    container.querySelector('#ed-add-ing').addEventListener('click', () => {
      this._addRow(list, '', '', '');
    });

    container.querySelector('#ed-save').addEventListener('click', () => {
      this._save(container, recipe);
    });
  },

  _addRow(list, name = '', amount = '', unit = '') {
    const { escapeAttr } = App.utils;
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.style.animation = 'fadeInUp 0.2s ease';
    row.innerHTML = `
      <input type="text"   placeholder="Ingredient name" value="${escapeAttr(name)}" />
      <input type="number" placeholder="0" min="0" step="0.01" value="${escapeAttr(amount)}" />
      <input type="text"   placeholder="g / ml / oz…" value="${escapeAttr(unit)}" />
      <button class="btn-remove" title="Remove">×</button>
    `;
    row.querySelector('.btn-remove').addEventListener('click', () => {
      if (list.children.length > 1) row.remove();
    });
    list.appendChild(row);
  },

  _getIngredients(container) {
    return Array.from(container.querySelectorAll('#ed-ingredient-list .ingredient-row')).map(row => {
      const inputs = row.querySelectorAll('input');
      return {
        id:     App.utils.uuid(),
        name:   inputs[0].value.trim(),
        amount: parseFloat(inputs[1].value) || 0,
        unit:   inputs[2].value.trim(),
      };
    });
  },

  _save(container, existingRecipe) {
    const errorBox = container.querySelector('#ed-error');
    const name     = container.querySelector('#ed-name').value.trim();
    const servings = parseFloat(container.querySelector('#ed-servings').value) || 0;
    const macros   = {
      calories: parseFloat(container.querySelector('#ed-cal').value)  || 0,
      protein:  parseFloat(container.querySelector('#ed-prot').value) || 0,
      carbs:    parseFloat(container.querySelector('#ed-carb').value) || 0,
      fat:      parseFloat(container.querySelector('#ed-fat').value)  || 0,
    };

    const errors = [];
    if (!name)        errors.push('Recipe name is required.');
    if (servings <= 0) errors.push('Servings must be greater than 0.');

    if (errors.length) {
      errorBox.innerHTML = errors.length === 1
        ? errors[0]
        : '<ul>' + errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
      errorBox.classList.add('visible');
      return;
    }

    errorBox.classList.remove('visible');

    App.storage.save({
      id:          existingRecipe ? existingRecipe.id : App.utils.uuid(),
      name,
      servings,
      ingredients: this._getIngredients(container),
      macros,
    });

    App.showToast(existingRecipe ? 'Recipe updated!' : 'Recipe saved!');
    window.location.hash = '#library';
  },
};
