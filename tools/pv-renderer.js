// ─── Place Value Renderer — Shared module for the assessment builder ────────
// Exports: pvRender(cv, cfg) — renders a PV representation to a canvas element.
// cfg shape: { n, repType, dispMode, blkColors, missingVals, numEqMode }
//   n          : number (e.g. 342)
//   repType    : 'blocks' | 'counters' | 'numbers'
//   dispMode   : 'standalone' | 'grid' | 'partwhole'
//   blkColors  : { 1000:'#hex', 100:'#hex', 10:'#hex', 1:'#hex' }  (optional)
//   missingVals: array of values (numbers or 'whole') to show as ?  (optional)
//   numEqMode  : 'none' | 'before' | 'after'                       (optional)

(function(global) {
  'use strict';

  const PV_FONT = "'Proxima Soft','Nunito','Arial Rounded MT Bold',sans-serif";
  const PV_GAP  = 6, PV_PAD = 20;
  const PV_CELL = 10;
  const PV_DEP  = 4;
  const PV_CTR  = 44;
  const PV_BLK_PER_ROW = { 1000:3, 100:3, 10:5, 1:5 };

  const PV_TABLE = [
    { val:1000000, label:'Millions',          abbr:'M',   color:'#288C50' },
    { val:100000,  label:'Hundred Thousands', abbr:'HTh', color:'#50B4C8' },
    { val:10000,   label:'Ten Thousands',     abbr:'TTh', color:'#B478B4' },
    { val:1000,    label:'Thousands',         abbr:'Th',  color:'#788CB4' },
    { val:100,     label:'Hundreds',          abbr:'H',   color:'#50B4A0' },
    { val:10,      label:'Tens',              abbr:'T',   color:'#F0B478' },
    { val:1,       label:'Ones',              abbr:'O',   color:'#C86464' },
    { val:0.1,     label:'Tenths',            abbr:'t',   color:'#C878B4', frac:'1/10'   },
    { val:0.01,    label:'Hundredths',        abbr:'h',   color:'#F0B0D4', frac:'1/100'  },
    { val:0.001,   label:'Thousandths',       abbr:'th',  color:'#F0A090', frac:'1/1000' },
  ];

  function pv_adjustColor(hex, factor) {
    let r, g, b;
    if (typeof hex === 'string' && hex.startsWith('#') && hex.length >= 7) {
      r = parseInt(hex.slice(1,3),16);
      g = parseInt(hex.slice(3,5),16);
      b = parseInt(hex.slice(5,7),16);
    } else {
      const m = String(hex).match(/\d+/g);
      [r,g,b] = m ? m.map(Number) : [128,128,128];
    }
    return `rgb(${Math.min(255,Math.round(r*factor))},${Math.min(255,Math.round(g*factor))},${Math.min(255,Math.round(b*factor))})`;
  }

  function pv_drawQMark(ctx, x, y, w, h) {
    const R = Math.min(10, w/4, h/4);
    ctx.save();
    ctx.fillStyle = '#F3F4F6';
    ctx.beginPath();
    ctx.moveTo(x+R, y); ctx.lineTo(x+w-R, y); ctx.quadraticCurveTo(x+w, y, x+w, y+R);
    ctx.lineTo(x+w, y+h-R); ctx.quadraticCurveTo(x+w, y+h, x+w-R, y+h);
    ctx.lineTo(x+R, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-R);
    ctx.lineTo(x, y+R); ctx.quadraticCurveTo(x, y, x+R, y);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9CA3AF'; ctx.lineWidth = 2; ctx.setLineDash([5,4]); ctx.stroke(); ctx.setLineDash([]);
    const fs = Math.max(Math.min(w*0.45, h*0.65, 52), 18);
    ctx.font = `bold ${fs}px ${PV_FONT}`; ctx.fillStyle = '#6B7280';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', x+w/2, y+h/2);
    ctx.restore();
  }

  function pv_drawQMarkCircle(ctx, cx, cy, r) {
    ctx.font = `bold ${Math.max(r*0.7,20)}px ${PV_FONT}`; ctx.fillStyle = '#6B7280';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', cx, cy);
  }

  function pv_drawBlock(ctx, bx, by, val, blkColors) {
    const cols  = val >= 100  ? 10 : 1;
    const rows  = val >= 10   ? 10 : 1;
    const depth = val >= 1000 ? 10 : 1;
    const W = cols * PV_CELL, H = rows * PV_CELL, D = depth * PV_DEP;
    const fx = bx, fy = by + D;
    const base  = blkColors[val] || '#999';
    const topC  = pv_adjustColor(base, 1.30);
    const sideC = pv_adjustColor(base, 0.70);
    ctx.fillStyle = sideC;
    ctx.beginPath(); ctx.moveTo(fx+W,fy); ctx.lineTo(fx+W+D,fy-D); ctx.lineTo(fx+W+D,fy-D+H); ctx.lineTo(fx+W,fy+H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = topC;
    ctx.beginPath(); ctx.moveTo(fx,fy); ctx.lineTo(fx+W,fy); ctx.lineTo(fx+W+D,fy-D); ctx.lineTo(fx+D,fy-D); ctx.closePath(); ctx.fill();
    ctx.fillStyle = base; ctx.fillRect(fx, fy, W, H);
    ctx.strokeStyle = '#111111'; ctx.lineWidth = 0.55;
    for (let r=1; r<rows; r++) { const ly=fy+r*PV_CELL; ctx.beginPath();ctx.moveTo(fx,ly);ctx.lineTo(fx+W,ly);ctx.stroke(); }
    for (let c=1; c<cols; c++) { const lx=fx+c*PV_CELL; ctx.beginPath();ctx.moveTo(lx,fy);ctx.lineTo(lx,fy+H);ctx.stroke(); }
    for (let c=1; c<cols; c++) { const lx=fx+c*PV_CELL; ctx.beginPath();ctx.moveTo(lx,fy);ctx.lineTo(lx+D,fy-D);ctx.stroke(); }
    for (let d=1; d<depth; d++) { const ox=d*PV_DEP,oy=-d*PV_DEP; ctx.beginPath();ctx.moveTo(fx+ox,fy+oy);ctx.lineTo(fx+W+ox,fy+oy);ctx.stroke(); }
    for (let r=1; r<rows; r++) { const ly=fy+r*PV_CELL; ctx.beginPath();ctx.moveTo(fx+W,ly);ctx.lineTo(fx+W+D,ly-D);ctx.stroke(); }
    for (let d=1; d<depth; d++) { const ox=d*PV_DEP,oy=-d*PV_DEP; ctx.beginPath();ctx.moveTo(fx+W+ox,fy+oy);ctx.lineTo(fx+W+ox,fy+oy+H);ctx.stroke(); }
    ctx.strokeStyle = '#111111'; ctx.lineWidth = 1.0;
    ctx.beginPath(); ctx.moveTo(fx+D,fy-D); ctx.lineTo(fx+W+D,fy-D); ctx.lineTo(fx+W+D,fy-D+H); ctx.lineTo(fx+W,fy+H); ctx.lineTo(fx,fy+H); ctx.lineTo(fx,fy); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx,fy);   ctx.lineTo(fx+W,fy);    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx+W,fy); ctx.lineTo(fx+W,fy+H);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx+W,fy); ctx.lineTo(fx+W+D,fy-D);ctx.stroke();
  }

  function pv_oneBlkBounds(val) {
    const cols  = val >= 100  ? 10 : 1;
    const rows  = val >= 10   ? 10 : 1;
    const depth = val >= 1000 ? 10 : 1;
    return { w: cols*PV_CELL + depth*PV_DEP, h: rows*PV_CELL + depth*PV_DEP };
  }

  function pv_blkSize(val, count) {
    if (!count) return {w:0,h:0};
    const {w:bw,h:bh} = pv_oneBlkBounds(val);
    const perRow = PV_BLK_PER_ROW[val] || 5;
    return { w: Math.min(count,perRow)*(bw+PV_GAP)-PV_GAP, h: Math.ceil(count/perRow)*(bh+PV_GAP)-PV_GAP };
  }

  function pv_drawBlks(ctx, x, y, val, count, blkColors) {
    const {w:bw,h:bh} = pv_oneBlkBounds(val);
    const perRow = PV_BLK_PER_ROW[val] || 5;
    for (let i=0; i<count; i++) {
      const c=i%perRow, r=Math.floor(i/perRow);
      pv_drawBlock(ctx, x+c*(bw+PV_GAP), y+r*(bh+PV_GAP), val, blkColors);
    }
  }

  function pv_ctrSize(count, perRow) {
    if (!count) return {w:0,h:0};
    perRow = perRow||2;
    const cols=Math.min(count,perRow), rows=Math.ceil(count/perRow);
    return { w:cols*(PV_CTR+PV_GAP)-PV_GAP, h:rows*(PV_CTR+PV_GAP)-PV_GAP };
  }

  function pv_drawCtrs(ctx, x, y, val, count, perRow) {
    const pv = PV_TABLE.find(c=>c.val===val) || {color:'#888',abbr:'?'};
    const R=PV_CTR/2;
    perRow = perRow||2;
    for (let i=0; i<count; i++) {
      const col=i%perRow, row=Math.floor(i/perRow);
      const cx=x+col*(PV_CTR+PV_GAP)+R, cy=y+row*(PV_CTR+PV_GAP)+R;
      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fillStyle=pv.color; ctx.fill();
      ctx.strokeStyle=pv_adjustColor(pv.color,0.65); ctx.lineWidth=1.5; ctx.stroke();
      const txt = pv.val < 1 ? String(pv.val) : pv.abbr;
      const fs = txt.length >= 5 ? 8 : txt.length >= 4 ? 9 : txt.length > 2 ? 10 : txt.length > 1 ? 12 : 15;
      ctx.font=`bold ${fs}px ${PV_FONT}`; ctx.fillStyle='#fff';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(txt,cx,cy);
    }
  }

  function pv_numSize(ctx, val, count) {
    if (!count) return {w:0,h:0};
    ctx.font=`bold 32px ${PV_FONT}`;
    const product = Math.round(val * count * 1e6) / 1e6;
    return { w:ctx.measureText(String(product)).width+16, h:44 };
  }

  function pv_drawNumTxt(ctx, cx, cy, val, count, color) {
    ctx.font=`bold 32px ${PV_FONT}`; ctx.fillStyle=color||'#1A1A2E';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const product = Math.round(val * count * 1e6) / 1e6;
    ctx.fillText(String(product),cx,cy);
  }

  function pv_drawColoredNum(ctx, n, parts, bx, cy) {
    const numStr = String(n);
    ctx.font = `bold 32px ${PV_FONT}`;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const colMap = {};
    parts.forEach(p => { colMap[Math.round(p.val * 1e6)] = p.color; });
    const dotIdx = numStr.indexOf('.');
    const intLen  = dotIdx >= 0 ? dotIdx : numStr.length;
    let dx = bx + 8;
    numStr.split('').forEach((ch, i) => {
      let color = '#1A1A2E';
      if (ch === '.') { color = '#9CA3AF'; }
      else if (ch !== '-') {
        let pv;
        if (i < intLen) { pv = Math.pow(10, intLen-1-i); }
        else { const decPos = i-intLen-1; pv = Math.round(Math.pow(10,-(decPos+1))*1e6)/1e6; }
        color = colMap[Math.round(pv*1e6)] || '#1A1A2E';
      }
      ctx.fillStyle = color; ctx.fillText(ch, dx, cy);
      dx += ctx.measureText(ch).width;
    });
  }

  function pv_secSize(ctx, col, count, repType, ctrPerRow) {
    if (repType==='blocks')   return pv_blkSize(col.val, count);
    if (repType==='counters') return pv_ctrSize(count, ctrPerRow);
    return pv_numSize(ctx, col.val, count);
  }

  function pv_drawContent(ctx, col, count, x, y, repType, blkColors, ctrPerRow) {
    if (repType==='blocks')   { pv_drawBlks(ctx,x,y,col.val,count,blkColors); return; }
    if (repType==='counters') { pv_drawCtrs(ctx,x,y,col.val,count,ctrPerRow); return; }
    const sz=pv_numSize(ctx,col.val,count);
    pv_drawNumTxt(ctx,x+sz.w/2,y+sz.h/2,col.val,count,col.color);
  }

  function pv_decompose(n) {
    const cols = PV_TABLE.filter(p => p.val >= 1).slice(-4); // thousands..ones only for blocks
    let rem = Math.round(Math.max(0, n) * 1000);
    return cols.map(c => {
      const cVal = Math.round(c.val * 1000);
      const count = Math.floor(rem / cVal);
      rem -= count * cVal;
      return {...c, count};
    });
  }

  function pv_decomposeAll(n) {
    let rem = Math.round(Math.max(0, n) * 1000);
    return PV_TABLE.map(c => {
      const cVal = Math.round(c.val * 1000);
      const count = Math.floor(rem / cVal);
      rem -= count * cVal;
      return {...c, count};
    });
  }

  function pv_setupCanvas(cv, logW, logH, scale) {
    cv.width=logW*scale; cv.height=logH*scale;
    const ctx=cv.getContext('2d');
    ctx.setTransform(1,0,0,1,0,0); ctx.scale(scale,scale);
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,logW,logH);
    return ctx;
  }

  function pv_renderStandalone(cv, parts, n, repType, blkColors, missingSet, numEqMode, scale) {
    const active = parts.filter(p => p.count > 0);
    const tmp = document.createElement('canvas').getContext('2d');
    if (!active.length) { pv_setupCanvas(cv,400,120,scale); return; }
    const sizes = active.map(p => pv_secSize(tmp, p, p.count, repType));
    const maxH = Math.max(...sizes.map(s => s.h));
    let plusW=0, eqW=0, numW=0;
    if (repType==='numbers') {
      tmp.font=`bold 28px ${PV_FONT}`; plusW=tmp.measureText(' + ').width;
      if (numEqMode!=='none') {
        tmp.font=`bold 32px ${PV_FONT}`; numW=tmp.measureText(String(n)).width+16;
        tmp.font=`bold 28px ${PV_FONT}`; eqW=tmp.measureText(' = ').width;
      }
    }
    const SEC_GAP = repType==='numbers' ? 0 : 28;
    let totalW = PV_PAD*2;
    if (repType==='numbers' && numEqMode!=='none') totalW += numW + eqW;
    sizes.forEach((sz,i) => { totalW += sz.w + (i>0 ? (repType==='numbers' ? plusW : SEC_GAP) : 0); });
    const logW = Math.max(totalW,300), logH = Math.max(maxH+PV_PAD*2,100);
    const ctx = pv_setupCanvas(cv, logW, logH, scale);
    let cx = PV_PAD;
    if (repType==='numbers' && numEqMode==='before') {
      pv_drawColoredNum(ctx,n,parts,cx,PV_PAD+maxH/2); cx+=numW;
      ctx.font=`bold 28px ${PV_FONT}`; ctx.fillStyle='#AAAAAA'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.fillText(' = ',cx,PV_PAD+maxH*0.75); cx+=eqW;
    }
    active.forEach((p,i) => {
      const sz=sizes[i], cy=PV_PAD;
      if (i>0 && repType==='numbers') {
        ctx.font=`bold 28px ${PV_FONT}`; ctx.fillStyle='#AAAAAA'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
        ctx.fillText(' + ',cx,cy+sz.h*0.75); cx+=plusW;
      } else if (i>0) { cx+=SEC_GAP; }
      if (missingSet.has(p.val)) {
        const qh = i > 0 ? sizes[i-1].h : maxH;
        pv_drawQMark(ctx, cx, cy, sz.w, qh);
      } else { pv_drawContent(ctx, p, p.count, cx, cy, repType, blkColors); }
      cx += sz.w;
    });
    if (repType==='numbers' && numEqMode==='after') {
      ctx.font=`bold 28px ${PV_FONT}`; ctx.fillStyle='#AAAAAA'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.fillText(' = ',cx,PV_PAD+maxH*0.75); cx+=eqW;
      pv_drawColoredNum(ctx,n,parts,cx,PV_PAD+maxH/2);
    }
  }

  function pv_renderGrid(cv, parts, repType, blkColors, missingSet, scale) {
    const nonZeroIdx = parts.reduce((acc,p,i) => (p.count>0 ? [...acc,i] : acc), []);
    let lo, hi;
    if (nonZeroIdx.length===0) {
      lo = hi = parts.findIndex(p=>p.val===1); if (lo<0) { lo=0; hi=parts.length-1; }
    } else { lo=Math.min(...nonZeroIdx); hi=Math.max(...nonZeroIdx); }
    const onesIdx = parts.findIndex(p=>p.val===1);
    if (onesIdx>=0 && hi>onesIdx) lo=Math.min(lo,onesIdx);
    parts = parts.slice(lo, hi+1);
    const compact = parts.length > 7;
    const HDR_H=46, CELL_PAD=compact?6:14, MIN_W=compact?72:120;
    const tmp = document.createElement('canvas').getContext('2d');
    const contentSizes = parts.map(p => pv_secSize(tmp, p, Math.max(p.count,1), repType));
    const colWs = contentSizes.map(sz => Math.max(sz.w+CELL_PAD*2, MIN_W));
    const activeH = parts.filter(p=>p.count>0).map(p => pv_secSize(tmp,p,p.count,repType).h);
    const colH = (activeH.length ? Math.max(...activeH) : 60) + CELL_PAD*2;
    const totalW = colWs.reduce((a,b)=>a+b,0), totalH = HDR_H+colH;
    const logW = Math.max(totalW+2,300), logH = Math.max(totalH+2,200);
    const ctx = pv_setupCanvas(cv, logW, logH, scale);
    let x = 1;
    const decDots = [];
    parts.forEach((p,i) => {
      const cw=colWs[i], isFirst=i===0, isLast=i===parts.length-1, R=8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(x+(isFirst?R:0),1);
      ctx.lineTo(x+cw-(isLast?R:0),1);
      if(isLast) ctx.arcTo(x+cw,1,x+cw,1+R,R); else ctx.lineTo(x+cw,1);
      ctx.lineTo(x+cw,1+HDR_H); ctx.lineTo(x,1+HDR_H);
      if(isFirst){ctx.lineTo(x,1+R);ctx.arcTo(x,1,x+R,1,R);}else ctx.lineTo(x,1);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle='#000000'; ctx.textAlign='center'; ctx.textBaseline='middle';
      if (compact) {
        ctx.font=`bold 12px ${PV_FONT}`; ctx.fillText(p.frac||p.abbr, x+cw/2, 1+HDR_H/2);
      } else {
        ctx.font=`bold 15px ${PV_FONT}`;
        const lw=ctx.measureText(p.label).width;
        if (lw>cw-10 && p.label.includes(' ')) {
          const sp=p.label.lastIndexOf(' '); ctx.font=`bold 13px ${PV_FONT}`;
          ctx.fillText(p.label.slice(0,sp), x+cw/2, 1+HDR_H/2-8);
          ctx.fillText(p.label.slice(sp+1), x+cw/2, 1+HDR_H/2+8);
        } else { ctx.fillText(p.label, x+cw/2, 1+HDR_H/2); }
      }
      ctx.fillStyle='#F9FAFB'; ctx.fillRect(x,1+HDR_H,cw,colH);
      if(i<parts.length-1){
        const isDecBound=p.val===1 && parts[i+1] && parts[i+1].val<1;
        ctx.strokeStyle=isDecBound?'#6B7280':'#E5E7EB'; ctx.lineWidth=isDecBound?1.5:1;
        ctx.beginPath();ctx.moveTo(x+cw,1);ctx.lineTo(x+cw,1+HDR_H+colH);ctx.stroke();
        if(isDecBound) decDots.push(x+cw);
      }
      if (p.count > 0) {
        const sz=pv_secSize(tmp,p,p.count,repType);
        if (missingSet.has(p.val)) {
          const qw=Math.max(sz.w,60), qh=colH-CELL_PAD*2;
          pv_drawQMark(ctx, x+(cw-qw)/2, 1+HDR_H+CELL_PAD, qw, qh);
        } else if (repType==='numbers') {
          pv_drawNumTxt(ctx, x+cw/2, 1+HDR_H+colH/2, p.val, p.count, p.color);
        } else {
          pv_drawContent(ctx, p, p.count, x+(cw-sz.w)/2, 1+HDR_H+CELL_PAD, repType, blkColors);
        }
      }
      x += cw;
    });
    decDots.forEach(dotX => {
      ctx.fillStyle='#374151';
      ctx.beginPath();ctx.arc(dotX,1+HDR_H/2,4,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(dotX,1+HDR_H+colH/2,4,0,Math.PI*2);ctx.fill();
    });
  }

  function pv_renderPartWhole(cv, parts, n, repType, blkColors, missingSet, scale) {
    const active = parts.filter(p => p.count > 0);
    const CIRC_PAD=10, MIN_R=55, PART_GAP=12, LINE_LEN=60;
    const tmp = document.createElement('canvas').getContext('2d');
    const partSizes = active.map(p => pv_secSize(tmp, p, p.count, repType, 3));
    const partRs = active.length
      ? active.map((_,i) => Math.max(Math.hypot(partSizes[i].w/2, partSizes[i].h/2)+CIRC_PAD, MIN_R))
      : [MIN_R];
    const maxPartR = Math.max(...partRs);
    tmp.font=`bold 38px ${PV_FONT}`;
    const wholeR = Math.max(tmp.measureText(String(n)).width/2+26, 60);
    const partsTotalW = partRs.reduce((a,r)=>a+r*2,0) + PART_GAP*(Math.max(active.length,1)-1);
    const logW = Math.max(partsTotalW+PV_PAD*2+40, wholeR*2+PV_PAD*2, 360);
    const logH = Math.max(wholeR*2+LINE_LEN+maxPartR*2+PV_PAD*3, 300);
    const ctx = pv_setupCanvas(cv, logW, logH, scale);
    const wholeCY=PV_PAD+wholeR, partCY=wholeCY+wholeR+LINE_LEN+maxPartR;
    const startX=(logW-partsTotalW)/2;
    const partCXs=[]; let px=startX;
    partRs.forEach(r => { partCXs.push(px+r); px+=r*2+PART_GAP; });
    const wholeCX = active.length>0 ? (partCXs[0]+partCXs[partCXs.length-1])/2 : logW/2;
    ctx.strokeStyle='#374151'; ctx.lineWidth=2;
    active.forEach((_,i) => {
      const ang=Math.atan2(partCY-wholeCY, partCXs[i]-wholeCX);
      const sx=wholeCX+wholeR*Math.cos(ang), sy=wholeCY+wholeR*Math.sin(ang);
      const ex=partCXs[i]-partRs[i]*Math.cos(ang), ey=partCY-partRs[i]*Math.sin(ang);
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
    });
    ctx.beginPath();ctx.arc(wholeCX,wholeCY,wholeR,0,Math.PI*2);
    ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#374151';ctx.lineWidth=2.5;ctx.stroke();
    if (missingSet.has('whole')) { pv_drawQMarkCircle(ctx,wholeCX,wholeCY,wholeR); }
    else { ctx.font=`bold 38px ${PV_FONT}`;ctx.fillStyle='#1A1A2E';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(n),wholeCX,wholeCY); }
    active.forEach((p,i) => {
      const cx=partCXs[i], r=partRs[i], s=partSizes[i];
      ctx.beginPath();ctx.arc(cx,partCY,r,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#374151';ctx.lineWidth=2.5;ctx.stroke();
      if (missingSet.has(p.val)) { pv_drawQMarkCircle(ctx,cx,partCY,r); }
      else if (repType==='numbers') { pv_drawNumTxt(ctx,cx,partCY,p.val,p.count,p.color); }
      else { ctx.save();ctx.beginPath();ctx.arc(cx,partCY,r-4,0,Math.PI*2);ctx.clip(); pv_drawContent(ctx,p,p.count,cx-s.w/2,partCY-s.h/2,repType,blkColors,3); ctx.restore(); }
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  // pvRender(cv, cfg) — renders PV representation onto canvas cv.
  // Returns { logW, logH } for reference.
  global.pvRender = function(cv, cfg) {
    const n          = parseFloat(cfg.n) || 0;
    const repType    = cfg.repType    || 'blocks';
    const dispMode   = cfg.dispMode   || 'standalone';
    const numEqMode  = cfg.numEqMode  || 'none';
    const scale      = cfg.scale      || 2;
    const blkColors  = Object.assign({ 1000:'#788CB4', 100:'#50B4A0', 10:'#F0B478', 1:'#C86464' }, cfg.blkColors || {});
    // Apply any custom PV_TABLE colours from blkColors
    PV_TABLE.forEach(p => { if (blkColors[p.val]) p.color = blkColors[p.val]; });
    const missingArr = cfg.missingVals || [];
    const missingSet = new Set(missingArr);
    const parts = dispMode === 'grid' ? pv_decomposeAll(n) : pv_decompose(n);
    // For grid use all PV, for standalone/partwhole use integer decomposition
    if (dispMode === 'standalone') pv_renderStandalone(cv, parts, n, repType, blkColors, missingSet, numEqMode, scale);
    else if (dispMode === 'grid')  pv_renderGrid(cv, parts, repType, blkColors, missingSet, scale);
    else                           pv_renderPartWhole(cv, parts, n, repType, blkColors, missingSet, scale);
  };

  // pvGetParts(n, dispMode) — returns decomposed parts array (useful for building missing-val UI)
  global.pvGetParts = function(n, dispMode) {
    n = parseFloat(n) || 0;
    return dispMode === 'grid' ? pv_decomposeAll(n) : pv_decompose(n);
  };

})(window);
