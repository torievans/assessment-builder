// gen_images.js — Generate question/answer PNGs using the actual JS SVG tools
'use strict';

const fs    = require('fs');
const path  = require('path');
const vm    = require('vm');
const sharp = require('sharp');
const {createCanvas, registerFont} = require('canvas');

const BASE       = '/sessions/jolly-eloquent-bell/mnt/Year 1 maths';
const TOOLS_DIR  = path.join(BASE, 'tools');
const DATA_DIR   = path.join(BASE, 'question-data');
const ASSETS_DIR = path.join(BASE, 'Question assets');
const OUT_DIR    = '/tmp/slide-images';

fs.mkdirSync(OUT_DIR, {recursive: true});

try {
  // Prefer schoolbook variants (single-story a/l/y); fall back to originals
  const boldFont = fs.existsSync('/tmp/ProximaSoftBoldSB.ttf') ? '/tmp/ProximaSoftBoldSB.ttf' : '/tmp/ProximaSoftBold.ttf';
  const regFont  = fs.existsSync('/tmp/ProximaSoftRegSB.ttf')  ? '/tmp/ProximaSoftRegSB.ttf'  : '/tmp/ProximaSoftReg.ttf';
  registerFont(boldFont, {family:'Proxima Soft', weight:'bold'});
  registerFont(regFont,  {family:'Proxima Soft'});
} catch(e) {}

function makeCanvas() {
  const cv = createCanvas(100, 100);
  if (!cv.style) cv.style = {width:'', height:''};
  return cv;
}

const toolCtx = vm.createContext({
  Math, JSON, parseInt, parseFloat, isNaN, isFinite, String, Number, Boolean,
  Array, Object, RegExp, Error, Map, Set, WeakMap, WeakSet, Symbol, Date,
  Promise, Proxy, Reflect, console, setTimeout, clearTimeout, setInterval, clearInterval,
  document: {
    createElement: (tag) => tag === 'canvas' ? makeCanvas() :
      {style:{width:'',height:''}, innerHTML:'', querySelector:()=>null, querySelectorAll:()=>[]},
    getElementById:()=>null, querySelector:()=>null, querySelectorAll:()=>[],
  },
  window: {},
});

vm.runInContext(fs.readFileSync(path.join(TOOLS_DIR, 'shared.js'), 'utf8'), toolCtx);
vm.runInContext(fs.readFileSync(path.join(TOOLS_DIR, 'pr', 'pr.js'), 'utf8'), toolCtx);
vm.runInContext(fs.readFileSync(path.join(TOOLS_DIR, 'pv', 'pv.js'), 'utf8'), toolCtx);

// Patch pvSetupCanvas to skip the white background fill — preserves canvas transparency
vm.runInContext(`
  const __pvSetup_orig = pvSetupCanvas;
  pvSetupCanvas = function(cv, lw, lh, sc) {
    cv.width = lw * sc; cv.height = lh * sc;
    if (!cv.style) cv.style = {};
    cv.style.width = lw + 'px'; cv.style.height = lh + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(sc, sc);
    // intentionally skip ctx.fillRect white fill — leave canvas transparent
    return ctx;
  };
`, toolCtx);

const {numberTrackSVG, numberLineSVG, nrRenderFromCfg, pictorialSVG, pvRenderToCanvas} = toolCtx;

