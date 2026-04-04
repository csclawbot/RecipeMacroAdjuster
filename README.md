# Recipe Macro Adjuster

A single-file web app for scaling recipes to meet specific nutrition targets. Built with vanilla HTML, CSS, and JavaScript — no build tools, no dependencies, no server required.

---

## Purpose

Cooking to hit exact macros is tedious. This tool lets you input any recipe, set a nutrition target, and instantly see how to adjust ingredient quantities to reach your goal — whether that's a specific number of servings, a target calorie count, a protein goal, or a full daily calorie budget.

---

## Features

- **4 adjustment modes:**
  - **By Servings** — scale the recipe to produce N servings
  - **By Calories per Serving** — scale so each serving hits a calorie target
  - **By Protein per Serving** — scale to meet a per-serving protein goal
  - **Daily Calorie Budget** — scale the full recipe to fit a total calorie limit

- **Dynamic ingredient list** — add/remove ingredients with name, amount, and unit
- **Per-serving and total macro tracking** — calories, protein, carbs, and fat
- **Scale factor display** — shows exactly how much the recipe was scaled (e.g. ×2.4)
- **Original vs. scaled amounts** — see both values side by side in the results
- **Inline validation** — clear error messages for invalid or missing inputs
- **Responsive design** — works on desktop, tablet, and mobile
- **Pre-loaded example** — opens with a sample recipe so you can try it immediately

---

## Getting Started

### Prerequisites

- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No Node.js, Python, or any runtime required

### Running Locally

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd <repo-folder>
   ```

2. Open the app:
   ```bash
   # macOS / Linux
   open recipe-macro-adjuster.html

   # Windows
   start recipe-macro-adjuster.html
   ```

   Or simply double-click `recipe-macro-adjuster.html` in your file explorer.

That's it. The app runs entirely in the browser.

> **Note:** The app loads the Inter font from Google Fonts. An internet connection is needed for the font to render correctly, but the app is fully functional offline with a system fallback font.

---

## Project Structure

```
.
├── recipe-macro-adjuster.html   # Entire app — HTML, CSS, and JS in one file
└── README.md
```

Everything lives in `recipe-macro-adjuster.html`. The file is organized into three clearly commented sections:

| Section | Location | Contents |
|---|---|---|
| `<head>` | Top | Meta tags, Google Fonts link |
| `<style>` | Inside `<head>` | All CSS, including custom properties and animations |
| `<body>` | Middle | HTML structure — header, left column (inputs), right column (adjustment + results) |
| `<script>` | Bottom of `<body>` | All JavaScript logic |

---

## Architecture Overview

### CSS

Theming is driven entirely by CSS custom properties defined in `:root`. To change the color scheme, update the variables at the top of the `<style>` block — everything else inherits from them.

```css
:root {
  --primary: #6366f1;   /* indigo — buttons, focus rings, badges */
  --accent:  #10b981;   /* emerald — protein macro color */
  --orange:  #f97316;   /* calories macro color */
  --blue:    #3b82f6;   /* carbs macro color */
  --purple:  #a855f7;   /* fat macro color */
  /* ... */
}
```

### JavaScript

The JS is organized into small, single-purpose functions. The core calculation flow is:

```
calculate()
  → readRecipe()          reads form values into a plain object
  → readAdjustment()      reads the selected mode and target value
  → validate()            returns an array of error strings (empty = valid)
  → calcScaleFactor()     derives the scale factor from the mode and inputs
  → computeResults()      applies the scale factor to ingredients and macros
  → renderResults()       writes the output to the DOM
```

### Scale Factor Logic

All four modes reduce to a single scale factor that is applied uniformly to every ingredient amount and the total serving count:

| Mode | Formula |
|---|---|
| By Servings | `target_servings / original_servings` |
| By Calories | `target_cal_per_serving / original_cal_per_serving` |
| By Protein | `target_protein_per_serving / original_protein_per_serving` |
| Daily Budget | `total_calorie_budget / (cal_per_serving × original_servings)` |

Macros per serving remain unchanged in all modes — the scale factor scales the total yield and serving count together proportionally.

---

## Making Changes

### Adding a new adjustment mode

1. Add a radio input + label to the `.mode-tabs` div in the HTML.
2. Add a corresponding `.mode-panel` div with the new input(s).
3. Add a case to `calcScaleFactor()` in the `<script>` block.
4. Add any needed validation rules to `validate()`.

### Changing colors

Edit the CSS custom properties in `:root`. The four macro colors (`--orange`, `--accent`, `--blue`, `--purple`) also need their matching `-light` variants updated for the card backgrounds.

### Adding persistence (save/load recipes)

The `readRecipe()` function already returns a plain JS object — it can be serialized directly to `localStorage` or exported as JSON. A save/load feature would involve:
- A "Save" button that calls `JSON.stringify(readRecipe())` and writes to `localStorage`
- A "Load" button that reads from `localStorage` and populates the form fields

---

## Browser Support

Targets all evergreen browsers. No polyfills are used. The only non-baseline feature is CSS Grid, which has had full cross-browser support since 2017.

---

## Contributing

1. Fork the repo and create a feature branch.
2. Make changes to `recipe-macro-adjuster.html`.
3. Test in at least Chrome and Firefox before opening a PR.
4. Keep the single-file constraint — avoid introducing a build step or external JS dependencies unless there is a strong reason to do so.
