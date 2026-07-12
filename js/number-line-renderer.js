/* ── Number-line SVG renderer ────────────────────────────────────────────── *
 * Depends on: palette.js (FONT, LABEL_COLOR, NL_PAL)                        *
 *                                                                            *
 * Single export: numberLineSVG(cfg) → SVG string                            *
 *                                                                            *
 * cfg fields:                                                                *
 *   start, end, partitions     — line range and tick count                  *
 *   valuesGivenEvery           — label every N ticks (undefined = all)      *
 *   answer                     — shown as "?" on the line                   *
 *   lineStyle                  — 'through' | 'terminate'                    *
 *   colour                     — key into NL_PAL                            *
 *   hideFrom, hideTo           — range to blank labels                      *
 *   jumpFrom/To, jumpType      — optional arc overlay                       *
 *   jumpLabel, jumpArrow, jumpCircle, jumpColour                            *
 *   jump2From/To … jump2Colour — optional second arc                        */

function resolveNLC(k) { return NL_PAL[k] || '#AAAAAA'; }

function numberLineSVG(cfg) {
  const {
    start, end, partitions, valuesGivenEvery, answer,
    lineStyle = 'through', colour,
    hideFrom, hideTo,
    jumpFrom, jumpTo, jumpType = 'single',
    jumpLabel = '', jumpArrow = true, jumpCircle = 'none', jumpColour = 'dark',
    jump2From, jump2To, jump2Type = 'single',
    jump2Label = '', jump2Arrow = true, jump2Circle = 'none', jump2Colour = 'dark',
  } = cfg;

  const terminate = lineStyle === 'terminate';
  const C         = resolveNLC(colour);
  const BAR_W     = 380;
  const pxU       = BAR_W / (end - start);
  const lStep     = (!isNaN(valuesGivenEvery) && valuesGivenEvery > 0) ? valuesGivenEvery : null;
  const ansNum    = answer ? Math.round(parseFloat(answer) * 1000) / 1000 : null;
  const tStep     = partitions > 0 ? (end - start) / partitions : 0;
  const AS        = 7;

  let ansAbove = false;
  if (ansNum !== null && lStep !== null) {
    const rem = Math.round(((ansNum - start) % lStep) * 1e6) / 1e6;
    const onG = Math.abs(rem) < 0.001 || Math.abs(Math.abs(rem) - lStep) < 0.001;
    if (!onG) {
      const dp = rem * pxU, dn = (lStep - rem) * pxU;
      ansAbove = Math.min(dp, dn) < 20;
    }
  }
  const ansBetween = ansNum !== null && ansNum > start && ansNum < end && tStep > 0 && (() => {
    const r = Math.round(((ansNum - start) % tStep) * 1e6) / 1e6;
    return !(Math.abs(r) < 0.001 || Math.abs(Math.abs(r) - tStep) < 0.001);
  })();

  const hasJ  = jumpFrom  !== undefined && jumpTo  !== undefined && !isNaN(jumpFrom)  && !isNaN(jumpTo)  && jumpFrom  !== jumpTo;
  const hasJ2 = jump2From !== undefined && jump2To !== undefined && !isNaN(jump2From) && !isNaN(jump2To) && jump2From !== jump2To;

  let arcH = 0;
  if (hasJ)  { const sp  = Math.abs(jumpTo  - jumpFrom)  * pxU; arcH  = jumpType  === 'single' ? Math.min(sp  * 0.45, 68) : Math.min(tStep * pxU * 0.6, 32); }
  if (hasJ2) { const sp2 = Math.abs(jump2To - jump2From) * pxU; const h2 = jump2Type === 'single' ? Math.min(sp2 * 0.45, 68) : Math.min(tStep * pxU * 0.6, 32); arcH = Math.max(arcH, h2); }
  const arcPadT = (hasJ || hasJ2) ? arcH + ((jumpLabel || jump2Label) ? 26 : 10) : 0;

  const hasC   = hasJ && jumpCircle !== 'none';
  const cVal   = hasC ? (jumpCircle === 'start' ? jumpFrom : jumpTo) : null;
  const cLen   = cVal !== null ? String(Math.round(cVal)).length : 1;
  const crMin  = cLen <= 1 ? 9 : 11;
  const cr     = hasC ? Math.min(Math.max(crMin, Math.floor(pxU * 0.32)), 18) : 0;

  const EXT   = terminate ? 0 : 20;
  const PAD_L = terminate ? 22 : 8 + EXT;
  const PAD_R = terminate ? 22 : 8 + EXT;
  const PAD_T = Math.max((ansAbove || ansBetween) ? 34 : 16, arcPadT);
  const PAD_B = hasC ? Math.max(36, Math.ceil(18 + cr + 6)) : 36;
  const W     = BAR_W + PAD_L + PAD_R;
  const LY    = PAD_T;
  const TH    = 8;
  const H     = PAD_T + TH + PAD_B;
  const bx    = PAD_L;
  const v2x   = v => bx + BAR_W * (v - start) / (end - start);
  const JC1   = resolveNLC(jumpColour);
  const JC2   = resolveNLC(jump2Colour);

  const ticks = [];
  for (let i = 0; i <= partitions; i++) {
    ticks.push({ value: Math.round((start + (end - start) * i / partitions) * 1000) / 1000, x: bx + BAR_W * i / partitions });
  }

  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">`;

  if (terminate) {
    s += `<line x1="${bx}" y1="${LY}" x2="${bx + BAR_W}" y2="${LY}" stroke="${C}" stroke-width="2.5" stroke-linecap="round"/>`;
  } else {
    const lx = bx - EXT, rx = bx + BAR_W + EXT;
    s += `<line x1="${lx}" y1="${LY}" x2="${rx}" y2="${LY}" stroke="${C}" stroke-width="2.5" stroke-linecap="round"/>`;
    s += `<polygon points="${lx - AS},${LY} ${lx},${LY - AS/2} ${lx},${LY + AS/2}" fill="${C}" stroke="${C}" stroke-width="1" stroke-linejoin="round"/>`;
    s += `<polygon points="${rx + AS},${LY} ${rx},${LY - AS/2} ${rx},${LY + AS/2}" fill="${C}" stroke="${C}" stroke-width="1" stroke-linejoin="round"/>`;
  }

  let ansR = false;
  ticks.forEach(({ value, x }, i) => {
    const isE = i === 0 || i === ticks.length - 1;
    const th  = (terminate && isE) ? TH + 2 : TH;
    const isA = ansNum !== null && Math.abs(value - ansNum) < 0.001;
    if (isA) ansR = true;
    const rem  = lStep !== null ? Math.round(((value - start) % lStep) * 1e6) / 1e6 : 0;
    const onG  = lStep === null || Math.abs(rem) < 0.001 || Math.abs(Math.abs(rem) - lStep) < 0.001;
    const op   = onG ? 1 : 0.3;
    const isHid = hideFrom !== undefined && hideTo !== undefined && value >= hideFrom && value <= hideTo;
    const show  = (onG || isA) && (!isHid || isA);

    s += `<line x1="${x.toFixed(1)}" y1="${(LY - th).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(LY + th).toFixed(1)}" stroke="${C}" stroke-width="${terminate && isE ? 2.5 : 2}" stroke-linecap="round" opacity="${op}"/>`;

    if (isA && ansAbove) {
      const ty = LY - th - 5, by2 = ty - 7, aw = 3.5;
      s += `<polygon points="${x.toFixed(1)},${ty.toFixed(1)} ${(x - aw).toFixed(1)},${by2.toFixed(1)} ${(x + aw).toFixed(1)},${by2.toFixed(1)}" fill="${LABEL_COLOR}" stroke="${LABEL_COLOR}" stroke-width="1" stroke-linejoin="round"/>`;
      s += `<text x="${x.toFixed(1)}" y="${(by2 - 4).toFixed(1)}" text-anchor="middle" dominant-baseline="auto" font-family="${FONT}" font-weight="700" font-size="13" fill="${LABEL_COLOR}">?</text>`;
    } else if (show) {
      const ly = (LY + TH + 14).toFixed(1);
      const isC = cVal !== null && Math.abs(value - cVal) < 0.001;
      if (isC) {
        const cy = (parseFloat(ly) + 4).toFixed(1);
        s += `<circle cx="${x.toFixed(1)}" cy="${cy}" r="${cr}" fill="none" stroke="${JC1}" stroke-width="2"/>`;
      }
      s += `<text x="${x.toFixed(1)}" y="${ly}" text-anchor="middle" dominant-baseline="hanging" font-family="${FONT}" font-weight="700" font-size="13" fill="${LABEL_COLOR}">${isA ? '?' : String(value)}</text>`;
    }
  });

  if (ansBetween && !ansR) {
    const ax = v2x(ansNum), ty = LY - 5, by2 = ty - 8, aw = 3.5;
    s += `<polygon points="${ax.toFixed(1)},${ty.toFixed(1)} ${(ax - aw).toFixed(1)},${by2.toFixed(1)} ${(ax + aw).toFixed(1)},${by2.toFixed(1)}" fill="${LABEL_COLOR}" stroke="${LABEL_COLOR}" stroke-width="1" stroke-linejoin="round"/>`;
    s += `<text x="${ax.toFixed(1)}" y="${(by2 - 4).toFixed(1)}" text-anchor="middle" dominant-baseline="auto" font-family="${FONT}" font-weight="700" font-size="13" fill="${LABEL_COLOR}">?</text>`;
  }

  const GAP  = 3;
  const arcY = LY - TH - GAP;
  const aSize = sp => {
    const ah = Math.min(Math.max(sp * 0.2, 5), 9);
    const sw = Math.min(Math.max(sp * 0.07, 1), 2.2);
    return { ah, aw: ah * 0.65, sw };
  };

  const drawArc = (x1, x2, type, arrow, label, col, step2) => {
    if (type === 'single') {
      const sp = Math.abs(x2 - x1), { ah: AH, aw: AW, sw: SW } = aSize(sp);
      const h = Math.min(sp * 0.45, 68), aT = arcY - h, pEY = arrow ? arcY - AH + 1 : arcY;
      s += `<path d="M${x1.toFixed(1)},${arcY} C${x1.toFixed(1)},${aT} ${x2.toFixed(1)},${aT} ${x2.toFixed(1)},${pEY}" fill="none" stroke="${col}" stroke-width="${SW.toFixed(2)}" stroke-linecap="round"/>`;
      if (arrow) s += `<polygon points="${x2.toFixed(1)},${arcY} ${(x2 - AW).toFixed(1)},${(arcY - AH).toFixed(1)} ${(x2 + AW).toFixed(1)},${(arcY - AH).toFixed(1)}" fill="${col}" stroke="${col}" stroke-width="1" stroke-linejoin="round"/>`;
      if (label) s += `<text x="${((x1 + x2) / 2).toFixed(1)}" y="${(aT + h * 0.25 - 2).toFixed(1)}" text-anchor="middle" dominant-baseline="auto" font-family="${FONT}" font-weight="700" font-size="13" fill="${col}">${label}</text>`;
    } else {
      const jF = step2.from, jT = step2.to, d = jT > jF ? 1 : -1;
      const st = Math.round(Math.abs(jT - jF) / tStep);
      for (let i = 0; i < st; i++) {
        const fv = Math.round((jF + d * i * tStep) * 1000) / 1000;
        const tv = Math.round((jF + d * (i + 1) * tStep) * 1000) / 1000;
        const ax1 = v2x(fv), ax2 = v2x(tv), sp = Math.abs(ax2 - ax1);
        const { ah: AH, aw: AW, sw: SW } = aSize(sp);
        const h = Math.min(sp * 0.6, 32), aT = arcY - h, pEY = arrow ? arcY - AH + 1 : arcY;
        s += `<path d="M${ax1.toFixed(1)},${arcY} C${ax1.toFixed(1)},${aT} ${ax2.toFixed(1)},${aT} ${ax2.toFixed(1)},${pEY}" fill="none" stroke="${col}" stroke-width="${SW.toFixed(2)}" stroke-linecap="round"/>`;
        if (arrow) s += `<polygon points="${ax2.toFixed(1)},${arcY} ${(ax2 - AW).toFixed(1)},${(arcY - AH).toFixed(1)} ${(ax2 + AW).toFixed(1)},${(arcY - AH).toFixed(1)}" fill="${col}" stroke="${col}" stroke-width="1" stroke-linejoin="round"/>`;
        if (label) s += `<text x="${((ax1 + ax2) / 2).toFixed(1)}" y="${(aT + h * 0.25 - 2).toFixed(1)}" text-anchor="middle" dominant-baseline="auto" font-family="${FONT}" font-weight="700" font-size="13" fill="${col}">${label}</text>`;
      }
    }
  };

  if (hasJ2) drawArc(v2x(jump2From), v2x(jump2To), jump2Type, jump2Arrow, jump2Label, JC2, { from: jump2From, to: jump2To });
  if (hasJ)  drawArc(v2x(jumpFrom),  v2x(jumpTo),  jumpType,  jumpArrow,  jumpLabel,  JC1, { from: jumpFrom,  to: jumpTo  });

  return s + '</svg>';
}
