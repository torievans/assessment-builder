# Tool Architecture

## Overview

The assessment builder is a single-page HTML app (`index.html`) that hosts multiple visual maths tools. Each tool lives in its own subfolder under `tools/` and can run either inside the builder or as a standalone page.

```
assessment-builder/
├── index.html              ← main builder app
├── tools/
│   ├── shared.js           ← renderers + utilities shared by all tools
│   ├── style.css           ← shared form/UI styles for standalone pages
│   ├── nl/
│   │   ├── nl.js           ← Number Line tool
│   │   └── index.html      ← standalone Number Line page
│   ├── bm/                 ← Bar Model
│   ├── nt/                 ← Number Track
│   ├── nr/                 ← Number Representations
│   └── pv/                 ← Place Value Representations
└── docs/
    ├── design-guide.html
    └── tool-architecture.md
```

---

## Script load order

The builder loads scripts in this order — order matters because each tool JS depends on globals from `shared.js`:

```html
<script src="tools/shared.js"></script>
<script src="tools/nl/nl.js"></script>
<script src="tools/bm/bm.js"></script>
<script src="tools/nt/nt.js"></script>
<script src="tools/nr/nr.js"></script>
<script src="tools/pv/pv.js"></script>
```

All functions are globals (no ES modules). This is intentional — it keeps the standalone tool pages simple (`<script src="../shared.js">` + `<script src="nl.js">`) without needing a bundler.

---

## The `xxxPanelHTML()` pattern

Each tool JS file exposes one function that returns the inner HTML of its form panel as a template literal string:

```
nlPanelHTML()   bmPanelHTML()   ntPanelHTML()   nrPanelHTML()   pvPanelHTML()
```

The builder calls these at `DOMContentLoaded` to inject panel content into placeholder `<div class="form-card">` elements in `index.html`:

```js
document.querySelector('#tool-panel-nl .form-card').innerHTML = nlPanelHTML();
document.querySelector('#tool-panel-bm .form-card').innerHTML = bmPanelHTML();
// … etc
```

This means tool panels are defined once (in the tool JS file) and work identically in both the builder and the standalone page. Changes to a tool's UI only need to happen in one place.

After injection, init functions wire up event listeners and swatch pickers:

```js
initNLPanel();   // Number Line — builds colour swatches, attaches input listeners
initBMPanel();   // Bar Model
initNRPanel();   // Number Representations — builds colour swatches
// NT and PV have no init function — they call autoPreviewXX() directly
```

---

## Tool JS file structure

Each tool JS file follows this pattern:

| Section | Purpose |
|---|---|
| State variables (`let`) | Current UI state — selected colour, toggle state, etc. |
| `xxxPanelHTML()` | Returns full form-card HTML as a string |
| `initXXXPanel()` | Wires up swatches and listeners (if needed) |
| `autoPreviewXX()` | Reads current state → calls renderer → updates preview DOM |
| `getXXXConfig()` | Reads form fields → returns a plain config object |
| `restoreXXXConfig(cfg)` | Applies a saved config object back to the form (used in edit mode) |
| Batch helpers | Row-level preview and config functions for the batch panel |

---

## shared.js — what it exports

`shared.js` provides everything that is used by more than one tool or by the builder directly.

**Constants**
- `SHARED_FONT` — font stack string used by all SVG renderers
- `NL_PALETTE`, `NL_LABEL_COLOR`, `NL_DEFAULT_LINE_COLOR`, `NL_ARROW_SIZE` — Number Line design tokens
- `NL_JUMP_PALETTE_NAMES` — ordered colour name list for jump swatches
- `BM_BOX_COLORS`, `BM_BAR_LIGHT_FILLS`, `BM_BOX_TEXT_COLORS`, `BM_STROKES` — Bar Model palette
- `NR_STROKES`, `NR_NUMICON_COLOURS` — Number Representations palette

**SVG renderers** (return an SVG string)
- `numberLineSVG(cfg)` — Number Line
- `barModelSVG(cfg)` — Bar Model
- `numberTrackSVG(cfg)` — Number Track
- `nrRenderFromCfg(cfg)` — Number Representations (dispatches to frames/beads/multilink/numicon)
- `nrRenderFrames(cfg)`, `nrRenderBeads(cfg)`, `nrRenderMultilink(cfg)`, `nrRenderNumicon(cfg)` — individual NR sub-renderers

**Utilities**
- `resolveNLColour(name)` — maps a palette name to a hex value
- `nrDarkenHex(hex, factor)` — darkens a hex colour for outlines
- `svgToPng(svgStr)` — converts an SVG string to a PNG Blob via canvas; **returns a Promise**

---

## PNG export paths

SVG-based tools (NL, BM, NT, NR) and the canvas-based PV tool have different export APIs:

```js
// SVG tools — returns Promise<Blob>
const blob = await svgToPng(svgStr);

// PV — returns Promise<Blob>, scale hardcoded at 3× inside
const blob = await pvGetPngBlob(cfg);

// PV — returns a data URL (for rendering <img> inline), no Promise
const dataURL = pvGetDataURL(cfg, scale);   // scale defaults to 2
```

The builder's QTI export uses both paths:

```js
// SVG tools
const svg = numberLineSVG(cfg);   // or barModelSVG / numberTrackSVG / nrRenderFromCfg
const png = await svgToPng(svg);
zip.file(`${folder}/image.png`, png);

// PV
const blob = await pvGetPngBlob(cfg);
zip.file(`${folder}/image.png`, blob);
```

---

## Standalone pages (`tools/xx/index.html`)

Each standalone page loads only what it needs:

```html
<script src="../shared.js"></script>
<script src="nl.js"></script>
```

Because the tool JS calls builder functions (`addToolQuestion`, `openBatchPanel`, `closeTool`), the standalone page stubs these out as no-ops:

```js
let activeTool = 'nl';
function closeTool() {}
function openBatchPanel() {}
function openSharedBatch() {}
function addToolQuestion() {}
```

Then it injects the panel HTML and initialises:

```js
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#tool-wrap .form-card').innerHTML = nlPanelHTML();
  initNLPanel();
  // replace "+ Add Question" with a Download PNG button
});
```

NT and PV have no init function — `autoPreviewNT()` / `autoPreviewPV()` are called directly after panel injection.

---

## Adding a new tool

1. Create `tools/xx/xx.js` with the standard structure (state, `xxPanelHTML()`, `initXXPanel()`, `autoPreviewXX()`, `getXXConfig()`, `restoreXXConfig()`)
2. Put any renderer that could be reused by other tools into `shared.js`
3. Create `tools/xx/index.html` following the standalone template — stub builder globals, inject panel, call init
4. Add `<script src="tools/xx/xx.js"></script>` to `index.html` (after `shared.js`, before the inline `<script>`)
5. Add a `<div class="tool-panel hidden" id="tool-panel-xx"><div class="form-card"></div></div>` placeholder to `index.html`
6. Add the panel injection line at `DOMContentLoaded`: `document.querySelector('#tool-panel-xx .form-card').innerHTML = xxPanelHTML();`
7. Add a tool tab button and wire up `openTool('xx')`, `addToolQuestion('xx')`, `getXXConfig()`, `restoreXXConfig()` in the builder JS
8. Add a PNG export branch in `batchExport()` — use `svgToPng()` for SVG tools, or implement `xxGetPngBlob()` for canvas tools
