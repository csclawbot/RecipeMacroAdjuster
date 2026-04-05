window.App = window.App || {};
App.views = App.views || {};

App.views.adjuster = {
  render(container, recipeId) {
    const recipe = App.storage.get(recipeId);

    if (!recipe) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">❓</div>
          <h2>Recipe not found</h2>
          <p>It may have been deleted.</p>
          <a href="#library" class="btn btn-primary">Back to Library</a>
        </div>
      `;
      return;
    }

    container.innerHTML = this._html(recipe);
    this._bindEvents(container, recipe);
  },

  _html(recipe) {
    const { fmt, escapeHtml } = App.utils;
    const m = recipe.macros;
    const id = escapeHtml(recipe.id);

    return `
      <a href="#library" class="btn-back">← Library</a>
      <div class="page-header">
        <div>
          <h2 class="page-title">${escapeHtml(recipe.name)}</h2>
          <p class="page-subtitle">
            ${fmt(recipe.servings, 1)} serving${recipe.servings === 1 ? '' : 's'} &nbsp;&middot;&nbsp;
            ${fmt(m.calories, 0)} kcal &nbsp;&middot;&nbsp;
            ${fmt(m.protein, 1)}g protein &nbsp;&middot;&nbsp;
            ${fmt(m.carbs, 1)}g carbs &nbsp;&middot;&nbsp;
            ${fmt(m.fat, 1)}g fat
          </p>
        </div>
        <a href="#edit/${id}" class="btn btn-secondary btn-sm">Edit Recipe</a>
      </div>

      <div class="adjuster-layout">

        <!-- Adjustment card -->
        <div class="card">
          <div class="card-title"><div class="icon icon-blue">🎯</div>Adjustment Target</div>

          <div class="mode-tabs">
            <input type="radio" name="adj-mode" id="mode-servings" value="servings" checked />
            <label for="mode-servings"><span class="tab-icon">🍽️</span>By Servings</label>

            <input type="radio" name="adj-mode" id="mode-calories" value="calories" />
            <label for="mode-calories"><span class="tab-icon">🔥</span>By Calories</label>

            <input type="radio" name="adj-mode" id="mode-protein" value="protein" />
            <label for="mode-protein"><span class="tab-icon">💪</span>By Protein</label>

            <input type="radio" name="adj-mode" id="mode-budget" value="budget" />
            <label for="mode-budget"><span class="tab-icon">📅</span>Daily Budget</label>
          </div>

          <div id="panel-servings" class="mode-panel active">
            <div class="target-hint">Scale the recipe to produce a specific number of servings. Ingredient amounts adjust proportionally.</div>
            <div class="field">
              <label for="target-servings">Target Servings</label>
              <input type="number" id="target-servings" placeholder="e.g. 4" min="0.01" step="0.5" value="4" />
            </div>
          </div>

          <div id="panel-calories" class="mode-panel">
            <div class="target-hint">Scale so each serving hits your calorie goal. Serving count updates to match the new total yield.</div>
            <div class="field">
              <label for="target-cal">Target Calories Per Serving (kcal)</label>
              <input type="number" id="target-cal" placeholder="e.g. 500" min="1" step="1" />
            </div>
          </div>

          <div id="panel-protein" class="mode-panel">
            <div class="target-hint">Scale to match a specific protein target per serving. Useful for hitting daily protein goals.</div>
            <div class="field">
              <label for="target-prot">Target Protein Per Serving (g)</label>
              <input type="number" id="target-prot" placeholder="e.g. 40" min="0.1" step="0.1" />
            </div>
          </div>

          <div id="panel-budget" class="mode-panel">
            <div class="target-hint">Fit the entire recipe yield into a total calorie budget. Great for meal prepping a full day.</div>
            <div class="field">
              <label for="target-budget">Total Calorie Budget (kcal)</label>
              <input type="number" id="target-budget" placeholder="e.g. 2000" min="1" step="10" />
            </div>
          </div>

          <div id="adj-error" class="error-box"></div>
          <button class="btn-calc" id="btn-calculate">Calculate →</button>
        </div>

        <!-- Results card -->
        <div class="card results-card" id="results-card">
          <div class="results-placeholder">
            <div class="ph-icon">🧮</div>
            <p>Set your target and click <strong>Calculate</strong> to see the adjusted recipe.</p>
          </div>
        </div>

      </div>
    `;
  },

  _bindEvents(container, recipe) {
    container.querySelectorAll('input[name="adj-mode"]').forEach(radio => {
      radio.addEventListener('change', () => {
        container.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
        container.querySelector('#panel-' + radio.value).classList.add('active');
      });
    });

    container.querySelector('#btn-calculate').addEventListener('click', () => {
      this._calculate(container, recipe);
    });
  },

  _calculate(container, recipe) {
    const errorBox = container.querySelector('#adj-error');
    errorBox.classList.remove('visible');

    const mode = container.querySelector('input[name="adj-mode"]:checked').value;
    const valueMap = {
      servings: container.querySelector('#target-servings')?.value,
      calories: container.querySelector('#target-cal')?.value,
      protein:  container.querySelector('#target-prot')?.value,
      budget:   container.querySelector('#target-budget')?.value,
    };
    const targetValue = parseFloat(valueMap[mode]) || 0;

    const errors = this._validate(mode, targetValue, recipe);
    if (errors.length) {
      errorBox.innerHTML = errors.length === 1
        ? errors[0]
        : '<ul>' + errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
      errorBox.classList.add('visible');
      return;
    }

    const sf      = this._scaleFactor(mode, targetValue, recipe);
    const results = this._compute(recipe, sf);
    this._renderResults(container, results);
  },

  _validate(mode, value, recipe) {
    const errors = [];
    if (recipe.servings <= 0)
      errors.push('Recipe servings must be greater than 0.');
    if (value <= 0)
      errors.push('Target value must be greater than 0.');
    if (mode === 'calories' && recipe.macros.calories <= 0)
      errors.push('Recipe must have calories > 0 to scale by calories.');
    if (mode === 'protein' && recipe.macros.protein <= 0)
      errors.push('Recipe must have protein > 0 to scale by protein.');
    if (mode === 'budget' && recipe.macros.calories <= 0)
      errors.push('Recipe must have calories > 0 to use the daily budget mode.');
    return errors;
  },

  _scaleFactor(mode, value, recipe) {
    switch (mode) {
      case 'servings': return value / recipe.servings;
      case 'calories': return value / recipe.macros.calories;
      case 'protein':  return value / recipe.macros.protein;
      case 'budget':   return value / (recipe.macros.calories * recipe.servings);
    }
  },

  _compute(recipe, sf) {
    const newServings = recipe.servings * sf;
    return {
      scaleFactor: sf,
      newServings,
      macrosPerServing: { ...recipe.macros },
      totalMacros: {
        calories: recipe.macros.calories * newServings,
        protein:  recipe.macros.protein  * newServings,
        carbs:    recipe.macros.carbs    * newServings,
        fat:      recipe.macros.fat      * newServings,
      },
      scaledIngredients: recipe.ingredients.map(ing => ({
        ...ing,
        scaledAmount: ing.amount * sf,
      })),
    };
  },

  _renderResults(container, r) {
    const { fmt, escapeHtml } = App.utils;
    const card = container.querySelector('#results-card');
    const servingWord = Math.abs(r.newServings - 1) < 0.05 ? 'serving' : 'servings';
    const visible = r.scaledIngredients.filter(i => i.name || i.amount > 0);

    card.innerHTML = `
      <div class="card-title"><div class="icon icon-green">✅</div>Results</div>

      <div class="scale-info">
        <div class="scale-badge">×${fmt(r.scaleFactor, 2)}</div>
        <span class="scale-serving"><strong>${fmt(r.newServings, 1)}</strong> ${servingWord} total</span>
      </div>

      <div class="results-section-label">Macros Per Serving</div>
      ${this._macroCardsHTML(r.macrosPerServing)}

      <div class="divider"></div>

      <div class="results-section-label">Total Recipe Macros</div>
      ${this._macroCardsHTML(r.totalMacros)}

      <div class="divider"></div>

      <div class="results-section-label">Scaled Ingredients</div>
      <div class="ingredient-result-list">
        ${visible.length === 0
          ? '<div class="empty-ingredients">No ingredients on this recipe.</div>'
          : visible.map((ing, i) => `
              <div class="ingredient-result" style="animation-delay:${i * 40}ms">
                <span class="ing-name">${escapeHtml(ing.name) || '<em style="color:var(--text-light)">Unnamed</em>'}</span>
                <div>
                  <span class="ing-amount">${fmt(ing.scaledAmount, 1)} ${escapeHtml(ing.unit)}</span>
                  ${ing.amount > 0 ? `<span class="ing-original">(orig: ${fmt(ing.amount, 1)})</span>` : ''}
                </div>
              </div>
            `).join('')
        }
      </div>
    `;

    card.classList.remove('has-results');
    void card.offsetWidth; // force reflow for animation
    card.classList.add('has-results');
  },

  _macroCardsHTML(macros) {
    const { fmt } = App.utils;
    return `
      <div class="macro-cards">
        <div class="macro-card"><span class="mc-value">${fmt(macros.calories, 0)}</span><span class="mc-label">kcal</span></div>
        <div class="macro-card"><span class="mc-value">${fmt(macros.protein, 1)}g</span><span class="mc-label">protein</span></div>
        <div class="macro-card"><span class="mc-value">${fmt(macros.carbs, 1)}g</span><span class="mc-label">carbs</span></div>
        <div class="macro-card"><span class="mc-value">${fmt(macros.fat, 1)}g</span><span class="mc-label">fat</span></div>
      </div>
    `;
  },
};