// ── SVG helpers ───────────────────────────────────────────────────────────
function svgViewBox(s) {
  const m = s.match(/viewBox=["']([0-9. ]+)["']/);
  if (!m) return {w:300, h:100};
  const p = m[1].trim().split(/\s+/).map(Number);
  return {w:p[2]||300, h:p[3]||100};
}

// Embed Proxima Soft Bold as @font-face so librsvg/sharp renders the correct font
const FONT_B64 = fs.existsSync('/tmp/ProximaSoftBold.ttf')
  ? fs.readFileSync('/tmp/ProximaSoftBold.ttf').toString('base64') : null;
// Use the schoolbook TTF (with single-story 'a'/'l'/'y') for SVG embedding
const FONT_SB_B64 = fs.existsSync('/tmp/ProximaSoftBoldSB.ttf')
  ? fs.readFileSync('/tmp/ProximaSoftBoldSB.ttf').toString('base64') : null;
const FONT_STYLE = (FONT_B64 || FONT_SB_B64)
  ? `<style>@font-face{font-family:'Proxima Soft';font-weight:700 900;src:url('data:font/truetype;base64,${FONT_SB_B64||FONT_B64}')format('truetype');}text{font-feature-settings:'ss01' 1;}</style>`
  : '';

function injectFont(svgStr) {
  if (!FONT_STYLE) return svgStr;
  return svgStr.replace(/(<svg[^>]*>)/, `$1${FONT_STYLE}`);
}

function removeWhiteBg(svgStr) {
  // NT outer background rect: <rect width="NNN" height="NNN" fill="white" rx="10"/>
  svgStr = svgStr.replace(
    /<rect(\s+width="[^"]+"\s+height="[^"]+"\s+fill="white"\s+rx="[^"]*"\s*\/>)/g,
    '<rect$1'.replace('fill="white"', 'fill="none"')
  );
  // The regex above replaces inside the match — use a function instead:
  svgStr = svgStr.replace(
    /<rect\s+width="[^"]+"\s+height="[^"]+"\s+fill="white"\s+rx="[^"]*"\s*\/>/g,
    m => m.replace('fill="white"', 'fill="none"')
  );
  // NR frame inner rects: <rect x="0" y="0" width="NNN" height="NNN" fill="white"/>
  svgStr = svgStr.replace(
    /<rect\s+x="0"\s+y="0"\s+width="[^"]+"\s+height="[^"]+"\s+fill="white"\s*\/>/g,
    m => m.replace('fill="white"', 'fill="none"')
  );
  // PR 10-frame background rects use fill="#fff" (not "white")
  svgStr = svgStr.replace(
    /<rect\b([^>]*)fill="#fff"([^>]*)\/>/g,
    (m) => m.replace('fill="#fff"', 'fill="none"')
  );
  return svgStr;
}

async function svgToPng(svgStr, scale) {
  svgStr = injectFont(removeWhiteBg(svgStr));
  const {w, h} = svgViewBox(svgStr);
  const sc = scale || 6;
  return sharp(Buffer.from(svgStr, 'utf8'))
    .resize(Math.round(w*sc), Math.round(h*sc), {fit:'fill'})
    .png().toBuffer();
}

function pvToPng(cfg) {
  const cv = makeCanvas();
  pvRenderToCanvas(cv, cfg, 6);
  return cv.toBuffer('image/png');
}

function inlineIllus(svgStr) {
  return svgStr.replace(
    /href="https:\/\/torievans\.github\.io\/assessment-builder\/Question%20assets\/([^"]+)"/g,
    (_, enc) => {
      const lp = path.join(ASSETS_DIR, decodeURIComponent(enc));
      return fs.existsSync(lp)
        ? `href="data:image/png;base64,${fs.readFileSync(lp).toString('base64')}"`
        : `href=""`;
    }
  );
}

