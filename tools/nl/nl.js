/* tools/nl.js — Number Line tool
 * Depends on: tools/shared.js (NL_PALETTE, NL_JUMP_PALETTE_NAMES, resolveNLColour, numberLineSVG)
 * Globals from builder: activeTool, activeId, nextQId, nuggetState, save,
 *   renderQuestions, renderSidebar, renderWorkflow, closeTool, esc
 */

// ── Constants ──────────────────────────────────────────────────
// NL_PAL: re-export shared palette (dark updated to match NL tool)
const NL_PAL      = NL_PALETTE;
const NL_SWATCH   = ['grey','red','orange','yellow','green','blue','purple','pink'];
const JP_SWATCH   = NL_JUMP_PALETTE_NAMES;
function resolveNLC(k){ return resolveNLColour(k); }

// ── State ──────────────────────────────────────────────────────
let nlStyle='through',nlColour='grey',nlJumpOpen=false,nlJump2Open=false;
let nlArcType='single',nlArcType2='single',nlArrow=true,nlArrow2=true;
let nlCircle='none',nlCircle2='none',nlJumpCol='dark',nlJump2Col='dark';

// ── Preview ────────────────────────────────────────────────────
function autoPreviewNL(){
  if(activeTool!=='nl')return;
  const box=document.getElementById('nl-preview');
  try{const cfg=getNLConfig();if(cfg)box.innerHTML=numberLineSVG(cfg);else box.innerHTML='<p class="preview-empty">Adjust start / end / goes up in to preview.</p>';}
  catch(e){box.innerHTML='<p class="preview-empty">Preview error.</p>';}
}

