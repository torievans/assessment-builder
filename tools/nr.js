/* tools/nr.js — Number Representations tool
 * Depends on: tools/shared.js (none directly, uses canvas API)
 * Globals from builder: activeTool
 */

/* ── Number Representations helpers ── */

// NR state
let nr_N=5,nr_rep='frames',nr_fType='5',nr_fc1=0,nr_fc2=4,nr_fSplitOn=false,nr_fSplit=5;
let nr_bg=5,nr_ba=4,nr_bb=0,nr_beadPreset='colour';
let nr_mc=4,nr_mc2=0,nr_mlRows='10',nr_mlFill='row',nr_mlGap=false,nr_mlSplitOn=false,nr_mlSplit=5;
let nr_niSplitOn=false,nr_niSplit=5;

const NR_STROKES=['#D46B55','#F5995B','#FECC6B','#319377','#7898F0','#847AC9','#FC7E91'];
const NR_NUMICON_COLOURS=['#F5995B','#9B92D4','#FECC6B','#5DAD80','#D46B55','#68A8E8','#FC7E91','#319377','#847AC9','#5878D8'];

function nrDarkenHex(hex,factor=0.6){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`rgb(${Math.round(r*factor)},${Math.round(g*factor)},${Math.round(b*factor)})`;}

function nrMkSwatches(id,activeIdx,cb){
  const el=document.getElementById(id);if(!el)return;el.innerHTML='';
  NR_STROKES.forEach((col,i)=>{const b=document.createElement('button');b.className='swatch'+(i===activeIdx?' selected':'');b.style.background=col;b.title=['Red','Orange','Yellow','Green','Blue','Purple','Pink'][i];b.onclick=()=>{el.querySelectorAll('.swatch').forEach(s=>s.classList.remove('selected'));b.classList.add('selected');cb(i);autoPreviewNR();};el.appendChild(b);});
}

function initNRPanel(){
  nrMkSwatches('nr-sw-fc1',nr_fc1,i=>{nr_fc1=i;});
  nrMkSwatches('nr-sw-fc2',nr_fc2,i=>{nr_fc2=i;});
  nrMkSwatches('nr-sw-ba', nr_ba, i=>{nr_ba=i;});
  nrMkSwatches('nr-sw-bb', nr_bb, i=>{nr_bb=i;});
  nrMkSwatches('nr-sw-mc', nr_mc, i=>{nr_mc=i;});
  nrMkSwatches('nr-sw-mc2',nr_mc2,i=>{nr_mc2=i;});
}

function nrResetState(){
  nr_N=5;nr_rep='frames';nr_fType='5';nr_fc1=0;nr_fc2=4;nr_fSplitOn=false;nr_fSplit=5;
  nr_bg=5;nr_ba=4;nr_bb=0;nr_beadPreset='colour';
  nr_mc=4;nr_mc2=0;nr_mlRows='10';nr_mlFill='row';nr_mlGap=false;nr_mlSplitOn=false;nr_mlSplit=5;
  nr_niSplitOn=false;nr_niSplit=5;
  document.getElementById('nr-num-in').value=5;
  document.querySelectorAll('[data-nrrep]').forEach(b=>b.classList.toggle('active',b.dataset.nrrep==='frames'));
  ['frames','beads','multilink','numicon'].forEach(x=>{const el=document.getElementById('nr-opts-'+x);if(el)el.style.display=x==='frames'?'':'none';});
  document.querySelectorAll('[data-nrft]').forEach(b=>b.classList.toggle('active',b.dataset.nrft==='5'));
  document.querySelectorAll('[data-nrfsp]').forEach(b=>b.classList.toggle('active',b.dataset.nrfsp==='off'));
  document.getElementById('nr-fsplit-row').style.display='none';
  document.getElementById('nr-fsplit-in').value=5;
  document.querySelectorAll('[data-nrbp]').forEach(b=>b.classList.toggle('active',b.dataset.nrbp==='colour'));
  document.querySelectorAll('[data-nrbg]').forEach(b=>b.classList.toggle('active',b.dataset.nrbg==='5'));
  document.querySelectorAll('[data-nrml]').forEach(b=>b.classList.toggle('active',b.dataset.nrml==='10'));
  const fr=document.getElementById('nr-ml-fill-row');if(fr)fr.style.display='none';
  document.querySelectorAll('[data-nrmf]').forEach(b=>b.classList.toggle('active',b.dataset.nrmf==='row'));
  document.querySelectorAll('[data-nrmsp]').forEach(b=>b.classList.toggle('active',b.dataset.nrmsp==='off'));
  document.getElementById('nr-mlsplit-row').style.display='none';
  document.getElementById('nr-mlsplit-in').value=5;
  document.querySelectorAll('[data-nrnsp]').forEach(b=>b.classList.toggle('active',b.dataset.nrnsp==='off'));
  document.getElementById('nr-nisplit-row').style.display='none';
  document.getElementById('nr-nisplit-in').value=5;
  const sep10El=document.getElementById('nr-ml-sep10-row');if(sep10El)sep10El.style.display='none';
  document.querySelectorAll('[data-nrmsg]').forEach(b=>b.classList.toggle('active',b.dataset.nrmsg==='off'));
  // Reset swatch selections
  ['nr-sw-fc1','nr-sw-fc2','nr-sw-ba','nr-sw-bb','nr-sw-mc','nr-sw-mc2'].forEach((id,idx)=>{
    const val=[0,4,4,0,4,0][idx];
    const el=document.getElementById(id);if(!el)return;
    el.querySelectorAll('.swatch').forEach((b,i)=>b.classList.toggle('selected',i===val));
  });
}