// ── NT answer highlight ───────────────────────────────────────────────────
// Adds a white outline around the answer cell in the NT answer SVG.
// Uses the exact same path geometry as drawShape() in shared.js so the
// outline perfectly follows the cell boundary for every shape.
function addNTHighlight(svgStr, answerIdx, shape) {
  if (answerIdx < 0) return svgStr;
  const CELL = 68, GAP = 7, PAD = 14;
  const cx = PAD + answerIdx * (CELL + GAP) + CELL / 2;
  const cy = PAD + CELL / 2;
  const h  = CELL / 2;
  const sf = `fill="none" stroke="white" stroke-width="5"`;
  let ring;
  if (shape === 'square') {
    const rx = (CELL * 0.18).toFixed(1);
    ring = `<rect x="${cx-h}" y="${cy-h}" width="${CELL}" height="${CELL}" rx="${rx}" ${sf}/>`;
  } else if (shape === 'circle') {
    ring = `<circle cx="${cx}" cy="${cy}" r="${h}" ${sf}/>`;
  } else if (shape === 'balloon') {
    const sc = h / 50;
    const t = (x, y) => `${(cx + x*sc).toFixed(2)},${(cy + y*sc).toFixed(2)}`;
    const d = `M ${t(2.4938,38.8859)} L ${t(7.0728,50)} L ${t(-7.0725,50)} L ${t(-2.4938,38.8859)} C ${t(-16.3083,35.6907)} ${t(-38.1513,7.9808)} ${t(-38.1513,-11.8487)} C ${t(-38.1513,-32.9188)} ${t(-21.0701,-50)} ${t(0,-50)} C ${t(21.0701,-50)} ${t(38.1513,-32.9188)} ${t(38.1513,-11.8487)} C ${t(38.1513,7.9808)} ${t(16.3083,35.6907)} ${t(2.4938,38.8859)} Z`;
    ring = `<path d="${d}" ${sf}/>`;
  } else if (shape === 'star') {
    const sc = h / 50;
    const t = (x, y) => `${(cx + x*sc).toFixed(2)},${(cy + y*sc).toFixed(2)}`;
    const d = `M ${t(49.073,-11.9)} C ${t(48.146,-14.752)} ${t(45.487,-16.684)} ${t(42.487,-16.684)} L ${t(15.061,-16.684)} L ${t(6.586,-42.768)} C ${t(5.659,-45.621)} ${t(3,-47.553)} ${t(0,-47.553)} C ${t(-3,-47.553)} ${t(-5.659,-45.621)} ${t(-6.586,-42.768)} L ${t(-15.061,-16.684)} L ${t(-42.487,-16.684)} C ${t(-45.487,-16.684)} ${t(-48.146,-14.752)} ${t(-49.073,-11.9)} C ${t(-50,-9.046)} ${t(-48.985,-5.92)} ${t(-46.557,-4.157)} L ${t(-24.369,11.963)} L ${t(-32.844,38.047)} C ${t(-33.771,40.9)} ${t(-32.756,44.026)} ${t(-30.329,45.789)} C ${t(-27.902,47.552)} ${t(-24.615,47.553)} ${t(-22.188,45.789)} L ${t(0,29.669)} L ${t(22.188,45.789)} C ${t(23.402,46.671)} ${t(24.83,47.112)} ${t(26.259,47.112)} C ${t(27.687,47.112)} ${t(29.115,46.671)} ${t(30.329,45.789)} C ${t(32.756,44.026)} ${t(33.771,40.9)} ${t(32.845,38.047)} L ${t(24.37,11.963)} L ${t(46.557,-4.157)} C ${t(48.985,-5.92)} ${t(50,-9.046)} ${t(49.073,-11.9)} Z`;
    ring = `<path d="${d}" ${sf}/>`;
  } else if (shape === 'cloud') {
    const sc = CELL / 195;
    const t = (x, y) => `${(cx + (x-100)*sc).toFixed(2)},${(cy + (y-68)*sc).toFixed(2)}`;
    const d = `M ${t(175.74,63.49)} C ${t(175.75,63.18)} ${t(175.76,62.86)} ${t(175.76,62.55)} C ${t(175.76,46.8)} ${t(163,34.03)} ${t(147.25,34.03)} C ${t(144.06,34.03)} ${t(141,34.56)} ${t(138.14,35.52)} C ${t(133.48,17.4)} ${t(117.03,4)} ${t(97.45,4)} C ${t(75.18,4)} ${t(56.96,21.34)} ${t(55.55,43.25)} C ${t(53.42,42.6)} ${t(51.16,42.25)} ${t(48.82,42.25)} C ${t(36.89,42.25)} ${t(27.1,51.4)} ${t(26.07,63.06)} C ${t(13.84,65.5)} ${t(4.55,76.35)} ${t(4.55,89.27)} C ${t(4.55,103.97)} ${t(16.57,116)} ${t(31.27,116)} L ${t(168.73,116)} C ${t(183.43,116)} ${t(195.45,103.97)} ${t(195.45,89.27)} C ${t(195.45,77)} ${t(187.07,66.59)} ${t(175.74,63.49)} Z`;
    ring = `<path d="${d}" ${sf}/>`;
  } else {
    // fallback
    ring = `<circle cx="${cx}" cy="${cy}" r="${h}" ${sf}/>`;
  }
  return svgStr.replace('</svg>', ring + '</svg>');
}

