/* tools/bm.js — Bar Model tool
 * Depends on: tools/shared.js (BM_BOX_COLORS, BM_BAR_LIGHT_FILLS, BM_BOX_TEXT_COLORS, barModelSVG)
 * Globals from builder: activeTool
 */

// ── Constants ──────────────────────────────────────────────────
// BM aliases
const BM_STROKES  = BM_BOX_COLORS;
const BM_FILLS    = BM_BAR_LIGHT_FILLS;
const BM_TEXTS    = BM_BOX_TEXT_COLORS;

// ── State ──────────────────────────────────────────────────────
let bmColIdx=0,bmMulti=false,bmTotDisp='brace',bmSeg3=false,bmSegT={1:'fill',2:'fill',3:'fill'};
let bmDivided=false;
// ── Preview ────────────────────────────────────────────────────
function autoPreviewBM(){
  if(activeTool!=='bm')return;
  const box=document.getElementById('bm-preview');
  try{const cfg=getBMConfig();if(cfg)box.innerHTML=barModelSVG(cfg);else box.innerHTML='<p class="preview-empty">Fill in segment values above to preview.</p>';}
  catch(e){box.innerHTML='<p class="preview-empty">Preview error.</p>';}
}

// ── Builder helpers ────────────────────────────────────────────
/* ── BM builder helpers ── */
function initBMPanel(){
  buildSwatches('bm-swatch-row',BM_STROKES.map((_,i)=>i),Object.fromEntries(BM_STROKES.map((c,i)=>[i,c])),0,n=>{bmColIdx=parseInt(n);});
  document.querySelectorAll('.tog-btn[data-totdisp]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tog-btn[data-totdisp]').forEach(x=>x.classList.remove('active'));b.classList.add('active');bmTotDisp=b.dataset.totdisp;autoPreviewBM();}));
  document.querySelectorAll('.tog-btn[data-colmode]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tog-btn[data-colmode]').forEach(x=>x.classList.remove('active'));b.classList.add('active');bmMulti=b.dataset.colmode==='multi';autoPreviewBM();}));
  document.querySelectorAll('.tog-btn[data-bmseg]').forEach(b=>b.addEventListener('click',()=>{const seg=parseInt(b.dataset.bmseg);document.querySelectorAll(`.tog-btn[data-bmseg="${seg}"]`).forEach(x=>x.classList.remove('active'));b.classList.add('active');bmSegT[seg]=b.dataset.segtype;autoPreviewBM();}));
  ['bm-total','bm-seg1-val','bm-seg1-lbl','bm-seg1-brace','bm-seg2-val','bm-seg2-lbl','bm-seg2-brace','bm-seg3-val','bm-seg3-lbl','bm-seg3-brace'].forEach(id=>document.getElementById(id)?.addEventListener('input',autoPreviewBM));
}
function parseBMV(s){if(!s||s.trim()==='')return undefined;const t=s.trim();if(t==='?')return'?';const n=Number(t);return isNaN(n)?t:n;}
function getBMConfig(){
  // Default total to '?' when empty — matches standalone bar-model-creator behaviour
  const totalRaw=document.getElementById('bm-total').value.trim();
  const total=totalRaw===''?'?':parseBMV(totalRaw);
  const mkSeg=n=>{const v=parseBMV(document.getElementById(`bm-seg${n}-val`).value);if(v===undefined)return null;const sg={value:v};const l=document.getElementById(`bm-seg${n}-lbl`).value.trim();const b=document.getElementById(`bm-seg${n}-brace`).value.trim();if(l)sg.segLabel=l;if(b)sg.braceLabel=b;if(bmSegT[n]==='blank')sg.blank=true;return sg;};
  const segs=[mkSeg(1),mkSeg(2)].filter(Boolean);if(bmSeg3){const s3=mkSeg(3);if(s3)segs.push(s3);}if(!segs.length)return null;
  return{segments:segs,total,colorIdx:bmColIdx,multi:bmMulti||undefined,topBar:bmTotDisp==='top bar'||undefined,hideTotal:bmTotDisp==='none'||undefined};
}
function bmToggleSeg3(show){bmSeg3=show;document.getElementById('bm-seg3-block').style.display=show?'block':'none';document.getElementById('bm-add-seg3').style.display=show?'none':'inline-flex';if(!show)['bm-seg3-val','bm-seg3-lbl','bm-seg3-brace'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});autoPreviewBM();}
function bmSetUnit(btn,val){document.querySelectorAll('[data-bmunit]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');bmDivided=(val==='on');['bm-seg1-lbl','bm-seg2-lbl','bm-seg3-lbl'].forEach(id=>{const el=document.getElementById(id);if(el){el.disabled=bmDivided;el.closest('.field').style.opacity=bmDivided?'0.4':'';}});autoPreviewBM();}
function bmGetNumericSum(){const s1=parseFloat(document.getElementById('bm-seg1-val')?.value)||0;const s2=parseFloat(document.getElementById('bm-seg2-val')?.value)||0;const s3=bmSeg3?(parseFloat(document.getElementById('bm-seg3-val')?.value)||0):0;return s1+s2+s3;}