function nrSetNum(v){
  nr_N=Math.max(1,Math.min(20,isNaN(v)?nr_N:v));
  document.getElementById('nr-num-in').value=nr_N;
  if(nr_fSplit>=nr_N){nr_fSplit=Math.max(1,nr_N-1);document.getElementById('nr-fsplit-in').value=nr_fSplit;}
  if(nr_mlSplit>=nr_N){nr_mlSplit=Math.max(1,nr_N-1);document.getElementById('nr-mlsplit-in').value=nr_mlSplit;}
  const niMax=Math.min(nr_N-1,10),niMin=Math.max(1,nr_N-10);
  nr_niSplit=Math.max(niMin,Math.min(niMax,nr_niSplit));
  document.getElementById('nr-nisplit-in').value=nr_niSplit;
  nrUpdateSep10();
  autoPreviewNR();
}
function nrChangeNum(d){nrSetNum(nr_N+d);}
function nrSetRep(btn){nr_rep=btn.dataset.nrrep;document.querySelectorAll('[data-nrrep]').forEach(b=>b.classList.toggle('active',b.dataset.nrrep===nr_rep));['frames','beads','multilink','numicon'].forEach(x=>{const el=document.getElementById('nr-opts-'+x);if(el)el.style.display=x===nr_rep?'':'none';});autoPreviewNR();}
function nrSetFT(btn){nr_fType=btn.dataset.nrft;document.querySelectorAll('[data-nrft]').forEach(b=>b.classList.toggle('active',b.dataset.nrft===nr_fType));autoPreviewNR();}
function nrSetFSplit(btn,on){nr_fSplitOn=on;document.querySelectorAll('[data-nrfsp]').forEach(b=>b.classList.toggle('active',b.dataset.nrfsp===(on?'on':'off')));document.getElementById('nr-fsplit-row').style.display=on?'':'none';autoPreviewNR();}
function nrChangeFSplit(d){nrSetFSplitAt(nr_fSplit+d);}
function nrSetFSplitAt(v){nr_fSplit=Math.max(1,Math.min(nr_N-1,isNaN(v)?nr_fSplit:v));document.getElementById('nr-fsplit-in').value=nr_fSplit;autoPreviewNR();}
function nrSetBeadPreset(btn){nr_beadPreset=btn.dataset.nrbp;document.querySelectorAll('[data-nrbp]').forEach(b=>b.classList.toggle('active',b.dataset.nrbp===nr_beadPreset));const row=document.getElementById('nr-bead-col-row');if(row){row.style.opacity=nr_beadPreset==='rw'?'0.35':'';row.style.pointerEvents=nr_beadPreset==='rw'?'none':'';}autoPreviewNR();}
function nrSetBG(btn){nr_bg=+btn.dataset.nrbg;document.querySelectorAll('[data-nrbg]').forEach(b=>b.classList.toggle('active',b.dataset.nrbg==String(nr_bg)));autoPreviewNR();}
function nrSetMLGap(btn,on){nr_mlGap=on;document.querySelectorAll('[data-nrmsg]').forEach(b=>b.classList.toggle('active',b.dataset.nrmsg===(on?'on':'off')));autoPreviewNR();}
function nrUpdateSep10(){const show=nr_mlRows==='5'&&nr_N>10;const el=document.getElementById('nr-ml-sep10-row');if(el)el.style.display=show?'':'none';}
function nrSetML(btn){nr_mlRows=btn.dataset.nrml;document.querySelectorAll('[data-nrml]').forEach(b=>b.classList.toggle('active',b.dataset.nrml===nr_mlRows));const fr=document.getElementById('nr-ml-fill-row');if(fr)fr.style.display=nr_mlRows==='5'?'':'none';nrUpdateSep10();autoPreviewNR();}
function nrSetMLFill(btn){nr_mlFill=btn.dataset.nrmf;document.querySelectorAll('[data-nrmf]').forEach(b=>b.classList.toggle('active',b.dataset.nrmf===nr_mlFill));autoPreviewNR();}
function nrSetMLSplit(btn,on){nr_mlSplitOn=on;document.querySelectorAll('[data-nrmsp]').forEach(b=>b.classList.toggle('active',b.dataset.nrmsp===(on?'on':'off')));document.getElementById('nr-mlsplit-row').style.display=on?'':'none';autoPreviewNR();}
function nrChangeMLSplit(d){nrSetMLSplitAt(nr_mlSplit+d);}
function nrSetMLSplitAt(v){nr_mlSplit=Math.max(1,Math.min(nr_N-1,isNaN(v)?nr_mlSplit:v));document.getElementById('nr-mlsplit-in').value=nr_mlSplit;autoPreviewNR();}
function nrSetNISplit(btn,on){nr_niSplitOn=on;document.querySelectorAll('[data-nrnsp]').forEach(b=>b.classList.toggle('active',b.dataset.nrnsp===(on?'on':'off')));document.getElementById('nr-nisplit-row').style.display=on?'':'none';autoPreviewNR();}
function nrChangeNISplit(d){nrSetNISplitAt(nr_niSplit+d);}
function nrSetNISplitAt(v){const niMax=Math.min(nr_N-1,10),niMin=Math.max(1,nr_N-10);nr_niSplit=Math.max(niMin,Math.min(niMax,isNaN(v)?nr_niSplit:v));document.getElementById('nr-nisplit-in').value=nr_niSplit;autoPreviewNR();}