// ── Builder helpers ────────────────────────────────────────────
/* ── NL builder helpers ── */
function buildSwatches(rowId,names,palette,def,cb){
  const row=document.getElementById(rowId);if(!row)return;row.innerHTML='';
  names.forEach(n=>{const b=document.createElement('button');b.className='swatch'+(n===def?' selected':'');b.style.background=palette[n];b.title=n;b.onclick=()=>{row.querySelectorAll('.swatch').forEach(s=>s.classList.remove('selected'));b.classList.add('selected');cb(n);if(rowId.includes('nl')||rowId==='jump1-swatch-row'||rowId==='jump2-swatch-row')autoPreviewNL();else autoPreviewBM();};row.appendChild(b);});
}
function initNLPanel(){
  buildSwatches('nl-swatch-row',NL_SWATCH,NL_PAL,'grey',n=>{nlColour=n;});
  buildSwatches('jump1-swatch-row',JP_SWATCH,NL_PAL,'dark',n=>{nlJumpCol=n;});
  buildSwatches('jump2-swatch-row',JP_SWATCH,NL_PAL,'dark',n=>{nlJump2Col=n;});
  document.querySelectorAll('.tog-btn[data-style]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tog-btn[data-style]').forEach(x=>x.classList.remove('active'));b.classList.add('active');nlStyle=b.dataset.style;autoPreviewNL();}));
  document.querySelectorAll('.tog-btn[data-arctype]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tog-btn[data-arctype]').forEach(x=>x.classList.remove('active'));b.classList.add('active');nlArcType=b.dataset.arctype;autoPreviewNL();}));
  document.querySelectorAll('.tog-btn[data-arrow]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tog-btn[data-arrow]').forEach(x=>x.classList.remove('active'));b.classList.add('active');nlArrow=b.dataset.arrow==='yes';autoPreviewNL();}));
  document.querySelectorAll('.tog-btn[data-circle]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tog-btn[data-circle]').forEach(x=>x.classList.remove('active'));b.classList.add('active');nlCircle=b.dataset.circle;autoPreviewNL();}));
  document.querySelectorAll('.tog-btn[data-arctype2]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tog-btn[data-arctype2]').forEach(x=>x.classList.remove('active'));b.classList.add('active');nlArcType2=b.dataset.arctype2;autoPreviewNL();}));
  document.querySelectorAll('.tog-btn[data-arrow2]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tog-btn[data-arrow2]').forEach(x=>x.classList.remove('active'));b.classList.add('active');nlArrow2=b.dataset.arrow2==='yes';autoPreviewNL();}));
  document.querySelectorAll('.tog-btn[data-circle2]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tog-btn[data-circle2]').forEach(x=>x.classList.remove('active'));b.classList.add('active');nlCircle2=b.dataset.circle2;autoPreviewNL();}));
  ['nl-answer','f-start','f-end','f-step','f-vge','f-hide-from','f-hide-to'].forEach(id=>document.getElementById(id)?.addEventListener('input',autoPreviewNL));
  setupJumpCalc('f-from','f-to','f-jump-label');
  setupJumpCalc('f-from2','f-to2','f-jump-label2');
}
function parseJL(s){if(!s||!s.trim())return NaN;return parseFloat(s.trim().replace(/^\+/,''));}
function fmtJL(d){if(!isFinite(d))return'';const n=Math.round(d*1000)/1000;return(n>=0?'+':'')+n;}
function setupJumpCalc(fId,tId,lId){
  const f=document.getElementById(fId),t=document.getElementById(tId),l=document.getElementById(lId);if(!f||!t||!l)return;
  const upd=()=>{const fv=parseFloat(f.value),tv=parseFloat(t.value),lv=parseJL(l.value);if(!isNaN(fv)&&!isNaN(tv))l.value=fmtJL(tv-fv);else if(!isNaN(fv)&&!isNaN(lv))t.value=fv+lv;else if(!isNaN(tv)&&!isNaN(lv))f.value=tv-lv;autoPreviewNL();};
  f.addEventListener('input',upd);t.addEventListener('input',upd);l.addEventListener('input',upd);
}
function nlToggleJump(){nlJumpOpen=!nlJumpOpen;const s=document.getElementById('jump-section'),b=document.getElementById('jump-toggle-btn');s.style.display=nlJumpOpen?'block':'none';b.style.display=nlJumpOpen?'none':'';if(!nlJumpOpen&&nlJump2Open)nlToggleJump2();autoPreviewNL();}
function nlToggleJump2(){nlJump2Open=!nlJump2Open;const s=document.getElementById('jump2-section'),b=document.getElementById('jump2-toggle-btn');s.style.display=nlJump2Open?'block':'none';b.style.display=nlJump2Open?'none':'';if(!nlJump2Open)['f-from2','f-to2','f-jump-label2'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});autoPreviewNL();}
function getNLConfig(){
  const start=parseFloat(document.getElementById('f-start').value),end=parseFloat(document.getElementById('f-end').value),step=parseFloat(document.getElementById('f-step').value),vge=parseFloat(document.getElementById('f-vge').value),hF=parseFloat(document.getElementById('f-hide-from').value),hT=parseFloat(document.getElementById('f-hide-to').value);
  if(isNaN(start)||isNaN(end)||isNaN(step)||step<=0)return null;const p=Math.round((end-start)/step);if(p<=0)return null;
  const ans=document.getElementById('nl-answer').value.trim()||undefined;
  const cfg={start,end,partitions:p,valuesGivenEvery:vge,answer:ans,lineStyle:nlStyle,colour:nlColour,hideFrom:isNaN(hF)?undefined:hF,hideTo:isNaN(hT)?undefined:hT};
  if(nlJumpOpen){const from=parseFloat(document.getElementById('f-from').value),to=parseFloat(document.getElementById('f-to').value),lbl=document.getElementById('f-jump-label').value.trim();if(!isNaN(from)&&!isNaN(to)&&from!==to){cfg.jumpFrom=from;cfg.jumpTo=to;cfg.jumpType=nlArcType;cfg.jumpLabel=lbl;cfg.jumpArrow=nlArrow;cfg.jumpCircle=nlCircle;cfg.jumpColour=nlJumpCol;}if(nlJump2Open){const from2=parseFloat(document.getElementById('f-from2').value),to2=parseFloat(document.getElementById('f-to2').value),lbl2=document.getElementById('f-jump-label2').value.trim();if(!isNaN(from2)&&!isNaN(to2)&&from2!==to2){cfg.jump2From=from2;cfg.jump2To=to2;cfg.jump2Type=nlArcType2;cfg.jump2Label=lbl2;cfg.jump2Arrow=nlArrow2;cfg.jump2Circle=nlCircle2;cfg.jump2Colour=nlJump2Col;}}}
  return cfg;
}