// ── NT helpers ─────────────────────────────────────────────────────────────
function genNTExample(questions) {
  const existing = new Set(questions.map(q => q.answer));
  const refCfg   = questions[0].cfg;
  const tokens   = refCfg.sequence.split(',').map(t => t.trim());
  const nums     = tokens.filter(t => t !== '?' && t !== '_').map(Number);
  if (!nums.length) return {cfg:refCfg, answer:questions[0].answer, fallback:true};
  const isFwd = nums.length >= 2 ? nums[1] > nums[0] : true;
  const step  = isFwd ? 1 : -1;
  const ansPos = tokens.indexOf('?');

  function calcAns(shifted) {
    let ni = 0;
    const full = tokens.map(t => (t==='?'||t==='_') ? null : shifted[ni++]);
    if (ansPos < 0) return null;
    for (let d = 1; d < tokens.length; d++) {
      const p = ansPos - d, n = ansPos + d;
      if (p >= 0 && full[p] !== null) return full[p] + d * step;
      if (n < tokens.length && full[n] !== null) return full[n] - d * step;
    }
    return null;
  }

  for (let offset = 1; offset <= 50; offset++) {
    const shifted = nums.map(n => n + offset * step);
    if (shifted.some(n => n < 0 || n > 100)) continue;
    const ans = calcAns(shifted);
    if (!ans || ans < 0 || ans > 100) continue;
    if (existing.has(String(ans))) continue;
    let si = 0;
    const newSeq = tokens.map(t => t==='_'?'_':t==='?'?'?':String(shifted[si++])).join(',');
    return {cfg:{...refCfg, sequence:newSeq}, answer:String(ans)};
  }
  return {cfg:refCfg, answer:questions[0].answer, fallback:true};
}

function ntAnswerSeq(seq, answer, step) {
  const tokens = seq.split(',').map(t => t.trim());
  const vals   = tokens.map(t => t==='?'?parseInt(answer):t==='_'?null:parseInt(t));
  const first  = vals.findIndex(v => v !== null);
  if (first >= 0) {
    for (let i = first-1; i >= 0; i--) if (vals[i]===null) vals[i] = vals[i+1] - step;
    for (let i = first+1; i < vals.length; i++) if (vals[i]===null) vals[i] = vals[i-1] + step;
  }
  return vals.map(String).join(',');
}

// ── NL helpers ─────────────────────────────────────────────────────────────
function genNLExample(questions) {
  const existing  = new Set(questions.map(q => q.answer));
  const ref       = questions[0].cfg;
  const {start, end} = ref;
  const hasHideFrom = ref.hideFrom != null;

  if (!hasHideFrom) {
    // "What's missing" — full line visible, just ? circle at answer
    for (let v = start + 1; v < end; v++) {
      if (!existing.has(String(v))) return {cfg:{...ref, answer:String(v)}, answer:String(v), noHideFrom:true};
    }
    return {cfg:ref, answer:ref.answer, fallback:true};
  }

  // "What's next" / crossing-ten — has hideFrom
  const refAns  = parseInt(ref.answer);
  const hideOff = refAns - ref.hideFrom;  // positive = answer is ahead of hideFrom

  for (let v = start + 1; v < end; v++) {
    if (existing.has(String(v))) continue;
    const newHide = Math.max(start + 1, Math.min(v - hideOff, end));
    return {cfg:{...ref, answer:String(v), hideFrom:newHide, hideTo:end}, answer:String(v)};
  }
  return {cfg:ref, answer:ref.answer, fallback:true};
}

// NL answer image: show all labels AND keep the circle on the answer position
function nlAnswerCfg(cfg) {
  return {...cfg, answerCircle:true, hideFrom:cfg.end+1, hideTo:cfg.end+1, revealAnswer:true};
}

// ── NR / PV / PR helpers ───────────────────────────────────────────────────
function genNRExample(questions) {
  const existing = new Set(questions.map(q => parseInt(q.answer)));
  const ref = questions[0].cfg;
  // Determine range from existing answers: 11-20 nuggets vs 1-10 nuggets; never use 1 as answer
  const maxExisting = Math.max(...questions.map(q => parseInt(q.answer)));
  const [lo, hi] = maxExisting > 10 ? [11, 20] : [2, 10];
  for (let n = lo; n <= hi; n++) if (!existing.has(n)) return {cfg:{...ref, n}, answer:String(n)};
  for (let n = 2; n <= 20; n++) if (!existing.has(n)) return {cfg:{...ref, n}, answer:String(n)};
  return {cfg:ref, answer:String(ref.n), fallback:true};
}

function genPVExample(questions) {
  const existing = new Set(questions.map(q => q.answer));
  const ref = questions[0].cfg;
  const base = ref.n || parseInt(questions[0].answer);
  for (let off = 1; off <= 60; off++) {
    const n = base + off;
    if (n > 0 && n <= 100 && !existing.has(String(n))) return {cfg:{...ref,n}, answer:String(n)};
  }
  return {cfg:ref, answer:String(ref.n), fallback:true};
}

