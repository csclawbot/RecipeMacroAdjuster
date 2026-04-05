# Recipe Macro Adjuster

A multi-view web app for saving recipes and scaling them to meet specific nutrition targets. Recipes persist across sessions via `localStorage`. No build step, no backend, no dependencies — just open `index.html` in a browser.

---

## Purpose

Cooking to hit exact macros is tedious. This tool lets you build a library of saved recipes, then instantly scale any of them to reach a nutrition target — whether that's a specific number of servings, a per-serving calorie or protein goal, or a total daily calorie budget.

---

## Features

- **Recipe Library** — browse, search, edit, and delete saved recipes with macro summaries at a glance
- **Recipe Editor** — create and edit recipes with a dynamic ingredient list and per-serving macro fields
- **4 adjustment modes:**
  - **By Servings** — scale to produce N servings
  - **By Calories per Serving** — scale so each serving hits a calorie target
  - **By Protein per Serving** — scale to meet a per-serving protein goal
  - **Daily Calorie Budget** — scale the full recipe to fit a total calorie limit
- **Persistent storage** — recipes are saved to `localStorage` and survive page refresh
- **Scale factor display** — shows exactly how much the recipe was scaled (e.g. ×2.4)
- **Original vs. scaled amounts** — both shown side by side in results
- **Seed recipe** — a sample recipe loads on first launch so the app is immediately usable
- **Responsive design** — works on desktop, tablet, and mobile

---

## Getting Started

### Prerequisites

- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No Node.js, Python, or any runtime required

### Running Locally

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd recipe-macro-adjuster
   ```

2. Open the app:
   ```bash
   # macOS / Linux
   open index.html

   # Windows
   start index.html
   ```

   Or double-click `index.html` in your file explorer.

> **Note:** The app loads Inter from Google Fonts. An internet connection is required for the font; the app is fully functional offline with a system fallback font.

---

## Project Structure

```
recipe-macro-adjuster/
├── index.html              # App shell: nav, main container, script loading order
├── css/
│   └── styles.css          # All styles — custom properties, layout, components
├── js/
│   ├── utils.js            # Shared helpers (uuid, fmt, escapeHtml, escapeAttr)
│   ├── storage.js          # localStorage CRUD + first-run seed recipe
│   ├── app.js              # Hash router, toast notifications, DOMContentLoaded init
│   └── views/
│       ├── library.js      # Recipe card grid — browse, adjust, edit, delete
│       ├── editor.js       # Create/edit recipe form
│       └── adjuster.js     # 4-mode adjustment tool, reads recipe from storage by id
└── README.md
```

### Script Loading Order

Scripts are loaded with plain `<script>` tags in `index.html`. The order is strict and must be maintained:

```
utils.js → storage.js → views/library.js → views/editor.js → views/adjuster.js → app.js
```

`app.js` must load last because it calls `App.views.*` and `App.storage.*` on `DOMContentLoaded`.

---

## Architecture

### Global Namespace

All modules extend `window.App` to share state without ES modules (which would require a local server):

```
App.utils     — uuid, fmt, fmtMacro, escapeHtml, escapeAttr
App.storage   — getAll, get, save, remove, seedIfEmpty
App.views     — { library, editor, adjuster } (each has a render() method)
App.showToast — displays a transient success notification
```

### Hash-Based Routing

`app.js` listens to `hashchange` and dispatches to the appropriate view:

| Hash | View |
|---|---|
| `#library` | Recipe library grid |
| `#new` | Editor (create mode) |
| `#edit/{id}` | Editor (edit mode, pre-populated) |
| `#adjust/{id}` | Adjuster (loaded from storage by id) |

Unknown or empty hashes redirect to `#library` via `location.replace` (no history pollution).

### View Pattern

Each view exports a single `render(container, ...args)` function that:
1. Receives the `<main>` element as `container`
2. Sets `container.innerHTML` with its template
3. Binds all event listeners inside the rendered HTML

Views are stateless between navigations — all state lives in `localStorage`.

### Data Model

```javascript
// Stored in localStorage as JSON array under key "rma_v1_recipes"
{
  id:          "uuid-string",
  name:        "High-Protein Overnight Oats",
  servings:    1,
  ingredients: [
    { id: "uuid", name: "Rolled oats", amount: 80, unit: "g" }
  ],
  macros: {
    calories: 420,
    protein:  35,
    carbs:    52,
    fat:      8
  },
  createdAt:   "2026-04-03T00:00:00.000Z",
  updatedAt:   "2026-04-03T00:00:00.000Z"
}
```

Macros are always stored **per serving**. The adjuster multiplies them by `newServings` to get totals.

### Scale Factor Logic

All four modes derive a single scale factor applied uniformly to every ingredient and the total serving count:

| Mode | Formula |
|---|---|
| By Servings | `target_servings / recipe.servings` |
| By Calories | `target_cal / recipe.macros.calories` |
| By Protein | `target_protein / recipe.macros.protein` |
| Daily Budget | `budget / (recipe.macros.calories × recipe.servings)` |

Macros per serving are unchanged in all modes — scale factor scales total yield and serving count together.

---

## Making Changes

### Adding a new adjustment mode

1. Add a radio input + label in `adjuster.js → _html()` inside `.mode-tabs`
2. Add a `.mode-panel` div with the new input
3. Add a case to `adjuster.js → _scaleFactor()`
4. Add validation rules to `adjuster.js → _validate()`

### Changing the color scheme

Edit the CSS custom properties in `:root` inside `css/styles.css`. Each macro has a color and a matching `-light` variant used for card backgrounds — update both.

### Adding a new field to recipes

1. Add the field to the Editor form in `editor.js → _html()`
2. Read it in `editor.js → _save()`
3. Include it in the data object passed to `App.storage.save()`
4. Update the Library card template in `library.js → _card()` if it should display there

### Migrating localStorage data

The storage key is `rma_v1_recipes`. If you change the data shape in a breaking way, increment the version (`rma_v2_recipes`) and write a one-time migration in `storage.js → seedIfEmpty()` or a new `migrate()` function called from `app.js`.

### Adding backend persistence

`App.storage` is the only place that reads and writes data. Swap the `localStorage` calls for `fetch()` calls to a REST API and the rest of the app is unaffected.

---

## Browser Support

Targets all evergreen browsers (Chrome, Firefox, Safari, Edge). Uses CSS Grid, CSS custom properties, and `crypto.randomUUID` (with a fallback). No polyfills required.

---

## Contributing

1. Fork the repo and create a feature branch.
2. Edit the relevant files in `js/views/`, `js/`, or `css/`.
3. Test in at least Chrome and Firefox before opening a PR.
4. Keep the no-build-step constraint — avoid introducing npm packages or ES module imports unless there is a strong reason to do so.
