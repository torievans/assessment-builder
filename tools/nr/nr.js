/* tools/nr.js — Number Representations tool
 * Depends on: tools/shared.js (NR_STROKES, NR_NUMICON_COLOURS, nrDarkenHex,
 *             nrRenderFrames, nrRenderBeads, nrRenderMultilink,
 *             nrRenderNumicon, nrRenderFromCfg)
 * Globals from builder: activeTool
 *
 * This file handles state, UI, and config only.
 * All SVG rendering lives in shared.js.
 */

/* ── Number Representations helpers ── */

// NR state
let nr_N=5,nr_rep='frames',nr_fType='5',nr_fc1=0,nr_fc2=4,nr_fSplitOn=false,nr_fSplit=5;
let nr_bg=5,nr_ba=4,nr_bb=0,nr_beadPreset='colour';
let nr_mc=4,nr_mc2=0,nr_mlRows='10',nr_mlFill='row',nr_mlGap=false,nr_mlSplitOn=false,nr_mlSplit=5;
let nr_niSplitOn=false,nr_niSplit=5;

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

// ── Panel HTML ─────────────────────────────────────────────────
function nrPanelHTML(){
  return `<div class="form-row">
              <div class="field field-grow"><label>Question text</label><input type="text" id="nr-text" placeholder="e.g. Show 7 on a ten frame."></div>
              <div class="field field-sm"><label>Answer</label><input type="text" id="nr-answer" placeholder="e.g. 7"></div>
            </div>
            <div class="form-row" style="align-items:center">
              <div class="field field-sm"><label>Number</label>
                <div style="display:flex;align-items:center;gap:4px">
                  <button class="tog-btn" onclick="nrChangeNum(-1)" style="width:30px;height:30px;padding:0">−</button>
                  <input type="number" id="nr-num-in" min="1" max="20" value="5" style="width:46px;text-align:center;border:1.5px solid #E2E5EA;border-radius:8px;padding:4px;font-size:14px" oninput="nrSetNum(parseInt(this.value))">
                  <button class="tog-btn" onclick="nrChangeNum(1)" style="width:30px;height:30px;padding:0">+</button>
                </div>
              </div>
              <div class="field"><label>Representation</label>
                <div class="tog-row">
                  <button class="tog-btn active" data-nrrep="frames" onclick="nrSetRep(this)">Frames</button>
                  <button class="tog-btn" data-nrrep="beads" onclick="nrSetRep(this)">Beads</button>
                  <button class="tog-btn" data-nrrep="multilink" onclick="nrSetRep(this)">Multilink</button>
                  <button class="tog-btn" data-nrrep="numicon" onclick="nrSetRep(this)">Numicon</button>
                </div>
              </div>
            </div>
            <!-- Sub-options: Frames -->
            <div id="nr-opts-frames">
              <div class="form-row">
                <div class="field"><label>Frame type</label>
                  <div class="tog-row">
                    <button class="tog-btn active" data-nrft="5" onclick="nrSetFT(this)">5-frame</button>
                    <button class="tog-btn" data-nrft="10" onclick="nrSetFT(this)">10-frame</button>
                  </div>
                </div>
                <div class="field"><label>Colour 1</label><div class="swatch-row" id="nr-sw-fc1"></div></div>
                <div class="field"><label>Split</label>
                  <div class="tog-row">
                    <button class="tog-btn active" data-nrfsp="off" onclick="nrSetFSplit(this,false)">Off</button>
                    <button class="tog-btn" data-nrfsp="on" onclick="nrSetFSplit(this,true)">On</button>
                  </div>
                </div>
              </div>
              <div id="nr-fsplit-row" class="form-row" style="display:none">
                <div class="field"><label>Colour 2</label><div class="swatch-row" id="nr-sw-fc2"></div></div>
                <div class="field field-sm"><label>Split at</label>
                  <div style="display:flex;align-items:center;gap:4px">
                    <button class="tog-btn" onclick="nrChangeFSplit(-1)" style="width:28px;height:28px;padding:0">−</button>
                    <input type="number" id="nr-fsplit-in" min="1" max="19" value="5" style="width:44px;text-align:center;border:1.5px solid #E2E5EA;border-radius:8px;padding:3px;font-size:13px" oninput="nrSetFSplitAt(parseInt(this.value))">
                    <button class="tog-btn" onclick="nrChangeFSplit(1)" style="width:28px;height:28px;padding:0">+</button>
                  </div>
                </div>
              </div>
            </div>
            <!-- Sub-options: Beads -->
            <div id="nr-opts-beads" style="display:none">
              <div class="form-row">
                <div class="field"><label>Preset</label>
                  <div class="tog-row">
                    <button class="tog-btn active" data-nrbp="colour" onclick="nrSetBeadPreset(this)">Colour</button>
                    <button class="tog-btn" data-nrbp="rw" onclick="nrSetBeadPreset(this)">R/W</button>
                  </div>
                </div>
                <div class="field"><label>Group size</label>
                  <div class="tog-row">
                    <button class="tog-btn" data-nrbg="2" onclick="nrSetBG(this)">2</button>
                    <button class="tog-btn active" data-nrbg="5" onclick="nrSetBG(this)">5</button>
                    <button class="tog-btn" data-nrbg="10" onclick="nrSetBG(this)">10</button>
                  </div>
                </div>
              </div>
              <div id="nr-bead-col-row" class="form-row">
                <div class="field"><label>Colour A</label><div class="swatch-row" id="nr-sw-ba"></div></div>
                <div class="field"><label>Colour B</label><div class="swatch-row" id="nr-sw-bb"></div></div>
              </div>
            </div>
            <!-- Sub-options: Multilink -->
            <div id="nr-opts-multilink" style="display:none">
              <div class="form-row">
                <div class="field"><label>Layout</label>
                  <div class="tog-row">
                    <button class="tog-btn active" data-nrml="10" onclick="nrSetML(this)">1×10</button>
                    <button class="tog-btn" data-nrml="5" onclick="nrSetML(this)">2×5</button>
                  </div>
                </div>
                <div id="nr-ml-fill-row" class="field" style="display:none"><label>Fill</label>
                  <div class="tog-row">
                    <button class="tog-btn active" data-nrmf="row" onclick="nrSetMLFill(this)">Row</button>
                    <button class="tog-btn" data-nrmf="col" onclick="nrSetMLFill(this)">Col</button>
                  </div>
                </div>
                <div class="field"><label>Colour</label><div class="swatch-row" id="nr-sw-mc"></div></div>
                <div class="field"><label>Split</label>
                  <div class="tog-row">
                    <button class="tog-btn active" data-nrmsp="off" onclick="nrSetMLSplit(this,false)">Off</button>
                    <button class="tog-btn" data-nrmsp="on" onclick="nrSetMLSplit(this,true)">On</button>
                  </div>
                </div>
                <div id="nr-ml-sep10-row" class="field" style="display:none"><label>Separate at 10</label>
                  <div class="tog-row">
                    <button class="tog-btn active" data-nrmsg="off" onclick="nrSetMLGap(this,false)">Off</button>
                    <button class="tog-btn" data-nrmsg="on" onclick="nrSetMLGap(this,true)">On</button>
                  </div>
                </div>
              </div>
              <div id="nr-mlsplit-row" class="form-row" style="display:none">
                <div class="field"><label>Colour 2</label><div class="swatch-row" id="nr-sw-mc2"></div></div>
                <div class="field field-sm"><label>Split at</label>
                  <div style="display:flex;align-items:center;gap:4px">
                    <button class="tog-btn" onclick="nrChangeMLSplit(-1)" style="width:28px;height:28px;padding:0">−</button>
                    <input type="number" id="nr-mlsplit-in" min="1" max="19" value="5" style="width:44px;text-align:center;border:1.5px solid #E2E5EA;border-radius:8px;padding:3px;font-size:13px" oninput="nrSetMLSplitAt(parseInt(this.value))">
                    <button class="tog-btn" onclick="nrChangeMLSplit(1)" style="width:28px;height:28px;padding:0">+</button>
                  </div>
                </div>
              </div>
            </div>
            <!-- Sub-options: Numicon -->
            <div id="nr-opts-numicon" style="display:none">
              <div class="form-row">
                <div class="field"><label>Split</label>
                  <div class="tog-row">
                    <button class="tog-btn active" data-nrnsp="off" onclick="nrSetNISplit(this,false)">Off</button>
                    <button class="tog-btn" data-nrnsp="on" onclick="nrSetNISplit(this,true)">On</button>
                  </div>
                </div>
              </div>
              <div id="nr-nisplit-row" class="form-row" style="display:none">
                <div class="field field-sm"><label>Split at</label>
                  <div style="display:flex;align-items:center;gap:4px">
                    <button class="tog-btn" onclick="nrChangeNISplit(-1)" style="width:28px;height:28px;padding:0">−</button>
                    <input type="number" id="nr-nisplit-in" min="1" max="10" value="5" style="width:44px;text-align:center;border:1.5px solid #E2E5EA;border-radius:8px;padding:3px;font-size:13px" oninput="nrSetNISplitAt(parseInt(this.value))">
                    <button class="tog-btn" onclick="nrChangeNISplit(1)" style="width:28px;height:28px;padding:0">+</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="preview-box" id="nr-preview"><p class="preview-empty">Select a number above to preview.</p></div>
            <div class="form-actions">
              <button class="btn-create-more" onclick="openSharedBatch('nr')">⊞ Create more like this</button>
              <button class="btn btn-blue" id="add-q-btn-nr" onclick="addToolQuestion('nr')">+ Add Question</button>
              <button class="btn btn-ghost" onclick="closeTool()">Cancel</button>
            </div>`;
}