function genPRExample(questions) {
  const existing = new Set(questions.map(q => parseInt(q.answer)));
  const ref = questions[0].cfg;
  // Determine range from existing answers: 11-20 nuggets vs 1-10 nuggets; never use 1 as answer
  const maxExisting = Math.max(...questions.map(q => parseInt(q.answer)));
  const [lo, hi] = maxExisting > 10 ? [11, 20] : [2, 10];
  for (let c = lo; c <= hi; c++) if (!existing.has(c)) return {cfg:{...ref, countA:c}, answer:String(c)};
  for (let c = 2; c <= 20; c++) if (!existing.has(c)) return {cfg:{...ref, countA:c}, answer:String(c)};
  return {cfg:ref, answer:String(ref.countA), fallback:true};
}

// ── Explanation text (tone D) ──────────────────────────────────────────────
function genExplanation(vtype, cfg, answer, promptText, exInfo) {
  const ans = parseInt(answer);

  if (vtype === 'nt') {
    const tokens = cfg.sequence.split(',').map(t => t.trim());
    const nums   = tokens.filter(t => t!=='?'&&t!=='_').map(Number);
    const isFwd  = nums.length >= 2 ? nums[1] > nums[0] : true;
    const step   = isFwd ? 1 : -1;
    const dir    = isFwd ? 'on' : 'back';
    const full   = ntAnswerSeq(cfg.sequence, answer, step);
    const seqStr = full.split(',').join(', ');
    return [`Count ${dir} to find out: ${seqStr}.`];
  }

  if (vtype === 'nl') {
    const isFwd   = ans > (cfg.start || 0);
    const dir     = isFwd ? 'on' : 'back';
    const from    = isFwd ? Math.max(cfg.start, ans - 4) : Math.min(cfg.end, ans + 4);
    const seqNums = [];
    if (isFwd) for (let v = from; v <= ans; v++) seqNums.push(v);
    else        for (let v = from; v >= ans; v--) seqNums.push(v);
    return [`Count ${dir} to find out: ${seqNums.join(', ')}.`];
  }

  if (vtype === 'nr') {
    const counts = Array.from({length:ans}, (_,i)=>i+1).join(', ');
    const prefix = (cfg.rep === 'numicon') ? 'Count the holes carefully' : 'Count carefully';
    return [`${prefix}: ${counts}.`];
  }

  if (vtype === 'pr') {
    const counts = Array.from({length:ans}, (_,i)=>i+1).join(', ');
    return [`Count carefully: ${counts}.`];
  }

  if (vtype === 'pv') {
    const lpt = promptText.toLowerCase();
    if (lpt.includes('ones')) {
      return [`Count: ${Array.from({length:ans},(_,i)=>i+1).join(', ')}.`];
    }
    const tens = Math.floor(ans/10), ones = ans%10;
    if (ones === 0) return [`Count the tens: ${Array.from({length:tens},(_,i)=>(i+1)*10).join(', ')}.`];
    const tl = tens===1?'1 ten':`${tens} tens`, ol = ones===1?'1 one':`${ones} ones`;
    return [`${tl} and ${ol} make ${ans}.`];
  }

  return [promptText, `The answer is ${answer}.`];
}

