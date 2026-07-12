/* ── Bar-model SVG renderer ──────────────────────────────────────────────── *
 * Depends on: palette.js (FONT, BM_STROKES, BM_FILLS, BM_TEXTS)            *
 *                                                                            *
 * Single export: barModelSVG(cfg) → SVG string                              *
 *                                                                            *
 * cfg fields:                                                                *
 *   segments   — array of { value, segLabel?, braceLabel?, blank? }         *
 *   total      — number or '?' shown above/as brace                         *
 *   colorIdx   — index into BM_STROKES/FILLS/TEXTS palette                 *
 *   multi      — boolean: each segment gets its own colour                  *
 *   topBar     — boolean: total shown as a filled bar above                 *
 *   hideTotal  — boolean: suppress total display entirely                   */

function barModelSVG(cfg) {
  const { segments, total } = cfg;
  const ci     = (cfg.colorIdx ?? 0) % BM_STROKES.length;
  const FILL   = BM_FILLS[ci], STROKE = BM_STROKES[ci], TEXTC = BM_TEXTS[ci];
  const BT = 13, BA = 5, HP = 28, BH = 50;

  const hasBrace  = segments.some(sg => (sg.braceLabel ?? sg.label) != null && (sg.braceLabel ?? sg.label) !== '');
  const TOP       = cfg.topBar ? (14 + 50 + 4) : 50;
  const BOT       = hasBrace ? 50 : 20;
  const knownSum  = segments.reduce((s, sg) => s + (typeof sg.value === 'number' ? sg.value : 0), 0);
  const fullT     = typeof total === 'number' ? total : knownSum;
  const BW        = 340, SVG_W = BW + HP * 2, SVG_H = TOP + BH + BOT;
  const bx        = HP, by = TOP, tLbl = String(total);
  const sW        = segments.map(sg => {
    const v = typeof sg.value === 'number' ? sg.value : fullT - knownSum;
    return (v / fullT) * BW;
  });

  let s = `<svg viewBox="0 0 ${SVG_W} ${SVG_H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">`;

  if (cfg.topBar) {
    s += `<rect x="${bx}" y="14" width="${BW}" height="50" fill="${FILL}" stroke="${STROKE}" stroke-width="2" rx="3"/>`;
    s += `<text x="${(bx + BW / 2).toFixed(1)}" y="39" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="900" font-size="22" fill="${TEXTC}">${tLbl}</text>`;
  }

  let cx = bx;
  segments.forEach((sg, i) => {
    const sw = sW[i];
    if (sg.blank) { cx += sw; return; }
    const sCi = cfg.multi ? (ci + i * 3) % BM_STROKES.length : ci;
    const sF  = cfg.multi ? BM_FILLS[sCi]   : FILL;
    const sS  = cfg.multi ? BM_STROKES[sCi] : STROKE;
    if (cfg.multi) {
      const iF = i === 0, iL = i === segments.length - 1;
      const x = cx, y2 = by + BH, x2 = cx + sw, r = 3;
      let d;
      if      (iF && iL) d = `M${x+r},${by} H${x2-r} Q${x2},${by} ${x2},${by+r} V${y2-r} Q${x2},${y2} ${x2-r},${y2} H${x+r} Q${x},${y2} ${x},${y2-r} V${by+r} Q${x},${by} ${x+r},${by} Z`;
      else if (iF)        d = `M${x+r},${by} H${x2} V${y2} H${x+r} Q${x},${y2} ${x},${y2-r} V${by+r} Q${x},${by} ${x+r},${by} Z`;
      else if (iL)        d = `M${x},${by} H${x2-r} Q${x2},${by} ${x2},${by+r} V${y2-r} Q${x2},${y2} ${x2-r},${y2} H${x} V${by} Z`;
      else                d = `M${x},${by} H${x2} V${y2} H${x} Z`;
      s += `<path d="${d}" fill="${sF}" stroke="${sS}" stroke-width="2"/>`;
    } else {
      s += `<rect x="${cx.toFixed(1)}" y="${by}" width="${sw.toFixed(1)}" height="${BH}" fill="${sF}" stroke="${sS}" stroke-width="1"/>`;
    }
    cx += sw;
  });

  cx = bx;
  segments.forEach((sg, i) => {
    const sw  = sW[i];
    const sCi = cfg.multi ? (ci + i * 3) % BM_STROKES.length : ci;
    const sS  = cfg.multi ? BM_STROKES[sCi] : STROKE;
    const sT  = cfg.multi ? BM_TEXTS[sCi]   : TEXTC;

    if (sg.blank) {
      const bl = sg.braceLabel ?? sg.label;
      if (bl) {
        const x1 = cx, x2 = cx + sw, bY = by + BH + 5, mid = (x1 + x2) / 2;
        s += `<path d="M${x1},${bY} V${bY+BA} H${(mid-3).toFixed(1)} L${mid},${bY+BT} L${(mid+3).toFixed(1)},${bY+BA} H${x2} V${bY}" fill="none" stroke="#AAAAAA" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;
        s += `<text x="${mid}" y="${bY+BT+5}" text-anchor="middle" dominant-baseline="hanging" font-family="${FONT}" font-weight="700" font-size="15" fill="#AAAAAA">${bl}</text>`;
      }
      cx += sw; return;
    }

    if (i > 0 && !cfg.multi && !segments[i-1]?.blank)
      s += `<line x1="${cx.toFixed(1)}" y1="${by}" x2="${cx.toFixed(1)}" y2="${by+BH}" stroke="${STROKE}" stroke-width="2.5"/>`;

    const lbl = sg.segLabel;
    if (lbl) s += `<text x="${(cx + sw/2).toFixed(1)}" y="${by + BH/2}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="900" font-size="22" fill="${sT}">${lbl}</text>`;

    const bl = sg.braceLabel ?? sg.label;
    if (bl) {
      const x1 = cx, x2 = cx + sw, bY = by + BH + 5, mid = (x1 + x2) / 2;
      s += `<path d="M${x1},${bY} V${bY+BA} H${(mid-3).toFixed(1)} L${mid},${bY+BT} L${(mid+3).toFixed(1)},${bY+BA} H${x2} V${bY}" fill="none" stroke="${sS}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;
      s += `<text x="${mid}" y="${bY+BT+5}" text-anchor="middle" dominant-baseline="hanging" font-family="${FONT}" font-weight="700" font-size="15" fill="${sT}">${bl}</text>`;
    }
    cx += sw;
  });

  if (!cfg.multi) {
    let rx = bx, gS = null, gW = 0;
    segments.forEach((sg, i) => {
      const sw = sW[i];
      if (!sg.blank) { if (gS === null) { gS = rx; gW = 0; } gW += sw; }
      else           { if (gS !== null) { s += `<rect x="${gS.toFixed(1)}" y="${by}" width="${gW.toFixed(1)}" height="${BH}" fill="none" stroke="${STROKE}" stroke-width="2" rx="3"/>`; gS = null; gW = 0; } }
      rx += sw;
    });
    if (gS !== null) s += `<rect x="${gS.toFixed(1)}" y="${by}" width="${gW.toFixed(1)}" height="${BH}" fill="none" stroke="${STROKE}" stroke-width="2" rx="3"/>`;
  }

  if (!cfg.topBar && !cfg.hideTotal) {
    const tY = by - 5, tM = bx + BW / 2;
    s += `<path d="M${bx},${tY} V${tY-BA} H${(tM-3).toFixed(1)} L${tM},${tY-BT} L${(tM+3).toFixed(1)},${tY-BA} H${bx+BW} V${tY}" fill="none" stroke="#AAAAAA" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;
    s += `<text x="${tM}" y="${tY-BT-4}" text-anchor="middle" dominant-baseline="auto" font-family="${FONT}" font-weight="900" font-size="22" fill="#AAAAAA">${tLbl}</text>`;
  }

  return s + '</svg>';
}
