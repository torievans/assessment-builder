// ─── tools/pr/pr.js — Pictorial Representations ──────────────────────────────
//
// Exposes:  prPanelHTML()    initPRPanel()   autoPreviewPR()
//           getPRConfig()    restorePRConfig(cfg)   pictorialSVG(cfg)
//
// Standalone PNG export: svgToPng(pictorialSVG(cfg))  [svgToPng from shared.js]

// ── Image Bank ────────────────────────────────────────────────────────────────
const PR_IMAGE_BANK = [
  {id:'tiger',     label:'Tiger',     emoji:'🐯', bg:'#FDE8C8', stroke:'#D97706'},
  {id:'dog',       label:'Dog',       emoji:'🐶', bg:'#EDD9C0', stroke:'#92400E'},
  {id:'cat',       label:'Cat',       emoji:'🐱', bg:'#E8E8E8', stroke:'#6B7280'},
  {id:'frog',      label:'Frog',      emoji:'🐸', bg:'#C8EDD8', stroke:'#065F46'},
  {id:'butterfly', label:'Butterfly', emoji:'🦋', bg:'#DDD9F5', stroke:'#4C1D95'},
  {id:'fish',      label:'Fish',      emoji:'🐠', bg:'#D4E8FD', stroke:'#1D4ED8'},
  {id:'duck',      label:'Duck',      emoji:'🦆', bg:'#FEF5D8', stroke:'#B45309'},
  {id:'bee',       label:'Bee',       emoji:'🐝', bg:'#FEF5D8', stroke:'#A16207'},
  {id:'ladybird',  label:'Ladybird',  emoji:'🐞', bg:'#FFDDD9', stroke:'#991B1B'},
  {id:'apple',     label:'Apple',     emoji:'🍎', bg:'#FFE4E1', stroke:'#9F1239'},
  {id:'banana',    label:'Banana',    emoji:'🍌', bg:'#FEF5D8', stroke:'#854D0E'},
  {id:'orange',    label:'Orange',    emoji:'🍊', bg:'#FDE8D4', stroke:'#C2410C'},
  {id:'strawberry',label:'Strawberry',emoji:'🍓', bg:'#FFE4E1', stroke:'#BE123C'},
  {id:'star',      label:'Star',      emoji:'⭐', bg:'#FEF5D8', stroke:'#A16207'},
  {id:'heart',     label:'Heart',     emoji:'❤️', bg:'#FFE4E1', stroke:'#9F1239'},
  {id:'flower',    label:'Flower',    emoji:'🌸', bg:'#FDDCEE', stroke:'#9D174D'},
];

// ── State ─────────────────────────────────────────────────────────────────────
let pr_mode    = 'count';
let pr_display = 'array';
let pr_countA  = 5;
let pr_imageA  = 'tiger';
let pr_countB  = 3;
let pr_imageB  = 'apple';
let pr_op      = 'add';
let pr_subMode = 'crossed';   // 'total' | 'separate' | 'crossed'  (only used when op=sub)
let pr_cols    = 5;
let pr_mrows   = 2;
let pr_mcols   = 5;

function prClamp(v, mn, mx) { return Math.max(mn, Math.min(mx, Math.round(+v) || mn)); }

// ── Image Bank Builder ────────────────────────────────────────────────────────
function prBuildBank(containerId, selectedId, fnName, small) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const sz = small ? 38 : 46;
  const fs = small ? 15 : 20;
  el.innerHTML = PR_IMAGE_BANK.map(img => {
    const sel = img.id === selectedId;
    return `<button class="pr-img-btn${sel ? ' selected' : ''}"
      title="${img.label}" onclick="${fnName}('${img.id}')"
      style="width:${sz}px;height:${sz + 6}px;background:${img.bg};border-color:${sel ? img.stroke : 'transparent'}">
      <span style="font-size:${fs}px;line-height:1;display:block">${img.emoji}</span>
      <span style="font-size:8px;display:block;margin-top:1px;color:#555;font-weight:700;overflow:hidden;white-space:nowrap;max-width:${sz - 4}px;text-overflow:ellipsis">${img.label}</span>
    </button>`;
  }).join('');
}