// ── Restore config ─────────────────────────────────────────────
function restoreBMConfig(cfg){
  const segs=cfg.segments||[];
  // Total
  document.getElementById('bm-total').value=cfg.total??'';
  // Colour index
  bmColIdx=cfg.colorIdx??0;
  document.querySelectorAll('#bm-swatch-row .swatch').forEach((b,i)=>b.classList.toggle('selected',i===bmColIdx));
  // Colour mode
  bmMulti=!!cfg.multi;
  document.querySelectorAll('.tog-btn[data-colmode]').forEach(b=>b.classList.toggle('active',b.dataset.colmode===(bmMulti?'multi':'single')));
  // Total display
  bmTotDisp=cfg.topBar?'top bar':cfg.hideTotal?'none':'brace';
  document.querySelectorAll('.tog-btn[data-totdisp]').forEach(b=>b.classList.toggle('active',b.dataset.totdisp===bmTotDisp));
  // Segments
  const fillSeg=(n,sg)=>{
    document.getElementById(`bm-seg${n}-val`).value=sg?.value??'';
    document.getElementById(`bm-seg${n}-lbl`).value=sg?.segLabel??'';
    document.getElementById(`bm-seg${n}-brace`).value=sg?.braceLabel??'';
    bmSegT[n]=sg?.blank?'blank':'fill';
    document.querySelectorAll(`.tog-btn[data-bmseg="${n}"]`).forEach(b=>b.classList.toggle('active',b.dataset.segtype===bmSegT[n]));
  };
  fillSeg(1,segs[0]);fillSeg(2,segs[1]);
  if(segs.length>=3){if(!bmSeg3)bmToggleSeg3(true);fillSeg(3,segs[2]);}
  else{if(bmSeg3)bmToggleSeg3(false);}
  autoPreviewBM();
}

// ── Panel HTML ─────────────────────────────────────────────────
function bmPanelHTML(){
  return `<div class="form-row">
              <div class="field field-grow"><label>Question text</label><input type="text" id="bm-text" placeholder="e.g. What is the missing number?"></div>
              <div class="field field-sm"><label>Answer</label><input type="text" id="bm-answer" placeholder="e.g. 6"></div>
            </div>
            <div class="form-row">
              <div class="field"><label>Colour</label><div class="swatch-row" id="bm-swatch-row"></div></div>
              <div class="field"><label>Colour mode</label><div class="tog-row"><button class="tog-btn active" data-colmode="single">Single</button><button class="tog-btn" data-colmode="multi">Multi</button></div></div>
              <div class="field"><label>Total display</label><div class="tog-row"><button class="tog-btn active" data-totdisp="brace">Brace</button><button class="tog-btn" data-totdisp="top bar">Top bar</button><button class="tog-btn" data-totdisp="none">None</button></div></div>
              <div class="field field-sm"><label>Total</label><input type="text" id="bm-total" placeholder="e.g. 10 or ?"></div>
            </div>
            <div class="sec-hr"></div>
            <div class="seg-block">
              <div class="seg-hdr"><span class="seg-title">Segment 1</span><div class="tog-row"><button class="tog-btn active" data-bmseg="1" data-segtype="fill">Fill</button><button class="tog-btn" data-bmseg="1" data-segtype="blank">Blank</button></div></div>
              <div class="form-row"><div class="field field-sm"><label>Value</label><input type="text" id="bm-seg1-val" placeholder="4 or ?"></div><div class="field field-grow"><label>Bar label</label><input type="text" id="bm-seg1-lbl"></div><div class="field field-grow"><label>Brace label</label><input type="text" id="bm-seg1-brace"></div></div>
            </div>
            <div class="seg-block">
              <div class="seg-hdr"><span class="seg-title">Segment 2</span><div class="tog-row"><button class="tog-btn active" data-bmseg="2" data-segtype="fill">Fill</button><button class="tog-btn" data-bmseg="2" data-segtype="blank">Blank</button></div></div>
              <div class="form-row"><div class="field field-sm"><label>Value</label><input type="text" id="bm-seg2-val" placeholder="6 or ?"></div><div class="field field-grow"><label>Bar label</label><input type="text" id="bm-seg2-lbl"></div><div class="field field-grow"><label>Brace label</label><input type="text" id="bm-seg2-brace"></div></div>
            </div>
            <div class="seg-block" id="bm-seg3-block" style="display:none">
              <div class="seg-hdr"><span class="seg-title">Segment 3</span><div style="display:flex;gap:7px;align-items:center"><div class="tog-row"><button class="tog-btn active" data-bmseg="3" data-segtype="fill">Fill</button><button class="tog-btn" data-bmseg="3" data-segtype="blank">Blank</button></div><button class="btn btn-ghost" style="padding:3px 10px;font-size:11px" onclick="bmToggleSeg3(false)">✕ Remove</button></div></div>
              <div class="form-row"><div class="field field-sm"><label>Value</label><input type="text" id="bm-seg3-val" placeholder="3 or ?"></div><div class="field field-grow"><label>Bar label</label><input type="text" id="bm-seg3-lbl"></div><div class="field field-grow"><label>Brace label</label><input type="text" id="bm-seg3-brace"></div></div>
            </div>
            <button class="btn btn-ghost" id="bm-add-seg3" style="margin-bottom:4px;font-size:12px" onclick="bmToggleSeg3(true)">+ Third segment</button>
            <div class="preview-box" id="bm-preview"><p class="preview-empty">Fill in segment values above to preview.</p></div>
            <div class="form-actions">
              <button class="btn-create-more" onclick="openSharedBatch('bm')">⊞ Create more like this</button>
              <button class="btn btn-blue" id="add-q-btn-bm" onclick="addToolQuestion('bm')">+ Add Question</button>
              <button class="btn btn-ghost" onclick="closeTool()">Cancel</button>
            </div>`;
}