// ── Process one nugget ─────────────────────────────────────────────────────
async function processNugget(nuggetId, questions, exampleOverride) {
  const vtype  = questions[0].visualType;
  const prompt = (exampleOverride && exampleOverride.slidePromptText) || questions[0].text;
  let exInfo, qPng, aPng;

  if (vtype === 'nt') {
    const ex = exampleOverride || genNTExample(questions);
    exInfo = ex;
    const nums  = ex.cfg.sequence.split(',').filter(t=>t!=='?'&&t!=='_').map(Number);
    const isFwd = nums.length >= 2 ? nums[1] > nums[0] : true;
    const ansCfg = {...ex.cfg, sequence: ntAnswerSeq(ex.cfg.sequence, ex.answer, isFwd?1:-1)};
    // Find which cell index is the answer so we can highlight it
    const tokens    = ex.cfg.sequence.split(',').map(t=>t.trim());
    const answerIdx = tokens.indexOf('?');
    qPng = await svgToPng(numberTrackSVG(ex.cfg));
    aPng = await svgToPng(addNTHighlight(numberTrackSVG(ansCfg), answerIdx, ex.cfg.shape || 'square'));

  } else if (vtype === 'nl') {
    const ex = exampleOverride || genNLExample(questions);
    exInfo = ex;
    // Question image: show full number line, only hide the answer's own label
    const ans = parseInt(ex.answer);
    const qCfg = {...ex.cfg, hideFrom: ans, hideTo: ans, answerCircle: true, answer: ex.answer};
    const ansCfg = nlAnswerCfg(ex.cfg);
    qPng = await svgToPng(numberLineSVG(qCfg));
    aPng = await svgToPng(numberLineSVG(ansCfg));

  } else if (vtype === 'nr') {
    const ex = exampleOverride || genNRExample(questions);
    exInfo = ex;
    const nrQCfg = {...ex.cfg, showCount: false};
    qPng = await svgToPng(nrRenderFromCfg(nrQCfg));
    aPng = ex.cfg.showCount ? await svgToPng(nrRenderFromCfg(ex.cfg)) : qPng;

  } else if (vtype === 'pv') {
    const ex = exampleOverride || genPVExample(questions);
    exInfo = ex;
    const pvQCfg = {...ex.cfg, showCount: false};
    qPng = pvToPng(pvQCfg);
    aPng = ex.cfg.showCount ? pvToPng(ex.cfg) : qPng;

  } else if (vtype === 'pr') {
    const ex = exampleOverride || genPRExample(questions);
    exInfo = ex;
    const prQCfg = {...ex.cfg, illusOutline: false};
    const prACfg = {...ex.cfg, illusOutline: false, showCount: true};
    qPng = await svgToPng(inlineIllus(pictorialSVG(prQCfg)));
    aPng = await svgToPng(inlineIllus(pictorialSVG(prACfg)));

  } else {
    process.stderr.write(`Unknown vtype ${vtype} for ${nuggetId}\n`);
    return null;
  }

  const qPath = path.join(OUT_DIR, `${nuggetId}_q.png`);
  const aPath = path.join(OUT_DIR, `${nuggetId}_a.png`);
  fs.writeFileSync(qPath, qPng);
  if (aPng === qPng) fs.copyFileSync(qPath, aPath);
  else fs.writeFileSync(aPath, aPng);

  return {
    nuggetId, visualType: vtype, promptText: prompt,
    answer: exInfo.answer,
    explanation: (exampleOverride && exampleOverride.explanation)
      || genExplanation(vtype, exInfo.cfg, exInfo.answer, prompt, exInfo),
    qPath, aPath, fallback: !!(exInfo.fallback),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const seenIds = new Set();
  const nuggets = [];

  for (const folder of fs.readdirSync(DATA_DIR).sort()) {
    const fpath = path.join(DATA_DIR, folder);
    if (!fs.statSync(fpath).isDirectory() || !folder.startsWith('nugget-')) continue;
    const jf = fs.readdirSync(fpath).filter(f => f.endsWith('.json'));
    if (!jf.length) continue;
    const data = JSON.parse(fs.readFileSync(path.join(fpath, jf[0]), 'utf8'));
    const nid  = data.nuggetId;
    if (!nid || nid === 1 || seenIds.has(nid)) continue;
    seenIds.add(nid);
    if (data.skipSlide) { console.log(`  [${nid}] skipped (skipSlide)`); continue; }
    if (!data.questions || !data.questions.length) continue;
    nuggets.push({nuggetId: nid, questions: data.questions, exampleOverride: data.exampleOverride || null});
  }

  console.log(`Processing ${nuggets.length} nuggets...`);
  const manifest = [];

  for (const {nuggetId, questions, exampleOverride} of nuggets) {
    process.stdout.write(`  [${nuggetId}] `);
    try {
      const r = await processNugget(nuggetId, questions, exampleOverride);
      if (r) {
        manifest.push(r);
        const exp = r.explanation;
        console.log(`${r.visualType} ans=${r.answer}${r.fallback?' (F)':''}  "${exp[0]}" / "${exp[1]}"`);
      }
    } catch(err) {
      console.log(`ERROR: ${err.message}`);
      process.stderr.write(err.stack + '\n');
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${manifest.length} nuggets.`);
}

main().catch(console.error);