function prSelA(id) {
  pr_imageA = id;
  prBuildBank('pr-bank-a',        id, 'prSelA');
  prBuildBank('pr-bank-addsub-a', id, 'prSelA',   true);
  prBuildBank('pr-bank-mul',      id, 'prSelMul');
  autoPreviewPR();
}
function prSelB(id) {
  pr_imageB = id;
  prBuildBank('pr-bank-addsub-b', id, 'prSelB', true);
  autoPreviewPR();
}
function prSelMul(id) {
  pr_imageA = id;
  prBuildBank('pr-bank-mul', id, 'prSelMul');
  prBuildBank('pr-bank-a',   id, 'prSelA');
  autoPreviewPR();
}

// ── Panel HTML ────────────────────────────────────────────────────────────────
function prPanelHTML() {
  return `
    <div class="form-row">
      <div class="field"><label>Type</label>
        <div class="tog-row">
          <button class="tog-btn active" data-prmode="count"    onclick="prSetMode(this)">Count</button>
          <button class="tog-btn"        data-prmode="addsub"   onclick="prSetMode(this)">Add / Sub</button>
          <button class="tog-btn"        data-prmode="multiply" onclick="prSetMode(this)">Multiply</button>
        </div>
      </div>
    </div>
    <div class="form-row">
      <div class="field field-grow">
        <label>Question text</label>
        <input type="text" id="pr-text" placeholder="e.g. How many tigers are there?">
      </div>
      <div class="field field-sm">
        <label>Answer</label>
        <input type="text" id="pr-answer" placeholder="5">
      </div>
    </div>
    <div class="sec-hr"></div>

    <!-- COUNT ─────────────────────────────────────────────────────────────── -->
    <div id="pr-count-wrap">
      <div class="sec-label">Image</div>
      <div id="pr-bank-a" class="pr-bank"></div>
      <div class="form-row" style="margin-top:10px">
        <div class="field"><label>Count</label>
          <div style="display:flex;align-items:center;gap:4px">
            <button class="tog-btn" onclick="prDelta('A',-1)" style="width:30px;height:30px;padding:0">−</button>
            <input type="number" id="pr-ca" min="1" max="20" value="5"
              style="width:52px;text-align:center;border:1.5px solid var(--border);border-radius:8px;padding:4px;font-size:14px;font-family:var(--font)"
              oninput="pr_countA=prClamp(+this.value,1,20);autoPreviewPR()">
            <button class="tog-btn" onclick="prDelta('A',1)"  style="width:30px;height:30px;padding:0">+</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ADD / SUB ──────────────────────────────────────────────────────────── -->
    <div id="pr-addsub-wrap" style="display:none">
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start">

        <!-- Group A -->
        <div style="flex:1;min-width:165px">
          <div class="sec-label" id="pr-label-a">Group A</div>
          <div id="pr-bank-addsub-a" class="pr-bank pr-bank-sm"></div>
          <div style="display:flex;align-items:center;gap:4px;margin-top:8px">
            <button class="tog-btn" onclick="prDelta('A',-1)" style="width:27px;height:27px;padding:0;font-size:13px">−</button>
            <input type="number" id="pr-addsub-ca" min="1" max="20" value="5"
              style="width:44px;text-align:center;border:1.5px solid var(--border);border-radius:8px;padding:3px;font-size:13px;font-family:var(--font)"
              oninput="pr_countA=prClamp(+this.value,1,20);autoPreviewPR()">
            <button class="tog-btn" onclick="prDelta('A',1)"  style="width:27px;height:27px;padding:0;font-size:13px">+</button>
          </div>
        </div>

        <!-- Operator -->
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:20px;gap:4px">
          <div class="tog-row">
            <button class="tog-btn active" data-prop="add" onclick="prSetOp(this)" style="font-size:16px;padding:4px 10px">＋</button>
            <button class="tog-btn"        data-prop="sub" onclick="prSetOp(this)" style="font-size:16px;padding:4px 10px">−</button>
          </div>
        </div>

        <!-- Group B -->
        <div id="pr-groupb-wrap" style="flex:1;min-width:165px">
          <div class="sec-label" id="pr-label-b">Group B</div>
          <div id="pr-bank-addsub-b" class="pr-bank pr-bank-sm"></div>
          <div style="display:flex;align-items:center;gap:4px;margin-top:8px">
            <button class="tog-btn" onclick="prDelta('B',-1)" style="width:27px;height:27px;padding:0;font-size:13px">−</button>
            <input type="number" id="pr-addsub-cb" min="1" max="20" value="3"
              style="width:44px;text-align:center;border:1.5px solid var(--border);border-radius:8px;padding:3px;font-size:13px;font-family:var(--font)"
              oninput="pr_countB=prClamp(+this.value,1,20);autoPreviewPR()">
            <button class="tog-btn" onclick="prDelta('B',1)"  style="width:27px;height:27px;padding:0;font-size:13px">+</button>
          </div>
        </div>

      </div>

      <!-- Subtraction display mode (shown only when op=sub) -->
      <div id="pr-submode-row" style="display:none;margin-top:12px">
        <div class="field">
          <label>Subtraction shows</label>
          <div class="tog-row">
            <button class="tog-btn"        data-prsub="total"    onclick="prSetSubMode(this)">Total only</button>
            <button class="tog-btn"        data-prsub="separate" onclick="prSetSubMode(this)">Two groups</button>
            <button class="tog-btn active" data-prsub="crossed"  onclick="prSetSubMode(this)">Crossed out</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MULTIPLY ───────────────────────────────────────────────────────────── -->
    <div id="pr-multiply-wrap" style="display:none">
      <div class="sec-label">Image</div>
      <div id="pr-bank-mul" class="pr-bank"></div>
      <div class="form-row" style="margin-top:10px;align-items:center">
        <div class="field"><label>Rows</label>
          <div style="display:flex;align-items:center;gap:4px">
            <button class="tog-btn" onclick="prDeltaMul('rows',-1)" style="width:30px;height:30px;padding:0">−</button>
            <input type="number" id="pr-mrows" min="1" max="10" value="2"
              style="width:48px;text-align:center;border:1.5px solid var(--border);border-radius:8px;padding:4px;font-size:14px;font-family:var(--font)"
              oninput="pr_mrows=prClamp(+this.value,1,10);autoPreviewPR()">
            <button class="tog-btn" onclick="prDeltaMul('rows',1)"  style="width:30px;height:30px;padding:0">+</button>
          </div>
        </div>
        <div style="font-size:20px;font-weight:700;color:var(--muted);align-self:flex-end;padding-bottom:7px">×</div>
        <div class="field"><label>Columns</label>
          <div style="display:flex;align-items:center;gap:4px">
            <button class="tog-btn" onclick="prDeltaMul('cols',-1)" style="width:30px;height:30px;padding:0">−</button>
            <input type="number" id="pr-mcols" min="1" max="10" value="5"
              style="width:48px;text-align:center;border:1.5px solid var(--border);border-radius:8px;padding:4px;font-size:14px;font-family:var(--font)"
              oninput="pr_mcols=prClamp(+this.value,1,10);autoPreviewPR()">
            <button class="tog-btn" onclick="prDeltaMul('cols',1)"  style="width:30px;height:30px;padding:0">+</button>
          </div>
        </div>
      </div>
    </div>

    <div class="sec-hr"></div>

    <!-- LAYOUT ─────────────────────────────────────────────────────────────── -->
    <div class="form-row" id="pr-layout-row">
      <div class="field">
        <label>Layout</label>
        <div class="tog-row">
          <button class="tog-btn active" data-prd="array"       onclick="prSetDisplay(this)">Array</button>
          <button class="tog-btn"        data-prd="frame"       onclick="prSetDisplay(this)">10-frame</button>
          <button class="tog-btn"        data-prd="distributed" onclick="prSetDisplay(this)">Distributed</button>
        </div>
      </div>
      <div class="field field-sm" id="pr-cols-field">
        <label>Per row</label>
        <div style="display:flex;align-items:center;gap:4px">
          <button class="tog-btn" onclick="prDeltaCols(-1)" style="width:27px;height:27px;padding:0;font-size:13px">−</button>
          <input type="number" id="pr-cols-in" min="1" max="10" value="5"
            style="width:42px;text-align:center;border:1.5px solid var(--border);border-radius:8px;padding:3px;font-size:13px;font-family:var(--font)"
            oninput="pr_cols=prClamp(+this.value,1,10);autoPreviewPR()">
          <button class="tog-btn" onclick="prDeltaCols(1)"  style="width:27px;height:27px;padding:0;font-size:13px">+</button>
        </div>
      </div>
    </div>

    <div class="preview-box" id="pr-preview"><p class="preview-empty">Configure above to preview.</p></div>
    <div class="form-actions">
      <button class="btn btn-blue" id="add-q-btn-pr" onclick="addToolQuestion('pr')">+ Add Question</button>
      <button class="btn btn-ghost" onclick="closeTool()">Cancel</button>
    </div>
  `;
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initPRPanel() {
  prBuildBank('pr-bank-a',        pr_imageA, 'prSelA');
  prBuildBank('pr-bank-addsub-a', pr_imageA, 'prSelA',   true);
  prBuildBank('pr-bank-addsub-b', pr_imageB, 'prSelB',   true);
  prBuildBank('pr-bank-mul',      pr_imageA, 'prSelMul');
  prUpdateMode();
  autoPreviewPR();
}

function prSetMode(btn) {
  pr_mode = btn.dataset.prmode;
  document.querySelectorAll('[data-prmode]').forEach(b => b.classList.toggle('active', b.dataset.prmode === pr_mode));
  prUpdateMode();
  autoPreviewPR();
}

function prUpdateMode() {
  const isMultiply = pr_mode === 'multiply';
  const show = (id, v) => { const e = document.getElementById(id); if (e) e.style.display = v ? '' : 'none'; };
  show('pr-count-wrap',    pr_mode === 'count');
  show('pr-addsub-wrap',   pr_mode === 'addsub');
  show('pr-multiply-wrap', isMultiply);
  show('pr-layout-row',    !isMultiply);
  show('pr-cols-field',    pr_display === 'array' && !isMultiply);
}

function prSetDisplay(btn) {
  pr_display = btn.dataset.prd;
  document.querySelectorAll('[data-prd]').forEach(b => b.classList.toggle('active', b.dataset.prd === pr_display));
  const e = document.getElementById('pr-cols-field');
  if (e) e.style.display = (pr_display === 'array' && pr_mode !== 'multiply') ? '' : 'none';
  autoPreviewPR();
}

function prSetOp(btn) {
  pr_op = btn.dataset.prop;
  document.querySelectorAll('[data-prop]').forEach(b => b.classList.toggle('active', b.dataset.prop === pr_op));
  prUpdateSubUI();
  autoPreviewPR();
}

function prSetSubMode(btn) {
  pr_subMode = btn.dataset.prsub;
  document.querySelectorAll('[data-prsub]').forEach(b => b.classList.toggle('active', b.dataset.prsub === pr_subMode));
  prUpdateSubUI();
  autoPreviewPR();
}

// Show/hide sub mode controls and update Group B label
function prUpdateSubUI() {
  const isSub = pr_op === 'sub';
  // Sub mode toggle only shows for subtraction
  const row = document.getElementById('pr-submode-row');
  if (row) row.style.display = isSub ? '' : 'none';
  // Group B image bank: visible for add OR sub-separate
  const showBankB = !isSub || pr_subMode === 'separate';
  const bankB = document.getElementById('pr-bank-addsub-b');
  if (bankB) bankB.style.opacity = showBankB ? '1' : '0.35';
  if (bankB) bankB.style.pointerEvents = showBankB ? '' : 'none';
  // Update labels
  const lblA = document.getElementById('pr-label-a');
  const lblB = document.getElementById('pr-label-b');
  if (isSub) {
    if (lblA) lblA.textContent = 'Total (minuend)';
    if (lblB) {
      lblB.textContent = pr_subMode === 'total' ? 'Take away (unused)' :
                         pr_subMode === 'crossed' ? 'Cross out (how many)' : 'Take away';
    }
  } else {
    if (lblA) lblA.textContent = 'Group A';
    if (lblB) lblB.textContent = 'Group B';
  }
}

function prDelta(grp, d) {
  if (grp === 'A') {
    pr_countA = prClamp(pr_countA + d, 1, 20);
    ['pr-ca', 'pr-addsub-ca'].forEach(id => { const e = document.getElementById(id); if (e) e.value = pr_countA; });
  } else {
    pr_countB = prClamp(pr_countB + d, 1, 20);
    const e = document.getElementById('pr-addsub-cb'); if (e) e.value = pr_countB;
  }
  autoPreviewPR();
}

function prDeltaMul(dim, d) {
  if (dim === 'rows') { pr_mrows = prClamp(pr_mrows + d, 1, 10); const e = document.getElementById('pr-mrows'); if (e) e.value = pr_mrows; }
  else               { pr_mcols = prClamp(pr_mcols + d, 1, 10); const e = document.getElementById('pr-mcols'); if (e) e.value = pr_mcols; }
  autoPreviewPR();
}

function prDeltaCols(d) {
  pr_cols = prClamp(pr_cols + d, 1, 10);
  const e = document.getElementById('pr-cols-in'); if (e) e.value = pr_cols;
  autoPreviewPR();
}

function autoPreviewPR() {
  const box = document.getElementById('pr-preview');
  if (!box) return;
  try {
    box.innerHTML = pictorialSVG(getPRConfig());
  } catch (err) {
    console.error('PR preview error:', err);
    box.innerHTML = '<p class="preview-empty">Preview error — see console.</p>';
  }
}

function getPRConfig() {
  return {
    mode:     pr_mode,
    display:  pr_display,
    countA:   pr_countA,
    imageIdA: pr_imageA,
    countB:   pr_countB,
    imageIdB: pr_imageB,
    op:       pr_op,
    subMode:  pr_subMode,
    cols:     pr_cols,
    mrows:    pr_mrows,
    mcols:    pr_mcols,
  };
}

function restorePRConfig(cfg) {
  if (!cfg) return;
  pr_mode    = cfg.mode    || 'count';
  pr_display = cfg.display || 'array';
  pr_countA  = cfg.countA  || 5;
  pr_imageA  = cfg.imageIdA|| 'tiger';
  pr_countB  = cfg.countB  || 3;
  pr_imageB  = cfg.imageIdB|| 'apple';
  pr_op      = cfg.op      || 'add';
  pr_subMode = cfg.subMode || 'crossed';
  pr_cols    = cfg.cols    || 5;
  pr_mrows   = cfg.mrows   || 2;
  pr_mcols   = cfg.mcols   || 5;
  const sv = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
  sv('pr-ca', pr_countA);       sv('pr-addsub-ca', pr_countA);
  sv('pr-addsub-cb', pr_countB);
  sv('pr-mrows', pr_mrows);     sv('pr-mcols', pr_mcols);
  sv('pr-cols-in', pr_cols);
  document.querySelectorAll('[data-prmode]').forEach(b => b.classList.toggle('active', b.dataset.prmode === pr_mode));
  document.querySelectorAll('[data-prd]').forEach(b => b.classList.toggle('active', b.dataset.prd === pr_display));
  document.querySelectorAll('[data-prop]').forEach(b => b.classList.toggle('active', b.dataset.prop === pr_op));
  document.querySelectorAll('[data-prsub]').forEach(b => b.classList.toggle('active', b.dataset.prsub === pr_subMode));
  prBuildBank('pr-bank-a',        pr_imageA, 'prSelA');
  prBuildBank('pr-bank-addsub-a', pr_imageA, 'prSelA',   true);
  prBuildBank('pr-bank-addsub-b', pr_imageB, 'prSelB',   true);
  prBuildBank('pr-bank-mul',      pr_imageA, 'prSelMul');
  prUpdateMode();
  prUpdateSubUI();
  autoPreviewPR();
}

function prResetState() {
  pr_mode = 'count'; pr_display = 'array';
  pr_countA = 5; pr_imageA = 'tiger';
  pr_countB = 3; pr_imageB = 'apple';
  pr_op = 'add'; pr_subMode = 'crossed';
  pr_cols = 5; pr_mrows = 2; pr_mcols = 5;
}

// ── SVG Renderer ──────────────────────────────────────────────────────────────
//
// pictorialSVG(cfg) → SVG string
//
// Distributed layout guarantee: items are placed on a grid with step DS = R*2+26.
// The JITTER table has max component ≤ 10px in each axis.
// Minimum adjacent item distance = DS - 2*10 = DS - 20 = R*2+6 > 2*R (no overlap).
//
function pictorialSVG(cfg) {
  const {
    mode    = 'count',
    display = 'array',
    countA  = 5,  imageIdA = 'tiger',
    countB  = 3,  imageIdB = 'apple',
    op      = 'add',
    subMode = 'crossed',
    cols    = 5,
    mrows   = 2, mcols = 5,
  } = cfg;

  const R   = 22;           // item circle radius (px)
  const GAP = 10;           // gap between items in array/frame
  const PAD = 22;           // outer SVG padding
  const S   = R * 2 + GAP; // array grid step = 54
  const DS  = R * 2 + 26;  // distributed grid step = 70 — wider to absorb jitter safely
  const FONT = "'Proxima Soft','Nunito',sans-serif";

  const imgA = PR_IMAGE_BANK.find(i => i.id === imageIdA) || PR_IMAGE_BANK[0];
  const imgB = PR_IMAGE_BANK.find(i => i.id === imageIdB) || PR_IMAGE_BANK[1];

  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ── Single item ───────────────────────────────────────────────────────────
  function renderItem(img, cx, cy, crossed) {
    const fs = Math.round(R * 1.05);
    let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${img.bg}" stroke="${img.stroke}" stroke-width="2.5"/>`;
    s += `<text x="${cx}" y="${cy}" dominant-baseline="central" text-anchor="middle" font-size="${fs}" font-family="sans-serif">${esc(img.emoji)}</text>`;
    if (crossed) {
      const d = R * 0.60, sw = Math.max(2.5, R * 0.12);
      s += `<line x1="${cx - d}" y1="${cy - d}" x2="${cx + d}" y2="${cy + d}" stroke="#DC2626" stroke-width="${sw}" stroke-linecap="round"/>`;
      s += `<line x1="${cx + d}" y1="${cy - d}" x2="${cx - d}" y2="${cy + d}" stroke="#DC2626" stroke-width="${sw}" stroke-linecap="round"/>`;
    }
    return s;
  }

  // ── Array position helpers ────────────────────────────────────────────────
  function arrayPts(count, perRow, ox, oy) {
    return Array.from({ length: count }, (_, i) => ({
      x: ox + (i % perRow) * S + R,
      y: oy + Math.floor(i / perRow) * S + R,
    }));
  }

  function arrayBox(count, perRow) {
    return {
      w: Math.min(count, perRow) * S - GAP,
      h: Math.ceil(count / perRow) * S - GAP,
    };
  }

  // ── Distributed scatter ───────────────────────────────────────────────────
  // All jitter components ≤ 10. With DS=70, min adjacent distance = 70-20 = 50 > 2*R+4.
  const JITTER = [
    [ 0,  0], [ 9, -6], [-5,  8], [ 7,  4], [-8, -5],
    [ 5, 10], [-9,  3], [ 6, -8], [-4,  6], [ 8, -7],
    [-5, -9], [ 4,  8], [-9, -2], [ 8,  6], [-6,  9],
    [ 3, -5], [-8,  7], [ 5,-10], [-3,  4], [ 7, -3],
  ];

  function scatterPts(count, perRow, ox, oy) {
    return Array.from({ length: count }, (_, i) => {
      const [jx, jy] = JITTER[i % JITTER.length];
      return { x: ox + (i % perRow) * DS + R + jx, y: oy + Math.floor(i / perRow) * DS + R + jy };
    });
  }

  // ── 10-frame renderer ─────────────────────────────────────────────────────
  // Renders one or more stacked 5×2 frames. Items with index ≥ crossFrom are crossed.
  function renderFrames(count, img, ox, oy, parts, crossFrom) {
    const FC = 5, FR = 2, FP = 8;
    const perFrame = FC * FR;
    const numFrames = Math.ceil(Math.max(1, count) / perFrame);
    const innerW = FC * S - GAP + FP * 2;
    const innerH = FR * S - GAP + FP * 2;
    const frameGap = 12;

    for (let f = 0; f < numFrames; f++) {
      const fy = oy + f * (innerH + frameGap);
      parts.push(`<rect x="${ox}" y="${fy}" width="${innerW}" height="${innerH}" rx="7" fill="#F8F9FB" stroke="#C8CDD4" stroke-width="2"/>`);
      for (let r = 0; r < FR; r++) for (let c = 0; c < FC; c++) {
        const cx = ox + FP + c * S + R, cy = fy + FP + r * S + R;
        parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="#EAECF0" stroke="#D1D5DB" stroke-width="1.5" stroke-dasharray="4,3"/>`);
      }
      const frameStart = f * perFrame;
      const frameCount = Math.min(count - frameStart, perFrame);
      for (let i = 0; i < frameCount; i++) {
        const globalIdx = frameStart + i;
        const col = i % FC, row = Math.floor(i / FC);
        const cx = ox + FP + col * S + R, cy = fy + FP + row * S + R;
        parts.push(renderItem(img, cx, cy, crossFrom !== undefined && globalIdx >= crossFrom));
      }
    }
    const FC2 = 5, FR2 = 2, FP2 = 8; // reuse for return value calculation
    const innerH2 = FR2 * S - GAP + FP2 * 2;
    const innerW2 = FC2 * S - GAP + FP2 * 2;
    return { w: innerW2, h: numFrames * (innerH2 + frameGap) - frameGap };
  }

  // ── Render a single group (used by count and by sub modes) ────────────────
  function renderSingleGroup(count, img, crossFrom) {
    const parts2 = [];
    let w2, h2;
    if (display === 'frame') {
      const {w, h} = renderFrames(count, img, PAD, PAD, parts2, crossFrom);
      w2 = w + PAD * 2; h2 = h + PAD * 2;
    } else if (display === 'distributed') {
      const perRow = Math.max(3, Math.ceil(Math.sqrt(count * 1.5)));
      const pts = scatterPts(count, perRow, PAD, PAD);
      w2 = Math.max(...pts.map(p => p.x + R + 10)) + PAD;
      h2 = Math.max(...pts.map(p => p.y + R + 10)) + PAD;
      pts.forEach(({ x, y }, i) => parts2.push(renderItem(img, x, y, crossFrom !== undefined && i >= crossFrom)));
    } else {
      const { w, h } = arrayBox(count, cols);
      w2 = w + PAD * 2; h2 = h + PAD * 2;
      arrayPts(count, cols, PAD, PAD).forEach(({ x, y }, i) =>
        parts2.push(renderItem(img, x, y, crossFrom !== undefined && i >= crossFrom)));
    }
    return { parts: parts2, svgW: w2, svgH: h2 };
  }

  // ── Render two groups side by side (add, or sub-separate) ─────────────────
  function renderTwoGroups(crossed) {
    const parts2 = [];
    const makePts = display === 'distributed' ? scatterPts : arrayPts;
    const boxA = arrayBox(countA, cols);
    const boxB = arrayBox(countB, cols);
    const OP_W = 54;
    const maxH = Math.max(boxA.h, boxB.h);
    const w2 = PAD + boxA.w + OP_W + boxB.w + PAD;
    const h2 = maxH + PAD * 2;

    const aOff = PAD + (maxH - boxA.h) / 2;
    makePts(countA, cols, PAD, aOff).forEach(({ x, y }) => parts2.push(renderItem(imgA, x, y)));

    const sym = op === 'add' ? '+' : '−';
    const opX = PAD + boxA.w + OP_W / 2;
    parts2.push(`<text x="${opX}" y="${h2 / 2}" dominant-baseline="central" text-anchor="middle" font-size="30" font-weight="700" font-family="${FONT}" fill="#374151">${sym}</text>`);

    const bxStart = PAD + boxA.w + OP_W;
    const bOff = PAD + (maxH - boxB.h) / 2;
    makePts(countB, cols, bxStart, bOff).forEach(({ x, y }) => parts2.push(renderItem(imgB, x, y, crossed)));

    return { parts: parts2, svgW: w2, svgH: h2 };
  }

  // ── Build SVG ─────────────────────────────────────────────────────────────
  let result;

  if (mode === 'count') {
    result = renderSingleGroup(countA, imgA);

  } else if (mode === 'addsub') {
    if (op === 'sub') {
      if (subMode === 'total') {
        // Just show the minuend (countA items), nothing else
        result = renderSingleGroup(countA, imgA);
      } else if (subMode === 'crossed') {
        // All countA items; the last countB are crossed
        const crossFrom = Math.max(0, countA - countB);
        result = renderSingleGroup(countA, imgA, crossFrom);
      } else {
        // 'separate' — two groups side by side, Group B crossed (with red X)
        if (display === 'frame') {
          // Combined frame: Group A first, then Group B crossed
          const total = countA + countB;
          const FC = 5, FR = 2, FP = 8;
          const perFrame = FC * FR;
          const numFrames = Math.ceil(Math.max(1, total) / perFrame);
          const innerW = FC * S - GAP + FP * 2;
          const innerH = FR * S - GAP + FP * 2;
          const frameGap = 12;
          const parts2 = [];
          const w2 = innerW + PAD * 2;
          const h2 = numFrames * (innerH + frameGap) - frameGap + PAD * 2;
          for (let f = 0; f < numFrames; f++) {
            const fy = PAD + f * (innerH + frameGap);
            parts2.push(`<rect x="${PAD}" y="${fy}" width="${innerW}" height="${innerH}" rx="7" fill="#F8F9FB" stroke="#C8CDD4" stroke-width="2"/>`);
            for (let r = 0; r < FR; r++) for (let c = 0; c < FC; c++) {
              const cx = PAD + FP + c * S + R, cy = fy + FP + r * S + R;
              parts2.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="#EAECF0" stroke="#D1D5DB" stroke-width="1.5" stroke-dasharray="4,3"/>`);
            }
            const fs2 = f * perFrame;
            const fc2 = Math.min(total - fs2, perFrame);
            for (let i = 0; i < fc2; i++) {
              const gi = fs2 + i;
              const col = i % FC, row = Math.floor(i / FC);
              const cx = PAD + FP + col * S + R, cy = fy + FP + row * S + R;
              const isA = gi < countA;
              parts2.push(renderItem(isA ? imgA : imgB, cx, cy, !isA));
            }
          }
          result = { parts: parts2, svgW: w2, svgH: h2 };
        } else {
          result = renderTwoGroups(true); // Group B crossed
        }
      }
    } else {
      // add — two groups side by side, no crossing
      if (display === 'frame') {
        // Combined frame: Group A then Group B
        const total = countA + countB;
        const FC = 5, FR = 2, FP = 8;
        const perFrame = FC * FR;
        const numFrames = Math.ceil(Math.max(1, total) / perFrame);
        const innerW = FC * S - GAP + FP * 2;
        const innerH = FR * S - GAP + FP * 2;
        const frameGap = 12;
        const parts2 = [];
        const w2 = innerW + PAD * 2;
        const h2 = numFrames * (innerH + frameGap) - frameGap + PAD * 2;
        for (let f = 0; f < numFrames; f++) {
          const fy = PAD + f * (innerH + frameGap);
          parts2.push(`<rect x="${PAD}" y="${fy}" width="${innerW}" height="${innerH}" rx="7" fill="#F8F9FB" stroke="#C8CDD4" stroke-width="2"/>`);
          for (let r = 0; r < FR; r++) for (let c = 0; c < FC; c++) {
            const cx = PAD + FP + c * S + R, cy = fy + FP + r * S + R;
            parts2.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="#EAECF0" stroke="#D1D5DB" stroke-width="1.5" stroke-dasharray="4,3"/>`);
          }
          const fs2 = f * perFrame;
          const fc2 = Math.min(total - fs2, perFrame);
          for (let i = 0; i < fc2; i++) {
            const gi = fs2 + i;
            const col = i % FC, row = Math.floor(i / FC);
            const cx = PAD + FP + col * S + R, cy = fy + FP + row * S + R;
            parts2.push(renderItem(gi < countA ? imgA : imgB, cx, cy));
          }
        }
        result = { parts: parts2, svgW: w2, svgH: h2 };
      } else {
        result = renderTwoGroups(false);
      }
    }

  } else if (mode === 'multiply') {
    // Clean array of items — no labels or annotations
    const count = mrows * mcols;
    const { w, h } = arrayBox(count, mcols);
    const parts2 = [];
    arrayPts(count, mcols, PAD, PAD).forEach(({ x, y }) => parts2.push(renderItem(imgA, x, y)));
    result = { parts: parts2, svgW: w + PAD * 2, svgH: h + PAD * 2 };
  }

  const { parts, svgW, svgH } = result || { parts: [], svgW: 100, svgH: 100 };
  return `<svg viewBox="0 0 ${Math.ceil(svgW)} ${Math.ceil(svgH)}" xmlns="http://www.w3.org/2000/svg" style="background:#fff;border-radius:4px">${parts.join('')}</svg>`;
}