/* ── NL Batch panel ── */
let batchRowIdx=0,batchHasJump=false,batchHasJump2=false,batchStructure={},batchDefaultNums={start:0,end:20,step:1};
const batchRowColours={};
const BATCH_PALETTE=NL_PAL;
function openBatchPanel(){
  const cfg=getNLConfig();if(!cfg){alert('Please fill in Start, End and "Goes up in" first.');return;}
  batchHasJump=cfg.jumpFrom!==undefined;batchHasJump2=cfg.jump2From!==undefined;
  batchDefaultNums={start:cfg.start,end:cfg.end,step:parseFloat(document.getElementById('f-step').value)};
  batchStructure={lineStyle:cfg.lineStyle,colour:cfg.colour,valuesGivenEvery:cfg.valuesGivenEvery,
    jumpType:cfg.jumpType,jumpArrow:cfg.jumpArrow,jumpCircle:cfg.jumpCircle,jumpColour:cfg.jumpColour,
    jump2Type:cfg.jump2Type,jump2Arrow:cfg.jump2Arrow,jump2Circle:cfg.jump2Circle,jump2Colour:cfg.jump2Colour};
  const tagsEl=document.getElementById('batch-locked-tags');tagsEl.innerHTML='';
  const tags=[`Line: ${cfg.lineStyle}`];
  if(batchHasJump)tags.push(`Jump 1: ${cfg.jumpType} arc`);
  if(batchHasJump2)tags.push(`Jump 2: ${cfg.jump2Type} arc`);
  tags.forEach(t=>{const span=document.createElement('span');span.className='locked-tag';span.textContent=t;tagsEl.appendChild(span);});
  buildBatchHeaders();
  document.getElementById('batch-tbody').innerHTML='';batchRowIdx=0;
  addBatchRow({text:document.getElementById('nl-text').value.trim(),start:cfg.start,end:cfg.end,
    step:parseFloat(document.getElementById('f-step').value),answer:document.getElementById('nl-answer').value.trim(),
    jumpFrom:cfg.jumpFrom,jumpTo:cfg.jumpTo,jumpLabel:cfg.jumpLabel,
    jump2From:cfg.jump2From,jump2To:cfg.jump2To,jump2Label:cfg.jump2Label,
    colour:cfg.colour,jumpColour:cfg.jumpColour,jump2Colour:cfg.jump2Colour});
  const panel=document.getElementById('nl-batch-panel');panel.style.display='block';
  panel.scrollIntoView({behavior:'smooth',block:'start'});
}
function closeBatchPanel(){document.getElementById('nl-batch-panel').style.display='none';}
function buildBatchHeaders(){
  const tr=document.getElementById('batch-thead-row');
  const cols=['Preview','Question',  'Start','End','Step'];
  if(batchHasJump)cols.push('J1 From','J1 To','J1 Label');
  if(batchHasJump2)cols.push('J2 From','J2 To','J2 Label');
  cols.push('Answer','');
  tr.innerHTML=cols.map(c=>`<th>${c}</th>`).join('');
}
function addBatchRow(defaults={}){
  const idx=batchRowIdx++;const tbody=document.getElementById('batch-tbody');const tr=document.createElement('tr');tr.dataset.rowIdx=idx;
  const n=(field,val)=>`<input data-field="${field}" class="batch-input batch-input-num" type="number" value="${val??''}" step="any" oninput="updateBatchPreview(${idx})">`;
  const t=(field,val,cls='')=>`<input data-field="${field}" class="batch-input ${cls}" type="text" value="${val??''}" oninput="updateBatchPreview(${idx})">`;
  let cells=`<td class="batch-preview-cell"><div id="bp-${idx}"></div></td>`;
  cells+=`<td>${t('text',defaults.text??'','batch-input-text')}</td>`;
  cells+=`<td>${n('start',defaults.start??batchDefaultNums.start)}</td>`;
  cells+=`<td>${n('end',defaults.end??batchDefaultNums.end)}</td>`;
  cells+=`<td>${n('step',defaults.step??batchDefaultNums.step)}</td>`;
  if(batchHasJump){cells+=`<td>${n('jumpFrom',defaults.jumpFrom)}</td>`;cells+=`<td>${n('jumpTo',defaults.jumpTo)}</td>`;cells+=`<td>${t('jumpLabel',defaults.jumpLabel??'','batch-input-lbl')}</td>`;}
  if(batchHasJump2){cells+=`<td>${n('jump2From',defaults.jump2From)}</td>`;cells+=`<td>${n('jump2To',defaults.jump2To)}</td>`;cells+=`<td>${t('jump2Label',defaults.jump2Label??'','batch-input-lbl')}</td>`;}
  cells+=`<td>${t('answer',defaults.answer??'','batch-input-num')}</td>`;
  cells+=`<td><button class="batch-del-btn" onclick="this.closest('tr').remove()">✕</button></td>`;
  tr.innerHTML=cells;tbody.appendChild(tr);buildBatchSwatches(idx,defaults);setTimeout(()=>updateBatchPreview(idx),0);
}
function buildBatchSwatches(idx,defaults){
  batchRowColours[idx]={colour:defaults.colour??batchStructure.colour??'grey',jumpColour:defaults.jumpColour??batchStructure.jumpColour??'dark',jump2Colour:defaults.jump2Colour??batchStructure.jump2Colour??'dark'};
  const cell=document.querySelector(`tr[data-row-idx="${idx}"] .batch-preview-cell`);
  const wrap=document.createElement('div');wrap.className='batch-swatch-wrap';
  wrap.appendChild(makeMiniSwatchRow(idx,'Line','colour',batchRowColours[idx].colour,NL_SWATCH));
  if(batchHasJump)wrap.appendChild(makeMiniSwatchRow(idx,'J1','jumpColour',batchRowColours[idx].jumpColour,JP_SWATCH));
  if(batchHasJump2)wrap.appendChild(makeMiniSwatchRow(idx,'J2','jump2Colour',batchRowColours[idx].jump2Colour,JP_SWATCH));
  cell.appendChild(wrap);
}
function makeMiniSwatchRow(idx,label,field,defCol,paletteNames){
  const row=document.createElement('div');row.className='batch-mini-swatch-row';
  const lbl=document.createElement('span');lbl.className='batch-swatch-label';lbl.textContent=label;row.appendChild(lbl);
  paletteNames.forEach(name=>{const btn=document.createElement('button');btn.className='mini-swatch'+(name===defCol?' selected':'');btn.style.background=NL_PAL[name];btn.title=name;btn.addEventListener('click',()=>{row.querySelectorAll('.mini-swatch').forEach(s=>s.classList.remove('selected'));btn.classList.add('selected');batchRowColours[idx][field]=name;updateBatchPreview(idx);});row.appendChild(btn);});
  return row;
}
function getBatchRowData(tr){
  const g=field=>tr.querySelector(`[data-field="${field}"]`)?.value.trim()??'';
  const start=parseFloat(g('start')),end=parseFloat(g('end')),step=parseFloat(g('step'));
  if(isNaN(start)||isNaN(end)||isNaN(step)||step<=0)return null;
  const partitions=Math.round((end-start)/step);if(partitions<=0)return null;
  const idx=parseInt(tr.dataset.rowIdx);const colours=batchRowColours[idx]||{};
  const cfg={...batchStructure,start,end,partitions,colour:colours.colour??batchStructure?.colour,jumpColour:colours.jumpColour??batchStructure?.jumpColour,jump2Colour:colours.jump2Colour??batchStructure?.jump2Colour};
  const ans=g('answer');if(ans)cfg.answer=ans;
  if(batchHasJump){const from=parseFloat(g('jumpFrom')),to=parseFloat(g('jumpTo'));if(!isNaN(from)&&!isNaN(to)&&from!==to){cfg.jumpFrom=from;cfg.jumpTo=to;cfg.jumpLabel=g('jumpLabel');}}
  if(batchHasJump2){const from2=parseFloat(g('jump2From')),to2=parseFloat(g('jump2To'));if(!isNaN(from2)&&!isNaN(to2)&&from2!==to2){cfg.jump2From=from2;cfg.jump2To=to2;cfg.jump2Label=g('jump2Label');}}
  return{text:g('text'),answer:ans||undefined,cfg};
}
function updateBatchPreview(idx){
  const tr=document.querySelector(`tr[data-row-idx="${idx}"]`);const box=document.getElementById(`bp-${idx}`);
  if(!tr||!box)return;const data=getBatchRowData(tr);
  if(!data){box.innerHTML='<div class="batch-no-preview">Invalid</div>';return;}
  try{box.innerHTML=numberLineSVG(data.cfg);}catch(e){box.innerHTML='<div class="batch-no-preview">Error</div>';}
}
function addAllBatchQuestions(){
  if(!activeId)return;let added=0;
  document.querySelectorAll('#batch-tbody tr').forEach(tr=>{
    const data=getBatchRowData(tr);if(!data)return;
    if(!data.text){return;}
    if(!data.answer){return;}
    const id=nextQId++;const q={id,text:data.text,answer:data.answer,type:'exact',image:'',display:'',qaComment:'',visualType:'nl',cfg:data.cfg};
    nuggetState[activeId].questions.push(q);added++;
  });
  if(!added){alert('No valid rows to add — each row needs Question text and Answer.');return;}
  if(nuggetState[activeId].status==='not-started')nuggetState[activeId].status='in-progress';
  save();renderQuestions();renderSidebar();renderWorkflow();closeBatchPanel();closeTool();
}