// ── NR renderers ──
function nrRenderFrames(cfg){
  const N=cfg.n,fType=cfg.fType||'5',fc1=cfg.fc1??0,fc2=cfg.fc2??4,fSplitOn=cfg.fSplitOn||false,fSplit=cfg.fSplit||5;
  function counterCol(ci){return{fill:NR_STROKES[ci],stroke:NR_STROKES[ci]};}
  function frameGroup(n,ox,oy,placedSoFar){
    const CELL=60,cols=5,rows=fType==='5'?1:2,FW=cols*CELL,FH=rows*CELL,GL=1.5,GC='#333',h=GL/2;
    let placed=0,s=`<g transform="translate(${ox},${oy})">`;
    s+=`<rect x="0" y="0" width="${FW}" height="${FH}" fill="white"/>`;
    for(let row=0;row<rows;row++){for(let col=0;col<cols;col++){if(placed<n){const tp=placedSoFar+placed,useC2=fSplitOn&&tp>=fSplit,{fill,stroke}=counterCol(useC2?fc2:fc1),cx=(col*CELL+CELL/2).toFixed(1),cy=(row*CELL+CELL/2).toFixed(1),R=CELL*0.38;s+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;placed++;}}}
    const la=`stroke="${GC}" stroke-width="${GL}" stroke-linecap="square"`;
    for(let col=0;col<=cols;col++){const x=col===0?h:col===cols?FW-h:col*CELL;s+=`<line x1="${x}" y1="${h}" x2="${x}" y2="${FH-h}" ${la}/>`;}
    for(let row=0;row<=rows;row++){const y=row===0?h:row===rows?FH-h:row*CELL;s+=`<line x1="${h}" y1="${y}" x2="${FW-h}" y2="${y}" ${la}/>`;}
    s+=`</g>`;return{group:s,FW,FH};
  }
  const CELL=60,cols=5,rows=fType==='5'?1:2,FW=cols*CELL,FH=rows*CELL,cap=cols*rows,FGAP=20,numF=Math.ceil(N/cap),lCols=Math.min(numF,2),lRows=Math.ceil(numF/lCols);
  const W=lCols*FW+(lCols-1)*FGAP,H=lRows*FH+(lRows-1)*FGAP;
  let groups='',rem=N,totalPlaced=0;
  for(let fi=0;fi<numF;fi++){const fc=fi%lCols,fr=Math.floor(fi/lCols),n=Math.min(rem,cap);const{group}=frameGroup(n,fc*(FW+FGAP),fr*(FH+FGAP),totalPlaced);groups+=group;totalPlaced+=n;rem-=n;}
  return`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:${W}px;max-width:100%">${groups}</svg>`;
}

