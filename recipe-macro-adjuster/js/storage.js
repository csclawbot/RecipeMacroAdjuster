window.App = window.App || {};

App.storage = (() => {
  const KEY = 'rma_v1_recipes';

  const SEED_RECIPE = {
    name: 'High-Protein Overnight Oats',
    servings: 1,
    ingredients: [
      { name: 'Rolled oats',    amount: 80,  unit: 'g'  },
      { name: 'Protein powder', amount: 31,  unit: 'g'  },
      { name: 'Almond milk',    amount: 200, unit: 'ml' },
      { name: 'Banana',         amount: 60,  unit: 'g'  },
    ],
    macros: { calories: 420, protein: 35, carbs: 52, fat: 8 },
  };

  function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function get(id) {
    return getAll().find(r => r.id === id) || null;
  }

  // Creates or updates a recipe. Pass a recipe object; id determines create vs update.
  function save(recipe) {
    const all = getAll();
    const now = new Date().toISOString();
    const idx = all.findIndex(r => r.id === recipe.id);

    if (idx >= 0) {
      all[idx] = { ...all[idx], ...recipe, updatedAt: now };
    } else {
      all.unshift({ ...recipe, createdAt: now, updatedAt: now });
    }

    localStorage.setItem(KEY, JSON.stringify(all));
    return recipe;
  }

  function remove(id) {
    const filtered = getAll().filter(r => r.id !== id);
    localStorage.setItem(KEY, JSON.stringify(filtered));
  }

  function seedIfEmpty() {
    if (getAll().length === 0) {
      const id = App.utils.uuid();
      const ingredients = SEED_RECIPE.ingredients.map(ing => ({
        id: App.utils.uuid(),
        ...ing,
      }));
      save({ id, ...SEED_RECIPE, ingredients });
    }
  }

  return { getAll, get, save, remove, seedIfEmpty };
})();