// ── Restore config ─────────────────────────────────────────────
function restoreNLConfig(cfg){
  // Numeric fields
  document.getElementById('f-start').value=cfg.start??0;
  document.getElementById('f-end').value=cfg.end??20;
  const step=cfg.partitions>0?Math.round(((cfg.end-cfg.start)/cfg.partitions)*10000)/10000:1;
  document.getElementById('f-step').value=step;
  document.getElementById('f-vge').value=cfg.valuesGivenEvery??'';
  document.getElementById('f-hide-from').value=cfg.hideFrom??'';
  document.getElementById('f-hide-to').value=cfg.hideTo??'';
  // Line style toggle
  nlStyle=cfg.lineStyle||'through';
  document.querySelectorAll('.tog-btn[data-style]').forEach(b=>b.classList.toggle('active',b.dataset.style===nlStyle));
  // Colour swatch
  nlColour=cfg.colour||'grey';
  document.querySelectorAll('#nl-swatch-row .swatch').forEach(b=>b.classList.toggle('selected',b.title===nlColour));
  // Close any open jump sections first so we can re-open cleanly
  if(nlJump2Open)nlToggleJump2();
  if(nlJumpOpen)nlToggleJump();
  // Jump 1
  if(cfg.jumpFrom!==undefined&&cfg.jumpTo!==undefined){
    nlToggleJump();
    document.getElementById('f-from').value=cfg.jumpFrom;
    document.getElementById('f-to').value=cfg.jumpTo;
    document.getElementById('f-jump-label').value=cfg.jumpLabel||'';
    nlArcType=cfg.jumpType||'single';
    document.querySelectorAll('.tog-btn[data-arctype]').forEach(b=>b.classList.toggle('active',b.dataset.arctype===nlArcType));
    nlArrow=cfg.jumpArrow!==false;
    document.querySelectorAll('.tog-btn[data-arrow]').forEach(b=>b.classList.toggle('active',b.dataset.arrow===(nlArrow?'yes':'no')));
    nlCircle=cfg.jumpCircle||'none';
    document.querySelectorAll('.tog-btn[data-circle]').forEach(b=>b.classList.toggle('active',b.dataset.circle===nlCircle));
    nlJumpCol=cfg.jumpColour||'dark';
    document.querySelectorAll('#jump1-swatch-row .swatch').forEach(b=>b.classList.toggle('selected',b.title===nlJumpCol));
    // Jump 2
    if(cfg.jump2From!==undefined&&cfg.jump2To!==undefined){
      nlToggleJump2();
      document.getElementById('f-from2').value=cfg.jump2From;
      document.getElementById('f-to2').value=cfg.jump2To;
      document.getElementById('f-jump-label2').value=cfg.jump2Label||'';
      nlArcType2=cfg.jump2Type||'single';
      document.querySelectorAll('.tog-btn[data-arctype2]').forEach(b=>b.classList.toggle('active',b.dataset.arctype2===nlArcType2));
      nlArrow2=cfg.jump2Arrow!==false;
      document.querySelectorAll('.tog-btn[data-arrow2]').forEach(b=>b.classList.toggle('active',b.dataset.arrow2===(nlArrow2?'yes':'no')));
      nlCircle2=cfg.jump2Circle||'none';
      document.querySelectorAll('.tog-btn[data-circle2]').forEach(b=>b.classList.toggle('active',b.dataset.circle2===nlCircle2));
      nlJump2Col=cfg.jump2Colour||'dark';
      document.querySelectorAll('#jump2-swatch-row .swatch').forEach(b=>b.classList.toggle('selected',b.title===nlJump2Col));
    }
  }
  autoPreviewNL();
}