function nrRenderBeads(cfg){
  const N=cfg.n,bg=cfg.bg||5,ba=cfg.ba??4,bb=cfg.bb??0,beadPreset=cfg.beadPreset||'colour';
  const RW_RED={fill:'#CC2200',stroke:nrDarkenHex('#CC2200')},RW_WHITE={fill:'#FFFFFF',stroke:nrDarkenHex('#FFFFFF')};
  function beadCol(i){const even=Math.floor(i/bg)%2===0;if(beadPreset==='rw')return even?RW_RED:RW_WHITE;const fill=even?NR_STROKES[ba]:NR_STROKES[bb];return{fill,stroke:nrDarkenHex(fill)};}
  const r=Math.min(18,Math.max(11,Math.floor(180/N))),LTAIL=18,RTAIL=110,A=4,WL=140;
  const SVG_W=LTAIL+N*2*r+RTAIL,baseCY=r+A+6,SVG_H=baseCY*2;
  const beads=[];for(let i=0;i<N;i++){const x=LTAIL+r+i*2*r;beads.push({x,y:baseCY+A*Math.sin(2*Math.PI*x/WL)});}
  const STEPS=300;let pathD=`M 0,${baseCY.toFixed(1)}`;
  for(let i=1;i<=STEPS;i++){const x=(i/STEPS)*SVG_W;pathD+=` L ${x.toFixed(1)},${(baseCY+A*Math.sin(2*Math.PI*x/WL)).toFixed(1)}`;}
  let s=`<svg viewBox="0 0 ${SVG_W} ${SVG_H}" xmlns="http://www.w3.org/2000/svg" style="width:${SVG_W}px;max-width:100%">`;
  s+=`<path d="${pathD}" fill="none" stroke="#888" stroke-width="2.2" stroke-linecap="round"/>`;
  for(let i=0;i<N;i++){const{fill,stroke}=beadCol(i);s+=`<circle cx="${beads[i].x.toFixed(1)}" cy="${beads[i].y.toFixed(1)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;}
  s+=`</svg>`;return s;
}

function nrRenderMultilink(cfg){
  const N=cfg.n,mc=cfg.mc??4,mc2=cfg.mc2??0,mlRows=cfg.mlRows||'10',mlFill=cfg.mlFill||'row',mlGap=cfg.mlGap||false,mlSplitOn=cfg.mlSplitOn||false,mlSplit=cfg.mlSplit||5;
  const fill=NR_STROKES[mc],rowSize=parseInt(mlRows);
  const CW=Math.max(20,Math.min(60,Math.floor(560/rowSize))),scale=CW/77.76,CH=Math.round(79.38*scale),CONN_W=Math.round((89.2025-77.76)*scale),PAD=2;
  const colFill=(rowSize===5&&mlFill==='col');
  const pos=Array.from({length:N},(_,i)=>{if(!colFill)return{col:i%rowSize,row:Math.floor(i/rowSize)};const g=Math.floor(i/10),p=i%10;return{col:Math.floor(p/2),row:g*2+p%2};});
  const numCols=rowSize,numRows=colFill?Math.ceil(N/10)*2-(N%10===1?1:0):Math.ceil(N/rowSize);
  const numGroups=Math.ceil(N/10),GAP=10,numGaps=mlGap&&rowSize===5&&numGroups>1?numGroups-1:0;
  const SVG_W=numCols*CW+CONN_W+PAD*2,SVG_H=numRows*CH+numGaps*GAP+PAD*2;
  const RECT_D='M 75.52 78.88 L 2.75 78.88 C 1.51 78.88 0.5 77.88 0.5 76.64 L 0.5 2.75 C 0.5 1.51 1.51 0.5 2.75 0.5 L 75.52 0.5 C 76.76 0.5 77.76 1.51 77.76 2.75 L 77.76 76.64 C 77.76 77.88 76.76 78.88 75.52 78.88 Z';
  const CIRC_D='M 39.05 14.19 C 24.85 14.19 13.33 25.7 13.33 39.9 C 13.33 54.11 24.85 65.62 39.05 65.62 C 53.25 65.62 64.77 54.11 64.77 39.9 C 64.77 25.7 53.25 14.19 39.05 14.19 Z';
  const CONN_D='M 87.47 26.73 L 86.72 23.06 C 86.62 22.31 86.0 21.99 85.25 22.0 L 77.98 22.04 L 77.98 57.4 L 78.08 57.48 L 85.45 57.49 C 86.03 57.49 86.48 57.23 86.66 56.69 C 89.0 47.08 89.41 36.38 87.47 26.73 Z';
  const SNS='vector-effect="non-scaling-stroke"';
  let s=`<svg viewBox="0 0 ${SVG_W} ${SVG_H}" xmlns="http://www.w3.org/2000/svg" style="width:${SVG_W}px;height:auto;max-width:100%">`;
  for(let i=0;i<N;i++){
    const{row,col}=pos[i],useC2=mlSplitOn&&i>=mlSplit,f=useC2?NR_STROKES[mc2]:fill,st=nrDarkenHex(f);
    let isLastInRow;
    if(!colFill){isLastInRow=col===rowSize-1||i===N-1;}else if(col===rowSize-1){isLastInRow=true;}else{const g=Math.floor(i/10),rig=pos[i].row-g*2,nI=g*10+(col+1)*2+rig;isLastInRow=nI>=N;}
    const tx=PAD+col*CW,gO=numGaps>0?Math.floor(row/2)*GAP:0,ty=PAD+row*CH+gO;
    s+=`<g transform="translate(${tx},${ty}) scale(${scale.toFixed(4)})">`;
    s+=`<path d="${RECT_D}" fill="${f}" stroke="${st}" stroke-width="1.5" ${SNS}/>`;
    s+=`<path d="${CIRC_D}" fill="none" stroke="${st}" stroke-width="1.5" ${SNS}/>`;
    if(isLastInRow)s+=`<path d="${CONN_D}" fill="${f}" stroke="${st}" stroke-width="1.5" ${SNS}/>`;
    s+=`</g>`;
  }
  s+=`</svg>`;return s;
}

function nrRenderNumicon(cfg){
  const N=cfg.n,niSplitOn=cfg.niSplitOn||false,niSplit=cfg.niSplit||5;
  const CW=60,CH=60,R=4,CR=CW*0.33,PAD=4,PIECE_GAP=8;
  function niColour(n){return NR_NUMICON_COLOURS[Math.min(n,10)-1];}
  function rrPath(x,y,w,h,r){const p=(a,b)=>`${a.toFixed(1)},${b.toFixed(1)}`;return`M ${p(x+r,y)} L ${p(x+w-r,y)} A ${r} ${r} 0 0 1 ${p(x+w,y+r)} L ${p(x+w,y+h-r)} A ${r} ${r} 0 0 1 ${p(x+w-r,y+h)} L ${p(x+r,y+h)} A ${r} ${r} 0 0 1 ${p(x,y+h-r)} L ${p(x,y+r)} A ${r} ${r} 0 0 1 ${p(x+r,y)} Z`;}
  function lPath(x,y,W1,W2,r){const H=2*CH,p=(a,b)=>`${a.toFixed(1)},${b.toFixed(1)}`;return`M ${p(x+r,y)} L ${p(x+W1-r,y)} A ${r} ${r} 0 0 1 ${p(x+W1,y+r)} L ${p(x+W1,y+CH-r)} A ${r} ${r} 0 0 1 ${p(x+W1-r,y+CH)} L ${p(x+W2+r,y+CH)} A ${r} ${r} 0 0 0 ${p(x+W2,y+CH+r)} L ${p(x+W2,y+H-r)} A ${r} ${r} 0 0 1 ${p(x+W2-r,y+H)} L ${p(x+r,y+H)} A ${r} ${r} 0 0 1 ${p(x,y+H-r)} L ${p(x,y+r)} A ${r} ${r} 0 0 1 ${p(x+r,y)} Z`;}
  function piecePath(n,ox,oy){const fc=Math.floor(n/2),rem=n%2;if(n===1)return rrPath(ox,oy,CW,CH,R);if(rem===0)return rrPath(ox,oy,fc*CW,2*CH,R);return lPath(ox,oy,(fc+1)*CW,fc*CW,R);}
  function holes(n,ox,oy,sc){let s='';for(let i=0;i<n;i++){const cx=ox+Math.floor(i/2)*CW+CW/2,cy=oy+(i%2)*CH+CH/2;s+=`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${CR}" fill="white" stroke="${sc}" stroke-width="1.5"/>`;}return s;}
  function pW(n){return(Math.floor(n/2)+n%2)*CW;}function pH(n){return n===1?CH:2*CH;}
  let paths='',circs='',svgW,svgH;
  const doSplit=niSplitOn&&niSplit>0&&niSplit<N,N1=doSplit?niSplit:(N<=10?N:10),N2=doSplit?(N-niSplit):(N<=10?0:N-10);
  if(N2===0){const c1=niColour(N1),o1=nrDarkenHex(c1);paths=`<path d="${piecePath(N1,PAD,PAD)}" fill="${c1}" stroke="${o1}" stroke-width="2"/>`;circs=holes(N1,PAD,PAD,o1);svgW=pW(N1)+PAD*2;svgH=pH(N1)+PAD*2;}
  else if(N1+N2===10){const gcx=PAD+2.5*CW,gcy=PAD+CH,c1=niColour(N1),o1=nrDarkenHex(c1),c2=niColour(N2),o2=nrDarkenHex(c2);paths=`<path d="${piecePath(N1,PAD,PAD)}" fill="${c1}" stroke="${o1}" stroke-width="2"/><g transform="rotate(180,${gcx},${gcy})"><path d="${piecePath(N2,PAD,PAD)}" fill="${c2}" stroke="${o2}" stroke-width="2"/></g>`;circs=holes(N1,PAD,PAD,o1)+`<g transform="rotate(180,${gcx},${gcy})">${holes(N2,PAD,PAD,o2)}</g>`;svgW=5*CW+PAD*2;svgH=2*CH+PAD*2;}
  else{const p2x=PAD+pW(N1)+PIECE_GAP,c1=niColour(N1),o1=nrDarkenHex(c1),c2=niColour(N2),o2=nrDarkenHex(c2);paths=`<path d="${piecePath(N1,PAD,PAD)}" fill="${c1}" stroke="${o1}" stroke-width="2"/><path d="${piecePath(N2,p2x,PAD)}" fill="${c2}" stroke="${o2}" stroke-width="2"/>`;circs=holes(N1,PAD,PAD,o1)+holes(N2,p2x,PAD,o2);svgW=p2x+pW(N2)+PAD;svgH=Math.max(pH(N1),pH(N2))+PAD*2;}
  return`<svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="width:${svgW}px;height:auto;max-width:100%">${paths}${circs}</svg>`;
}

function nrRenderFromCfg(cfg){
  if(!cfg||!cfg.n)return'';
  if(cfg.rep==='frames')return nrRenderFrames(cfg);
  if(cfg.rep==='beads')return nrRenderBeads(cfg);
  if(cfg.rep==='multilink')return nrRenderMultilink(cfg);
  if(cfg.rep==='numicon')return nrRenderNumicon(cfg);
  return'';
}

function autoPreviewNR(){
  if(activeTool!=='nr')return;
  const box=document.getElementById('nr-preview');
  try{const cfg=getNRConfig();box.innerHTML=nrRenderFromCfg(cfg)||'<p class="preview-empty">Select a number above to preview.</p>';}
  catch(e){console.error('NR preview error:',e);box.innerHTML='<p class="preview-empty">Preview error: '+e.message+'</p>';}
}

function getNRConfig(){
  return{n:nr_N,rep:nr_rep,fType:nr_fType,fc1:nr_fc1,fc2:nr_fc2,fSplitOn:nr_fSplitOn,fSplit:nr_fSplit,bg:nr_bg,ba:nr_ba,bb:nr_bb,beadPreset:nr_beadPreset,mc:nr_mc,mc2:nr_mc2,mlRows:nr_mlRows,mlFill:nr_mlFill,mlGap:nr_mlGap,mlSplitOn:nr_mlSplitOn,mlSplit:nr_mlSplit,niSplitOn:nr_niSplitOn,niSplit:nr_niSplit};
}

function restoreNRConfig(cfg){
  if(!cfg||!cfg.n)return;
  nr_N=cfg.n||5;nr_rep=cfg.rep||'frames';nr_fType=cfg.fType||'5';nr_fc1=cfg.fc1??0;nr_fc2=cfg.fc2??4;
  nr_fSplitOn=cfg.fSplitOn||false;nr_fSplit=cfg.fSplit||5;
  nr_bg=cfg.bg||5;nr_ba=cfg.ba??4;nr_bb=cfg.bb??0;nr_beadPreset=cfg.beadPreset||'colour';
  nr_mc=cfg.mc??4;nr_mc2=cfg.mc2??0;nr_mlRows=cfg.mlRows||'10';nr_mlFill=cfg.mlFill||'row';
  nr_mlGap=cfg.mlGap||false;nr_mlSplitOn=cfg.mlSplitOn||false;nr_mlSplit=cfg.mlSplit||5;
  nr_niSplitOn=cfg.niSplitOn||false;nr_niSplit=cfg.niSplit||5;
  document.getElementById('nr-num-in').value=nr_N;
  document.querySelectorAll('[data-nrrep]').forEach(b=>b.classList.toggle('active',b.dataset.nrrep===nr_rep));
  ['frames','beads','multilink','numicon'].forEach(x=>{const el=document.getElementById('nr-opts-'+x);if(el)el.style.display=x===nr_rep?'':'none';});
  document.querySelectorAll('[data-nrft]').forEach(b=>b.classList.toggle('active',b.dataset.nrft===nr_fType));
  document.querySelectorAll('[data-nrfsp]').forEach(b=>b.classList.toggle('active',b.dataset.nrfsp===(nr_fSplitOn?'on':'off')));
  document.getElementById('nr-fsplit-row').style.display=nr_fSplitOn?'':'none';
  document.getElementById('nr-fsplit-in').value=nr_fSplit;
  document.querySelectorAll('[data-nrbp]').forEach(b=>b.classList.toggle('active',b.dataset.nrbp===nr_beadPreset));
  document.querySelectorAll('[data-nrbg]').forEach(b=>b.classList.toggle('active',b.dataset.nrbg==String(nr_bg)));
  document.querySelectorAll('[data-nrml]').forEach(b=>b.classList.toggle('active',b.dataset.nrml===nr_mlRows));
  const fr=document.getElementById('nr-ml-fill-row');if(fr)fr.style.display=nr_mlRows==='5'?'':'none';
  document.querySelectorAll('[data-nrmf]').forEach(b=>b.classList.toggle('active',b.dataset.nrmf===nr_mlFill));
  document.querySelectorAll('[data-nrmsp]').forEach(b=>b.classList.toggle('active',b.dataset.nrmsp===(nr_mlSplitOn?'on':'off')));
  document.getElementById('nr-mlsplit-row').style.display=nr_mlSplitOn?'':'none';
  document.getElementById('nr-mlsplit-in').value=nr_mlSplit;
  document.querySelectorAll('[data-nrnsp]').forEach(b=>b.classList.toggle('active',b.dataset.nrnsp===(nr_niSplitOn?'on':'off')));
  document.getElementById('nr-nisplit-row').style.display=nr_niSplitOn?'':'none';
  document.getElementById('nr-nisplit-in').value=nr_niSplit;
  ['nr-sw-fc1','nr-sw-fc2','nr-sw-ba','nr-sw-bb','nr-sw-mc','nr-sw-mc2'].forEach((id,idx)=>{
    const val=[nr_fc1,nr_fc2,nr_ba,nr_bb,nr_mc,nr_mc2][idx];
    const el=document.getElementById(id);if(!el)return;
    el.querySelectorAll('.swatch').forEach((b,i)=>b.classList.toggle('selected',i===val));
  });
  autoPreviewNR();
}


