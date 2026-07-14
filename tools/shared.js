// ─── CENTURY Maths Tools — Shared Rendering Module ────────────────────────────
// Used by: number-line-creator.html, bar-model-creator.html, maths-assessment-builder.html
// Do not duplicate these functions in the individual tools.

// ─── Shared font stack ────────────────────────────────────────────────────────
const SHARED_FONT = "'Proxima Soft','Nunito','Arial Rounded MT Bold',sans-serif";

// ─── Number line palette ──────────────────────────────────────────────────────
const NL_PALETTE = {
  dark:   '#1A1A2E',
  grey:   '#AAAAAA',
  red:    '#D46B55',
  orange: '#F5995B',
  yellow: '#FECC6B',
  green:  '#319377',
  blue:   '#7898F0',
  purple: '#847AC9',
  pink:   '#FC7E91',
};
const NL_JUMP_PALETTE_NAMES = ['dark','red','orange','yellow','green','blue','purple','pink'];
const NL_DEFAULT_LINE_COLOR = '#AAAAAA';
const NL_LABEL_COLOR        = '#1A1A2E';
const NL_ARROW_SIZE         = 7;

function resolveNLColour(raw) {
  if (!raw) return NL_DEFAULT_LINE_COLOR;
  const key = raw.trim().toLowerCase();
  if (NL_PALETTE[key]) return NL_PALETTE[key];
  if (/^#[0-9a-f]{3,6}$/i.test(raw.trim())) return raw.trim();
  return NL_DEFAULT_LINE_COLOR;
}

// ─── Bar model palette ────────────────────────────────────────────────────────
const BM_BOX_COLORS      = ['#D46B55','#F5995B','#FECC6B','#319377','#7898F0','#847AC9','#FC7E91'];
const BM_BAR_LIGHT_FILLS = ['#F9DDD9','#FDE8D4','#FEF5D8','#CDE8E1','#DCE4FD','#DDD9F5','#FEDDEA'];
// Darker hue-matched text colours — all pass WCAG AA 4.5:1 on corresponding BM_BAR_LIGHT_FILLS
const BM_BOX_TEXT_COLORS = ['#7A2E1E','#903F08','#976401','#246E59','#0F2F89','#342C6C','#950319'];

// ─── numberLineSVG ────────────────────────────────────────────────────────────
function numberLineSVG(config) {
  const {
    start, end, partitions, valuesGivenEvery, answer,
    lineStyle = 'through', colour,
    hideFrom, hideTo,
    // Optional jump overlay
    jumpFrom, jumpTo, jumpType = 'single',
    jumpLabel = '', jumpArrow = true, jumpCircle = 'none', jumpColour = 'dark',
    // Optional second jump
    jump2From, jump2To, jump2Type = 'single',
    jump2Label = '', jump2Arrow = true, jump2Circle = 'none', jump2Colour = 'dark',
  } = config;

  const FONT        = SHARED_FONT;
  const LABEL_COLOR = NL_LABEL_COLOR;
  const ARROW_SIZE  = NL_ARROW_SIZE;

  const terminate  = lineStyle === 'terminate';
  const C          = resolveNLColour(colour);
  const BAR_W      = 380;
  const pxPerUnit  = BAR_W / (end - start);
  const labelStep  = (!isNaN(valuesGivenEvery) && valuesGivenEvery > 0) ? valuesGivenEvery : null;
  const answerNum  = answer ? Math.round(parseFloat(answer) * 1000) / 1000 : null;
  const tickStep   = partitions > 0 ? (end - start) / partitions : 0;

  // Answer float-above logic
  let answerAbove = false;
  if (answerNum !== null && labelStep !== null) {
    const rem = Math.round(((answerNum - start) % labelStep) * 1e6) / 1e6;
    const onGrid = Math.abs(rem) < 0.001 || Math.abs(Math.abs(rem) - labelStep) < 0.001;
    if (!onGrid) {
      const distToPrev = rem * pxPerUnit;
      const distToNext = (labelStep - rem) * pxPerUnit;
      answerAbove = Math.min(distToPrev, distToNext) < 20;
    }
  }
  const answerBetweenTicks = answerNum !== null && answerNum > start && answerNum < end && tickStep > 0 && (() => {
    const rem = Math.round(((answerNum - start) % tickStep) * 1e6) / 1e6;
    return !(Math.abs(rem) < 0.001 || Math.abs(Math.abs(rem) - tickStep) < 0.001);
  })();

  // Pre-compute arc height so PAD_T can accommodate jumps
  const hasJump = jumpFrom !== undefined && jumpTo !== undefined &&
                  !isNaN(jumpFrom) && !isNaN(jumpTo) && jumpFrom !== jumpTo;
  const hasJump2 = jump2From !== undefined && jump2To !== undefined &&
                   !isNaN(jump2From) && !isNaN(jump2To) && jump2From !== jump2To;
  let arcH = 0;
  if (hasJump) {
    const spanPx = Math.abs(jumpTo - jumpFrom) * pxPerUnit;
    arcH = jumpType === 'single'
      ? Math.min(spanPx * 0.45, 68)
      : Math.min(tickStep * pxPerUnit * 0.6, 32);
  }
  if (hasJump2) {
    const spanPx2 = Math.abs(jump2To - jump2From) * pxPerUnit;
    const arcH2 = jump2Type === 'single'
      ? Math.min(spanPx2 * 0.45, 68)
      : Math.min(tickStep * pxPerUnit * 0.6, 32);
    arcH = Math.max(arcH, arcH2);
  }
  const arcPadT = (hasJump || hasJump2) ? arcH + ((jumpLabel || jump2Label) ? 26 : 10) : 0;

  // Pre-compute circleVal and radius so PAD_B can be sized correctly
  const hasCircle = hasJump && jumpCircle !== 'none';
  const circleVal = hasCircle ? (jumpCircle === 'start' ? jumpFrom : jumpTo) : null;
  const circleLblLen = circleVal !== null ? String(Math.round(circleVal)).length : 1;
  const crMin = circleLblLen <= 1 ? 9 : 11;
  const cr = hasCircle ? Math.min(Math.max(crMin, Math.floor(pxPerUnit * 0.32)), 18) : 0;

  const EXTEND    = terminate ? 0 : 20;
  const PAD_L     = terminate ? 22 : 8 + EXTEND;
  const PAD_R     = terminate ? 22 : 8 + EXTEND;
  const PAD_T     = Math.max((answerAbove || answerBetweenTicks) ? 34 : 16, arcPadT);
  const PAD_B     = hasCircle ? Math.max(36, Math.ceil(18 + cr + 6)) : 36;
  const SVG_W     = BAR_W + PAD_L + PAD_R;
  const LINE_Y    = PAD_T;
  const TICK_HALF = 8;
  const SVG_H     = PAD_T + TICK_HALF + PAD_B;
  const bx        = PAD_L;
  const ex        = PAD_L + BAR_W;
  const valToX    = v => bx + BAR_W * (v - start) / (end - start);

  const JC1 = resolveNLColour(jumpColour);
  const JC2 = resolveNLColour(jump2Colour);

  // Tick positions
  const ticks = [];
  for (let i = 0; i <= partitions; i++) {
    const value = start + (end - start) * i / partitions;
    ticks.push({ value: Math.round(value * 1000) / 1000, x: bx + BAR_W * i / partitions });
  }

  let s = `<svg viewBox="0 0 ${SVG_W} ${SVG_H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">`;

  // ── Line ──
  if (terminate) {
    s += `<line x1="${bx}" y1="${LINE_Y}" x2="${ex}" y2="${LINE_Y}" stroke="${C}" stroke-width="2.5" stroke-linecap="round"/>`;
  } else {
    const lx = bx - EXTEND, rx = ex + EXTEND;
    s += `<line x1="${lx}" y1="${LINE_Y}" x2="${rx}" y2="${LINE_Y}" stroke="${C}" stroke-width="2.5" stroke-linecap="round"/>`;
    s += `<polygon points="${lx - ARROW_SIZE},${LINE_Y} ${lx},${LINE_Y - ARROW_SIZE / 2} ${lx},${LINE_Y + ARROW_SIZE / 2}" fill="${C}" stroke="${C}" stroke-width="1" stroke-linejoin="round"/>`;
    s += `<polygon points="${rx + ARROW_SIZE},${LINE_Y} ${rx},${LINE_Y - ARROW_SIZE / 2} ${rx},${LINE_Y + ARROW_SIZE / 2}" fill="${C}" stroke="${C}" stroke-width="1" stroke-linejoin="round"/>`;
  }

  // ── Ticks and labels ──
  let answerRendered = false;
  ticks.forEach(({ value, x }, i) => {
    const isEndpoint = i === 0 || i === ticks.length - 1;
    const th         = (terminate && isEndpoint) ? TICK_HALF + 2 : TICK_HALF;
    const isAnswer   = answerNum !== null && Math.abs(value - answerNum) < 0.001;
    if (isAnswer) answerRendered = true;
    const rem    = labelStep !== null ? Math.round(((value - start) % labelStep) * 1e6) / 1e6 : 0;
    const onGrid = labelStep === null || Math.abs(rem) < 0.001 || Math.abs(Math.abs(rem) - labelStep) < 0.001;
    const opacity = onGrid ? 1 : 0.3;
    const hasHideRange  = hideFrom !== undefined && hideTo !== undefined;
    const isHiddenValue = hasHideRange && value >= hideFrom && value <= hideTo;
    const show    = (onGrid || isAnswer) && (!isHiddenValue || isAnswer);

    s += `<line x1="${x.toFixed(1)}" y1="${(LINE_Y - th).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(LINE_Y + th).toFixed(1)}" stroke="${C}" stroke-width="${terminate && isEndpoint ? 2.5 : 2}" stroke-linecap="round" opacity="${opacity}"/>`;

    if (isAnswer && answerAbove) {
      const arrowTipY  = LINE_Y - th - 5;
      const arrowBaseY = arrowTipY - 7;
      const AW = 3.5;
      s += `<polygon points="${x.toFixed(1)},${arrowTipY.toFixed(1)} ${(x-AW).toFixed(1)},${arrowBaseY.toFixed(1)} ${(x+AW).toFixed(1)},${arrowBaseY.toFixed(1)}" fill="${LABEL_COLOR}" stroke="${LABEL_COLOR}" stroke-width="1" stroke-linejoin="round"/>`;
      s += `<text x="${x.toFixed(1)}" y="${(arrowBaseY-4).toFixed(1)}" text-anchor="middle" dominant-baseline="auto" font-family="${FONT}" font-weight="700" font-size="13" fill="${LABEL_COLOR}">?</text>`;
    } else if (show) {
      const lbl = isAnswer ? '?' : String(value);
      const ly  = (LINE_Y + TICK_HALF + 14).toFixed(1);
      const isCircled = circleVal !== null && Math.abs(value - circleVal) < 0.001;
      if (isCircled) {
        const circleCy = (parseFloat(ly) + 4).toFixed(1);
        s += `<circle cx="${x.toFixed(1)}" cy="${circleCy}" r="${cr}" fill="none" stroke="${JC1}" stroke-width="2"/>`;
      }
      s += `<text x="${x.toFixed(1)}" y="${ly}" text-anchor="middle" dominant-baseline="hanging" font-family="${FONT}" font-weight="700" font-size="13" fill="${LABEL_COLOR}">${lbl}</text>`;
    }
  });

  // Between-ticks answer marker
  if (answerBetweenTicks && !answerRendered) {
    const ax         = bx + BAR_W * (answerNum - start) / (end - start);
    const arrowTipY  = LINE_Y - 5;
    const arrowBaseY = arrowTipY - 8;
    const AW = 3.5;
    s += `<polygon points="${ax.toFixed(1)},${arrowTipY.toFixed(1)} ${(ax-AW).toFixed(1)},${arrowBaseY.toFixed(1)} ${(ax+AW).toFixed(1)},${arrowBaseY.toFixed(1)}" fill="${LABEL_COLOR}" stroke="${LABEL_COLOR}" stroke-width="1" stroke-linejoin="round"/>`;
    s += `<text x="${ax.toFixed(1)}" y="${(arrowBaseY-4).toFixed(1)}" text-anchor="middle" dominant-baseline="auto" font-family="${FONT}" font-weight="700" font-size="13" fill="${LABEL_COLOR}">?</text>`;
  }

  // ── Jump arcs (shared setup) ──
  const GAP  = 3;
  const arcY = LINE_Y - TICK_HALF - GAP;

  const arrowSize = span => {
    const ah = Math.min(Math.max(span * 0.2, 5), 9);
    const sw = Math.min(Math.max(span * 0.07, 1), 2.2);
    return { ah, aw: ah * 0.65, sw };
  };

  // ── Jump 2 arcs (rendered first = behind jump 1) ──
  if (hasJump2) {
    const x1 = valToX(jump2From);
    const x2 = valToX(jump2To);

    if (jump2Type === 'single') {
      const span     = Math.abs(x2 - x1);
      const { ah: AH, aw: AW, sw: SW } = arrowSize(span);
      const h        = Math.min(span * 0.45, 68);
      const arcTop   = arcY - h;
      const pathEndY = jump2Arrow ? arcY - AH + 1 : arcY;
      s += `<path d="M${x1.toFixed(1)},${arcY} C${x1.toFixed(1)},${arcTop} ${x2.toFixed(1)},${arcTop} ${x2.toFixed(1)},${pathEndY}" fill="none" stroke="${JC2}" stroke-width="${SW.toFixed(2)}" stroke-linecap="round"/>`;
      if (jump2Arrow) {
        s += `<polygon points="${x2.toFixed(1)},${arcY} ${(x2-AW).toFixed(1)},${(arcY-AH).toFixed(1)} ${(x2+AW).toFixed(1)},${(arcY-AH).toFixed(1)}" fill="${JC2}" stroke="${JC2}" stroke-width="1" stroke-linejoin="round"/>`;
      }
      if (jump2Label) {
        s += `<text x="${((x1+x2)/2).toFixed(1)}" y="${(arcTop + h * 0.25 - 2).toFixed(1)}" text-anchor="middle" dominant-baseline="auto" font-family="${FONT}" font-weight="700" font-size="13" fill="${JC2}">${jump2Label}</text>`;
      }
    } else {
      const direction2 = jump2To > jump2From ? 1 : -1;
      const steps2     = Math.round(Math.abs(jump2To - jump2From) / tickStep);
      for (let i = 0; i < steps2; i++) {
        const fv   = Math.round((jump2From + direction2 * i * tickStep) * 1000) / 1000;
        const tv   = Math.round((jump2From + direction2 * (i + 1) * tickStep) * 1000) / 1000;
        const ax1  = valToX(fv), ax2 = valToX(tv);
        const span = Math.abs(ax2 - ax1);
        const { ah: AH, aw: AW, sw: SW } = arrowSize(span);
        const h        = Math.min(span * 0.6, 32);
        const arcTop   = arcY - h;
        const pathEndY = jump2Arrow ? arcY - AH + 1 : arcY;
        s += `<path d="M${ax1.toFixed(1)},${arcY} C${ax1.toFixed(1)},${arcTop} ${ax2.toFixed(1)},${arcTop} ${ax2.toFixed(1)},${pathEndY}" fill="none" stroke="${JC2}" stroke-width="${SW.toFixed(2)}" stroke-linecap="round"/>`;
        if (jump2Arrow) {
          s += `<polygon points="${ax2.toFixed(1)},${arcY} ${(ax2-AW).toFixed(1)},${(arcY-AH).toFixed(1)} ${(ax2+AW).toFixed(1)},${(arcY-AH).toFixed(1)}" fill="${JC2}" stroke="${JC2}" stroke-width="1" stroke-linejoin="round"/>`;
        }
        if (jump2Label) {
          s += `<text x="${((ax1+ax2)/2).toFixed(1)}" y="${(arcTop + h * 0.25 - 2).toFixed(1)}" text-anchor="middle" dominant-baseline="auto" font-family="${FONT}" font-weight="700" font-size="13" fill="${JC2}">${jump2Label}</text>`;
        }
      }
    }

    // Circle for jump 2
    if (jump2Circle !== 'none') {
      const circleVal2 = jump2Circle === 'start' ? jump2From : jump2To;
      const cx2 = valToX(circleVal2);
      const lbl2 = String(circleVal2);
      const cr2 = Math.min(Math.max(lbl2.length <= 1 ? 9 : 11, Math.floor(pxPerUnit * 0.32)), 18);
      const ly2 = (LINE_Y + TICK_HALF + 14).toFixed(1);
      const circleCy2 = (parseFloat(ly2) + 4).toFixed(1);
      s += `<circle cx="${cx2.toFixed(1)}" cy="${circleCy2}" r="${cr2}" fill="none" stroke="${JC2}" stroke-width="2"/>`;
      s += `<text x="${cx2.toFixed(1)}" y="${ly2}" text-anchor="middle" dominant-baseline="hanging" font-family="${FONT}" font-weight="700" font-size="13" fill="${JC2}">${lbl2}</text>`;
    }
  }

  // ── Jump 1 arcs (rendered second = on top of jump 2) ──
  if (hasJump) {
    const x1 = valToX(jumpFrom);
    const x2 = valToX(jumpTo);
    if (jumpType === 'single') {
      const span     = Math.abs(x2 - x1);
      const { ah: AH, aw: AW, sw: SW } = arrowSize(span);
      const h        = Math.min(span * 0.45, 68);
      const arcTop   = arcY - h;
      const pathEndY = jumpArrow ? arcY - AH + 1 : arcY;
      s += `<path d="M${x1.toFixed(1)},${arcY} C${x1.toFixed(1)},${arcTop} ${x2.toFixed(1)},${arcTop} ${x2.toFixed(1)},${pathEndY}" fill="none" stroke="${JC1}" stroke-width="${SW.toFixed(2)}" stroke-linecap="round"/>`;
      if (jumpArrow) {
        s += `<polygon points="${x2.toFixed(1)},${arcY} ${(x2-AW).toFixed(1)},${(arcY-AH).toFixed(1)} ${(x2+AW).toFixed(1)},${(arcY-AH).toFixed(1)}" fill="${JC1}" stroke="${JC1}" stroke-width="1" stroke-linejoin="round"/>`;
      }
      if (jumpLabel) {
        s += `<text x="${((x1+x2)/2).toFixed(1)}" y="${(arcTop + h * 0.25 - 2).toFixed(1)}" text-anchor="middle" dominant-baseline="auto" font-family="${FONT}" font-weight="700" font-size="13" fill="${JC1}">${jumpLabel}</text>`;
      }
    } else {
      const direction = jumpTo > jumpFrom ? 1 : -1;
      const steps     = Math.round(Math.abs(jumpTo - jumpFrom) / tickStep);
      for (let i = 0; i < steps; i++) {
        const fv   = Math.round((jumpFrom + direction * i * tickStep) * 1000) / 1000;
        const tv   = Math.round((jumpFrom + direction * (i + 1) * tickStep) * 1000) / 1000;
        const ax1  = valToX(fv), ax2 = valToX(tv);
        const span = Math.abs(ax2 - ax1);
        const { ah: AH, aw: AW, sw: SW } = arrowSize(span);
        const h        = Math.min(span * 0.6, 32);
        const arcTop   = arcY - h;
        const pathEndY = jumpArrow ? arcY - AH + 1 : arcY;
        s += `<path d="M${ax1.toFixed(1)},${arcY} C${ax1.toFixed(1)},${arcTop} ${ax2.toFixed(1)},${arcTop} ${ax2.toFixed(1)},${pathEndY}" fill="none" stroke="${JC1}" stroke-width="${SW.toFixed(2)}" stroke-linecap="round"/>`;
        if (jumpArrow) {
          s += `<polygon points="${ax2.toFixed(1)},${arcY} ${(ax2-AW).toFixed(1)},${(arcY-AH).toFixed(1)} ${(ax2+AW).toFixed(1)},${(arcY-AH).toFixed(1)}" fill="${JC1}" stroke="${JC1}" stroke-width="1" stroke-linejoin="round"/>`;
        }
        if (jumpLabel) {
          s += `<text x="${((ax1+ax2)/2).toFixed(1)}" y="${(arcTop + h * 0.25 - 2).toFixed(1)}" text-anchor="middle" dominant-baseline="auto" font-family="${FONT}" font-weight="700" font-size="13" fill="${JC1}">${jumpLabel}</text>`;
        }
      }
    }
  }

  s += `</svg>`;
  return s;
}

// ─── barModelSVG ──────────────────────────────────────────────────────────────
function barModelSVG(config) {
  const FONT = SHARED_FONT;
  const { segments, total } = config;
  const globalDivided = !!config.divided;
  const ci = (config.colorIdx ?? 0) % BM_BOX_COLORS.length;
  const FILL = BM_BAR_LIGHT_FILLS[ci], STROKE = BM_BOX_COLORS[ci], TEXT_COLOR = BM_BOX_TEXT_COLORS[ci];
  const BRACE_TIP = 13, BRACE_ARM = 5, H_PAD = 28;
  const BAR_H = 50;
  const TOP_BAR_H = BAR_H, TOP_BAR_GAP = 4;
  const hasBrace = segments.some(sg => (sg.braceLabel ?? sg.label) != null && (sg.braceLabel ?? sg.label) !== '');
  const TOP_PAD = config.topBar ? (14 + TOP_BAR_H + TOP_BAR_GAP) : 50;
  const BOT_PAD = hasBrace ? 50 : 20;
  const knownSum = segments.reduce((s, sg) => s + (typeof sg.value === 'number' ? sg.value : 0), 0);
  const fullTotal = typeof total === 'number' ? total : knownSum;
  const getDivs = sg => sg.divisions ?? (globalDivided && typeof sg.value === 'number' ? sg.value : 1);
  const BAR_W = 340, SVG_W = BAR_W + H_PAD * 2, SVG_H = TOP_PAD + BAR_H + BOT_PAD;
  const bx = H_PAD, by = TOP_PAD;
  const totalLbl = String(total);
  const segWidths = segments.map(sg => {
    const v = typeof sg.value === 'number' ? sg.value : fullTotal - knownSum;
    return (v / fullTotal) * BAR_W;
  });

  const clipId = `bm-clip-${Math.random().toString(36).slice(2,8)}`;
  let s = `<svg viewBox="0 0 ${SVG_W} ${SVG_H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">`;
  s += `<defs><clipPath id="${clipId}"><rect x="${bx}" y="${by}" width="${BAR_W}" height="${BAR_H}" rx="3"/></clipPath></defs>`;

  // Top bar — comparison bar model
  if (config.topBar) {
    const tbY = 14;
    s += `<rect x="${bx}" y="${tbY}" width="${BAR_W}" height="${TOP_BAR_H}" fill="${FILL}" stroke="${STROKE}" stroke-width="2" rx="3"/>`;
    s += `<text x="${(bx + BAR_W / 2).toFixed(1)}" y="${tbY + TOP_BAR_H / 2}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="900" font-size="22" fill="${TEXT_COLOR}">${totalLbl}</text>`;
  }

  // Pass 1: fills + borders
  let cx = bx;
  segments.forEach((sg, i) => {
    const sw = segWidths[i], divs = getDivs(sg);
    const segCi = config.multi ? (config.topBar ? (ci + 1 + i * 2) : (ci + i * 3)) % BM_BOX_COLORS.length : ci;
    const segFill   = config.multi ? BM_BAR_LIGHT_FILLS[segCi] : FILL;
    const segStroke = config.multi ? BM_BOX_COLORS[segCi]      : STROKE;

    if (sg.blank) { cx += sw; return; }

    if (divs > 1) {
      const divW = sw / divs;
      s += `<g clip-path="url(#${clipId})">`;
      for (let d = 0; d < divs; d++) {
        s += `<rect x="${(cx + d * divW).toFixed(1)}" y="${by}" width="${divW.toFixed(1)}" height="${BAR_H}" fill="${segFill}" stroke="${segStroke}" stroke-width="1"/>`;
      }
      s += `</g>`;
      if (config.multi) {
        const isFirst = i === 0, isLast = i === segments.length - 1;
        const r = 3, sx = cx, sy2 = by + BAR_H, sx2 = cx + sw;
        let pd;
        if (isFirst && isLast) pd = `M${sx+r},${by} H${sx2-r} Q${sx2},${by} ${sx2},${by+r} V${sy2-r} Q${sx2},${sy2} ${sx2-r},${sy2} H${sx+r} Q${sx},${sy2} ${sx},${sy2-r} V${by+r} Q${sx},${by} ${sx+r},${by} Z`;
        else if (isFirst)      pd = `M${sx+r},${by} H${sx2} V${sy2} H${sx+r} Q${sx},${sy2} ${sx},${sy2-r} V${by+r} Q${sx},${by} ${sx+r},${by} Z`;
        else if (isLast)       pd = `M${sx},${by} H${sx2-r} Q${sx2},${by} ${sx2},${by+r} V${sy2-r} Q${sx2},${sy2} ${sx2-r},${sy2} H${sx} V${by} Z`;
        else                   pd = `M${sx},${by} H${sx2} V${sy2} H${sx} Z`;
        s += `<path d="${pd}" fill="none" stroke="${segStroke}" stroke-width="2"/>`;
      }
    } else if (config.multi) {
      const isFirst = i === 0, isLast = i === segments.length - 1;
      const r = 3, x = cx, y2 = by + BAR_H, x2 = cx + sw;
      let d;
      if (isFirst && isLast) d = `M${x+r},${by} H${x2-r} Q${x2},${by} ${x2},${by+r} V${y2-r} Q${x2},${y2} ${x2-r},${y2} H${x+r} Q${x},${y2} ${x},${y2-r} V${by+r} Q${x},${by} ${x+r},${by} Z`;
      else if (isFirst)      d = `M${x+r},${by} H${x2} V${y2} H${x+r} Q${x},${y2} ${x},${y2-r} V${by+r} Q${x},${by} ${x+r},${by} Z`;
      else if (isLast)       d = `M${x},${by} H${x2-r} Q${x2},${by} ${x2},${by+r} V${y2-r} Q${x2},${y2} ${x2-r},${y2} H${x} V${by} Z`;
      else                   d = `M${x},${by} H${x2} V${y2} H${x} Z`;
      s += `<path d="${d}" fill="${segFill}" stroke="${segStroke}" stroke-width="2"/>`;
    } else {
      s += `<rect x="${cx.toFixed(1)}" y="${by}" width="${sw.toFixed(1)}" height="${BAR_H}" fill="${segFill}" stroke="${segStroke}" stroke-width="1"/>`;
    }
    cx += sw;
  });

  // Pass 2: dividers, labels, braces
  cx = bx;
  segments.forEach((sg, i) => {
    const sw = segWidths[i], divs = getDivs(sg);
    const segCi        = config.multi ? (config.topBar ? (ci + 1 + i * 2) : (ci + i * 3)) % BM_BOX_COLORS.length : ci;
    const segStroke    = config.multi ? BM_BOX_COLORS[segCi]      : STROKE;
    const segTextColor = config.multi ? BM_BOX_TEXT_COLORS[segCi] : TEXT_COLOR;

    if (sg.blank) {
      const bl = sg.braceLabel ?? sg.label;
      if (bl != null && bl !== '') {
        const x1 = cx, x2 = cx + sw, bY = by + BAR_H + 5, mid = (x1 + x2) / 2;
        s += `<path d="M${x1},${bY} V${bY + BRACE_ARM} H${(mid - 3).toFixed(1)} L${mid},${bY + BRACE_TIP} L${(mid + 3).toFixed(1)},${bY + BRACE_ARM} H${x2} V${bY}" fill="none" stroke="#AAAAAA" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;
        s += `<text x="${mid}" y="${bY + BRACE_TIP + 5}" text-anchor="middle" dominant-baseline="hanging" font-family="${FONT}" font-weight="700" font-size="15" fill="#AAAAAA">${bl}</text>`;
      }
      cx += sw; return;
    }

    if (i > 0 && !config.multi && !segments[i - 1]?.blank) {
      s += `<line x1="${cx.toFixed(1)}" y1="${by}" x2="${cx.toFixed(1)}" y2="${by + BAR_H}" stroke="${STROKE}" stroke-width="2.5"/>`;
    }

    if (divs > 1) {
      const divW = sw / divs;
      for (let d = 1; d < divs; d++) {
        s += `<line x1="${(cx + d * divW).toFixed(1)}" y1="${by}" x2="${(cx + d * divW).toFixed(1)}" y2="${by + BAR_H}" stroke="${segStroke}" stroke-width="1"/>`;
      }
      const dl = sg.divLabel;
      if (dl != null && dl !== '') {
        const fs = Math.min(22, Math.max(10, Math.round(divW * 0.55)));
        for (let d = 0; d < divs; d++) {
          s += `<text x="${(cx + (d + 0.5) * divW).toFixed(1)}" y="${by + BAR_H / 2}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="900" font-size="${fs}" fill="${segTextColor}">${dl}</text>`;
        }
      }
    } else {
      const lbl = sg.segLabel;
      if (lbl != null && lbl !== '') {
        s += `<text x="${(cx + sw / 2).toFixed(1)}" y="${by + BAR_H / 2}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="900" font-size="22" fill="${segTextColor}">${lbl}</text>`;
      }
    }

    const bl = sg.braceLabel ?? sg.label;
    if (bl != null && bl !== '') {
      const x1 = cx, x2 = cx + sw, bY = by + BAR_H + 5, mid = (x1 + x2) / 2;
      s += `<path d="M${x1},${bY} V${bY + BRACE_ARM} H${(mid - 3).toFixed(1)} L${mid},${bY + BRACE_TIP} L${(mid + 3).toFixed(1)},${bY + BRACE_ARM} H${x2} V${bY}" fill="none" stroke="${segStroke}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;
      s += `<text x="${mid}" y="${bY + BRACE_TIP + 5}" text-anchor="middle" dominant-baseline="hanging" font-family="${FONT}" font-weight="700" font-size="15" fill="${segTextColor}">${bl}</text>`;
    }
    cx += sw;
  });

  // Overall bar outline
  if (!config.multi) {
    let rx = bx, groupStart = null, groupW = 0;
    segments.forEach((sg, i) => {
      const sw = segWidths[i];
      if (!sg.blank) {
        if (groupStart === null) { groupStart = rx; groupW = 0; }
        groupW += sw;
      } else {
        if (groupStart !== null) {
          s += `<rect x="${groupStart.toFixed(1)}" y="${by}" width="${groupW.toFixed(1)}" height="${BAR_H}" fill="none" stroke="${STROKE}" stroke-width="2" rx="3"/>`;
          groupStart = null; groupW = 0;
        }
      }
      rx += sw;
    });
    if (groupStart !== null) {
      s += `<rect x="${groupStart.toFixed(1)}" y="${by}" width="${groupW.toFixed(1)}" height="${BAR_H}" fill="none" stroke="${STROKE}" stroke-width="2" rx="3"/>`;
    }
  }

  // Top brace + total
  if (!config.topBar && !config.hideTotal) {
    const tY = by - 5, tMid = bx + BAR_W / 2;
    s += `<path d="M${bx},${tY} V${tY - BRACE_ARM} H${(tMid - 3).toFixed(1)} L${tMid},${tY - BRACE_TIP} L${(tMid + 3).toFixed(1)},${tY - BRACE_ARM} H${bx + BAR_W} V${tY}" fill="none" stroke="#AAAAAA" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;
    s += `<text x="${tMid}" y="${tY - BRACE_TIP - 4}" text-anchor="middle" dominant-baseline="auto" font-family="${FONT}" font-weight="900" font-size="22" fill="#AAAAAA">${totalLbl}</text>`;
  }
  s += `</svg>`;
  return s;
}

// ─── Number Track ─────────────────────────────────────────────────────────────
function numberTrackSVG(cfg) {
  const { sequence, shape = 'square', layout = 'straight', colourMode = 'full' } = cfg;
  if (!sequence) return '';
  const tokens = sequence.split(',').map(s => s.trim()).filter(s => s !== '');
  if (!tokens.length) return '';

  const CELL = 68, GAP = 7, PAD = 14;
  const NT_PAL = [
    { full:'#D46B55', light:'#F9DDD9', border:'#D46B55', textFull:'#1A1A2E', textLight:'#7A2E1E', textOutline:'#D46B55' },
    { full:'#F5995B', light:'#FDE8D4', border:'#F5995B', textFull:'#1A1A2E', textLight:'#903F08', textOutline:'#C06010' },
    { full:'#FECC6B', light:'#FEF5D8', border:'#FECC6B', textFull:'#1A1A2E', textLight:'#976401', textOutline:'#976401' },
    { full:'#319377', light:'#CDE8E1', border:'#319377', textFull:'#1A1A2E', textLight:'#246E59', textOutline:'#246E59' },
    { full:'#7898F0', light:'#DCE4FD', border:'#7898F0', textFull:'#1A1A2E', textLight:'#0F2F89', textOutline:'#3B4FD4' },
    { full:'#847AC9', light:'#DDD9F5', border:'#847AC9', textFull:'#1A1A2E', textLight:'#342C6C', textOutline:'#342C6C' },
    { full:'#FC7E91', light:'#FDE0E6', border:'#FC7E91', textFull:'#1A1A2E', textLight:'#7A0C26', textOutline:'#B03050' },
  ];

  function ntEsc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function cellFill(idx) {
    const p = NT_PAL[idx % NT_PAL.length];
    if (colourMode === 'full')    return { fill: p.full,   stroke: p.full,   strokeW: 0,          text: p.textFull };
    if (colourMode === 'light')   return { fill: p.light,  stroke: p.border, strokeW: CELL*0.055, text: p.textLight };
    if (colourMode === 'outline') return { fill: '#ffffff', stroke: p.border, strokeW: CELL*0.07,  text: p.textOutline };
  }

  function drawShape(sh, cx, cy, size, fill, stroke, strokeW, dashArray) {
    const h = size / 2;
    const sf = `fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"${dashArray ? ` stroke-dasharray="${dashArray}"` : ''}`;
    if (sh === 'square')
      return `<rect x="${cx-h}" y="${cy-h}" width="${size}" height="${size}" rx="${size*0.18}" ${sf}/>`;
    if (sh === 'circle')
      return `<circle cx="${cx}" cy="${cy}" r="${h}" ${sf}/>`;
    if (sh === 'balloon') {
      const sc = h / 50;
      const t = (x, y) => `${(cx + x*sc).toFixed(2)},${(cy + y*sc).toFixed(2)}`;
      const d = `M ${t(2.4938,38.8859)} L ${t(7.0728,50)} L ${t(-7.0725,50)} L ${t(-2.4938,38.8859)} C ${t(-16.3083,35.6907)} ${t(-38.1513,7.9808)} ${t(-38.1513,-11.8487)} C ${t(-38.1513,-32.9188)} ${t(-21.0701,-50)} ${t(0,-50)} C ${t(21.0701,-50)} ${t(38.1513,-32.9188)} ${t(38.1513,-11.8487)} C ${t(38.1513,7.9808)} ${t(16.3083,35.6907)} ${t(2.4938,38.8859)} Z`;
      return `<path d="${d}" ${sf}/>`;
    }
    if (sh === 'star') {
      const sc = h / 50;
      const t = (x, y) => `${(cx + x*sc).toFixed(2)},${(cy + y*sc).toFixed(2)}`;
      const d = `M ${t(49.073,-11.9)} C ${t(48.146,-14.752)} ${t(45.487,-16.684)} ${t(42.487,-16.684)} L ${t(15.061,-16.684)} L ${t(6.586,-42.768)} C ${t(5.659,-45.621)} ${t(3,-47.553)} ${t(0,-47.553)} C ${t(-3,-47.553)} ${t(-5.659,-45.621)} ${t(-6.586,-42.768)} L ${t(-15.061,-16.684)} L ${t(-42.487,-16.684)} C ${t(-45.487,-16.684)} ${t(-48.146,-14.752)} ${t(-49.073,-11.9)} C ${t(-50,-9.046)} ${t(-48.985,-5.92)} ${t(-46.557,-4.157)} L ${t(-24.369,11.963)} L ${t(-32.844,38.047)} C ${t(-33.771,40.9)} ${t(-32.756,44.026)} ${t(-30.329,45.789)} C ${t(-27.902,47.552)} ${t(-24.615,47.553)} ${t(-22.188,45.789)} L ${t(0,29.669)} L ${t(22.188,45.789)} C ${t(23.402,46.671)} ${t(24.83,47.112)} ${t(26.259,47.112)} C ${t(27.687,47.112)} ${t(29.115,46.671)} ${t(30.329,45.789)} C ${t(32.756,44.026)} ${t(33.771,40.9)} ${t(32.845,38.047)} L ${t(24.37,11.963)} L ${t(46.557,-4.157)} C ${t(48.985,-5.92)} ${t(50,-9.046)} ${t(49.073,-11.9)} Z`;
      return `<path d="${d}" ${sf}/>`;
    }
    if (sh === 'cloud') {
      const sc = size / 195;
      const t = (x, y) => `${(cx + (x-100)*sc).toFixed(2)},${(cy + (y-68)*sc).toFixed(2)}`;
      const d = `M ${t(175.74,63.49)} C ${t(175.75,63.18)} ${t(175.76,62.86)} ${t(175.76,62.55)} C ${t(175.76,46.8)} ${t(163,34.03)} ${t(147.25,34.03)} C ${t(144.06,34.03)} ${t(141,34.56)} ${t(138.14,35.52)} C ${t(133.48,17.4)} ${t(117.03,4)} ${t(97.45,4)} C ${t(75.18,4)} ${t(56.96,21.34)} ${t(55.55,43.25)} C ${t(53.42,42.6)} ${t(51.16,42.25)} ${t(48.82,42.25)} C ${t(36.89,42.25)} ${t(27.1,51.4)} ${t(26.07,63.06)} C ${t(13.84,65.5)} ${t(4.55,76.35)} ${t(4.55,89.27)} C ${t(4.55,103.97)} ${t(16.57,116)} ${t(31.27,116)} L ${t(168.73,116)} C ${t(183.43,116)} ${t(195.45,103.97)} ${t(195.45,89.27)} C ${t(195.45,77)} ${t(187.07,66.59)} ${t(175.74,63.49)} Z`;
      return `<path d="${d}" ${sf}/>`;
    }
    return '';
  }

  const n = tokens.length;
  const maxOffset = n > 1 ? CELL * 0.38 : 0;
  const balloonExtra = shape === 'balloon' ? CELL * 0.38 : 0;

  function yOff(i) {
    if (layout === 'ascending')  return maxOffset - (i / Math.max(n-1,1)) * maxOffset;
    if (layout === 'descending') return (i / Math.max(n-1,1)) * maxOffset;
    return 0;
  }

  const totalW = PAD*2 + n*CELL + (n-1)*GAP;
  const totalH = PAD*2 + CELL + (layout === 'ascending' ? 2*maxOffset : layout !== 'straight' ? maxOffset : 0) + balloonExtra;

  let parts = [], palIdx = 0;

  tokens.forEach((token, i) => {
    const cx = PAD + i * (CELL + GAP) + CELL/2;
    const baseY = PAD + (layout === 'ascending' ? maxOffset : 0) + CELL/2;
    const cy = baseY + yOff(i);
    const isAnswer = token === '?';
    const isEmpty  = token === '_' || isAnswer;

    if (isEmpty) {
      const fill = '#F4F5F7', stroke = isAnswer ? '#BBBFD0' : '#D1D5DB';
      parts.push(drawShape(shape, cx, cy, CELL, fill, stroke, 2, isAnswer ? '7,5' : null));
      if (isAnswer) {
        const fs = CELL * 0.36;
        const ty = shape === 'balloon' ? cy - CELL*0.0556 + fs*0.35
                 : shape === 'cloud'   ? cy + CELL*(7/195) + fs*0.35
                 : shape === 'star'    ? cy + fs*0.35 + 2
                 : cy + fs*0.35;
        parts.push(`<text x="${cx}" y="${ty}" text-anchor="middle" font-family="${SHARED_FONT}" font-size="${fs}" font-weight="900" fill="#BBBFD0">?</text>`);
      }
    } else {
      const c = cellFill(palIdx++);
      parts.push(drawShape(shape, cx, cy, CELL, c.fill, c.stroke, c.strokeW, null));
      const fs = CELL * 0.36;
      const ty = shape === 'balloon' ? cy - CELL*0.0556 + fs*0.35
               : shape === 'cloud'   ? cy + CELL*(7/195) + fs*0.35
               : shape === 'star'    ? cy + fs*0.35 + 2
               : cy + fs*0.35;
      parts.push(`<text x="${cx}" y="${ty}" text-anchor="middle" font-family="${SHARED_FONT}" font-size="${fs}" font-weight="900" fill="${c.text}">${ntEsc(token)}</text>`);
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}"><rect width="${totalW}" height="${totalH}" fill="white" rx="10"/>${parts.join('')}</svg>`;
}

// ─── svgToPng ─────────────────────────────────────────────────────────────────
function svgToPng(svgStr) {
  return new Promise((res, rej) => {
    const div = document.createElement('div');
    div.innerHTML = svgStr;
    const el = div.querySelector('svg');
    const vb = (el?.getAttribute('viewBox') || '0 0 460 120').split(/\s+/).map(Number);
    const w = vb[2], h = vb[3], sc = 2;
    const cv = document.createElement('canvas');
    cv.width = w * sc; cv.height = h * sc;
    const ctx = cv.getContext('2d');
    ctx.scale(sc, sc);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url); cv.toBlob(res, 'image/png'); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('SVG render failed')); };
    img.src = url;
  });
}