// ── Panel HTML ─────────────────────────────────────────────────
function nlPanelHTML(){
  return `<div class="form-row">
              <div class="field field-grow"><label>Question text</label><input type="text" id="nl-text" placeholder="e.g. What number is missing?"></div>
              <div class="field field-sm"><label>Answer</label><input type="text" id="nl-answer" placeholder="e.g. 7"></div>
            </div>
            <div class="form-row">
              <div class="field field-sm"><label>Start</label><input type="number" id="f-start" value="0"></div>
              <div class="field field-sm"><label>End</label><input type="number" id="f-end" value="20"></div>
              <div class="field field-sm"><label>Goes up in</label><input type="number" id="f-step" value="1" min="0.001" step="any"></div>
              <div class="field field-sm"><label>Label every</label><input type="number" id="f-vge" placeholder="all" step="any"></div>
              <div class="field field-sm"><label>Hide from</label><input type="number" id="f-hide-from" placeholder="none" step="any"></div>
              <div class="field field-sm"><label>Hide to</label><input type="number" id="f-hide-to" placeholder="none" step="any"></div>
            </div>
            <div class="form-row">
              <div class="field"><label>Style</label><div class="tog-row"><button class="tog-btn active" data-style="through">Through</button><button class="tog-btn" data-style="terminate">Terminate</button></div></div>
              <div class="field"><label>Colour</label><div class="swatch-row" id="nl-swatch-row"></div></div>
            </div>
            <button class="jump-toggle" id="jump-toggle-btn" onclick="nlToggleJump()">＋ Add jumps</button>
            <div id="jump-section">
              <div class="sec-hr"></div>
              <div class="sec-label">Jump 1</div>
              <div class="form-row">
                <div class="field field-sm"><label>From</label><input type="number" id="f-from" step="any"></div>
                <div class="field field-sm"><label>To</label><input type="number" id="f-to" step="any"></div>
                <div class="field"><label>Arc type</label><div class="tog-row"><button class="tog-btn active" data-arctype="single">Single arc</button><button class="tog-btn" data-arctype="unit">Unit arcs</button></div></div>
                <div class="field field-sm"><label>Label</label><input type="text" id="f-jump-label" placeholder="+3"></div>
                <div class="field"><label>Arrow</label><div class="tog-row"><button class="tog-btn active" data-arrow="yes">Yes</button><button class="tog-btn" data-arrow="no">No</button></div></div>
                <div class="field"><label>Circle</label><div class="tog-row"><button class="tog-btn active" data-circle="none">None</button><button class="tog-btn" data-circle="start">Start</button><button class="tog-btn" data-circle="end">End</button></div></div>
                <div class="field"><label>Colour</label><div class="swatch-row" id="jump1-swatch-row"></div></div>
              </div>
              <button class="jump-toggle open" onclick="nlToggleJump()" style="margin-top:6px">✕ Remove jump</button>
              <button class="jump-toggle" id="jump2-toggle-btn" style="margin-top:4px" onclick="nlToggleJump2()">＋ Add second jump</button>
              <div id="jump2-section">
                <div class="sec-hr" style="margin:10px 0"></div>
                <div class="sec-label">Jump 2</div>
                <div class="form-row">
                  <div class="field field-sm"><label>From</label><input type="number" id="f-from2" step="any"></div>
                  <div class="field field-sm"><label>To</label><input type="number" id="f-to2" step="any"></div>
                  <div class="field"><label>Arc type</label><div class="tog-row"><button class="tog-btn active" data-arctype2="single">Single arc</button><button class="tog-btn" data-arctype2="unit">Unit arcs</button></div></div>
                  <div class="field field-sm"><label>Label</label><input type="text" id="f-jump-label2" placeholder="+4"></div>
                  <div class="field"><label>Arrow</label><div class="tog-row"><button class="tog-btn active" data-arrow2="yes">Yes</button><button class="tog-btn" data-arrow2="no">No</button></div></div>
                  <div class="field"><label>Circle</label><div class="tog-row"><button class="tog-btn active" data-circle2="none">None</button><button class="tog-btn" data-circle2="start">Start</button><button class="tog-btn" data-circle2="end">End</button></div></div>
                  <div class="field"><label>Colour</label><div class="swatch-row" id="jump2-swatch-row"></div></div>
                </div>
                <button class="jump-toggle open" onclick="nlToggleJump2()" style="margin-top:6px">✕ Remove second jump</button>
              </div>
            </div>
            <div class="preview-box" id="nl-preview"><p class="preview-empty">Fill in settings above to preview.</p></div>
            <div class="form-actions">
              <button class="btn-create-more" onclick="openBatchPanel()">⊞ Create more like this</button>
              <button class="btn btn-blue" id="add-q-btn-nl" onclick="addToolQuestion('nl')">+ Add Question</button>
              <button class="btn btn-ghost" onclick="closeTool()">Cancel</button>
            </div>`;
}

