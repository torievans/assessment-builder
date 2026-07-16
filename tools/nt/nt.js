/* tools/nt.js — Number Track tool
 * Depends on: tools/shared.js (numberTrackSVG)
 * Globals from builder: activeTool
 */

// ── State ──────────────────────────────────────────────────────
let ntShape='square',ntLayout='straight',ntColourMode='full';

// ── Functions ──────────────────────────────────────────────────
/* ── Number Track helpers ── */
function ntSetShape(btn){document.querySelectorAll('[data-ntshape]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');ntShape=btn.dataset.ntshape;autoPreviewNT();}
function ntSetLayout(btn){document.querySelectorAll('[data-ntlayout]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');ntLayout=btn.dataset.ntlayout;autoPreviewNT();}
function ntSetColMode(btn){document.querySelectorAll('[data-ntcolmode]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');ntColourMode=btn.dataset.ntcolmode;autoPreviewNT();}
function autoPreviewNT(){
  if(activeTool!=='nt')return;
  const box=document.getElementById('nt-preview');
  try{const cfg=getNTConfig();if(cfg)box.innerHTML=numberTrackSVG(cfg);else box.innerHTML='<p class="preview-empty">Fill in a sequence above to preview.</p>';}
  catch(e){console.error('NT preview error:',e);box.innerHTML='<p class="preview-empty">Preview error: '+e.message+'</p>';}
}
function getNTConfig(){
  const seq=document.getElementById('nt-seq').value.trim();
  if(!seq)return null;
  return{sequence:seq,shape:ntShape,layout:ntLayout,colourMode:ntColourMode};
}
function restoreNTConfig(cfg){
  document.getElementById('nt-seq').value=cfg.sequence||'1,2,3,?,5,6';
  ntShape=cfg.shape||'square';
  ntLayout=cfg.layout||'straight';
  ntColourMode=cfg.colourMode||'full';
  document.querySelectorAll('[data-ntshape]').forEach(b=>b.classList.toggle('active',b.dataset.ntshape===ntShape));
  document.querySelectorAll('[data-ntlayout]').forEach(b=>b.classList.toggle('active',b.dataset.ntlayout===ntLayout));
  document.querySelectorAll('[data-ntcolmode]').forEach(b=>b.classList.toggle('active',b.dataset.ntcolmode===ntColourMode));
  autoPreviewNT();
}

// ── Panel HTML ─────────────────────────────────────────────────
function ntPanelHTML(){
  return `<div class="form-row">
              <div class="field field-grow"><label>Question text</label><input type="text" id="nt-text" placeholder="e.g. What number is missing?"></div>
              <div class="field field-sm"><label>Answer</label><input type="text" id="nt-answer" placeholder="e.g. 7"></div>
            </div>
            <div class="form-row">
              <div class="field field-grow">
                <label>Sequence</label>
                <input type="text" id="nt-seq" placeholder="e.g. 1,2,3,?,5,6" value="1,2,3,?,5,6" oninput="autoPreviewNT()">
                <div style="font-size:0.72rem;color:#9CA3AF;margin-top:3px">Separate with commas · <strong>_</strong> = blank · <strong>?</strong> = answer cell</div>
              </div>
            </div>
            <div class="form-row">
              <div class="field"><label>Shape</label><div class="tog-row" id="nt-shape-row">
                <button class="tog-btn active" data-ntshape="square" onclick="ntSetShape(this)"><svg width="18" height="18" viewBox="0 0 34 34"><rect x="3" y="3" width="28" height="28" rx="7" fill="currentColor"/></svg></button>
                <button class="tog-btn" data-ntshape="circle" onclick="ntSetShape(this)"><svg width="18" height="18" viewBox="0 0 34 34"><circle cx="17" cy="17" r="13" fill="currentColor"/></svg></button>
                <button class="tog-btn" data-ntshape="balloon" onclick="ntSetShape(this)"><svg width="18" height="22" viewBox="0 0 34 42"><path d="M 17.95,35.78 L 19.69,40.00 L 14.31,40.00 L 16.05,35.78 C 10.80,34.56 2.50,24.03 2.50,16.50 C 2.50,8.49 8.99,2.00 17.00,2.00 C 25.01,2.00 31.50,8.49 31.50,16.50 C 31.50,24.03 23.20,34.56 17.95,35.78 Z" fill="currentColor"/></svg></button>
                <button class="tog-btn" data-ntshape="star" onclick="ntSetShape(this)"><svg width="18" height="18" viewBox="0 0 34 34"><path d="M 30.74,13.67 C 30.48,12.87 29.74,12.33 28.90,12.33 L 21.22,12.33 L 18.84,5.02 C 18.58,4.23 17.84,3.69 17.00,3.69 C 16.16,3.69 15.42,4.23 15.16,5.02 L 12.78,12.33 L 5.10,12.33 C 4.26,12.33 3.52,12.87 3.26,13.67 C 3.00,14.47 3.28,15.34 3.96,15.84 L 10.18,20.35 L 7.80,27.65 C 7.54,28.45 7.83,29.33 8.51,29.82 C 9.19,30.31 10.11,30.31 10.79,29.82 L 17.00,25.31 L 23.21,29.82 C 23.55,30.07 23.95,30.19 24.35,30.19 C 24.75,30.19 25.15,30.07 25.49,29.82 C 26.17,29.33 26.46,28.45 26.20,27.65 L 23.82,20.35 L 30.04,15.84 C 30.72,15.34 31.00,14.47 30.74,13.67 Z" fill="currentColor"/></svg></button>
                <button class="tog-btn" data-ntshape="cloud" onclick="ntSetShape(this)"><svg width="22" height="14" viewBox="0 0 34 24"><path d="M 28.90,12.29 C 28.90,12.24 28.91,12.19 28.91,12.14 C 28.91,9.67 26.90,7.66 24.43,7.66 C 23.92,7.66 23.44,7.74 22.99,7.90 C 22.26,5.05 19.68,2.94 16.60,2.94 C 13.10,2.94 10.24,5.67 10.01,9.11 C 9.68,9.01 9.32,8.95 8.96,8.95 C 7.08,8.95 5.54,10.39 5.38,12.22 C 3.46,12.61 2.00,14.31 2.00,16.34 C 2.00,18.65 3.89,20.54 6.20,20.54 L 27.80,20.54 C 30.11,20.54 32.00,18.65 32.00,16.34 C 32.00,14.41 30.68,12.78 28.90,12.29 Z" fill="currentColor"/></svg></button>
              </div></div>
              <div class="field"><label>Layout</label><div class="tog-row">
                <button class="tog-btn active" data-ntlayout="straight" onclick="ntSetLayout(this)">Straight</button>
                <button class="tog-btn" data-ntlayout="ascending" onclick="ntSetLayout(this)">Ascending</button>
                <button class="tog-btn" data-ntlayout="descending" onclick="ntSetLayout(this)">Descending</button>
              </div></div>
              <div class="field"><label>Colour mode</label><div class="tog-row">
                <button class="tog-btn active" data-ntcolmode="full" onclick="ntSetColMode(this)">Filled</button>
                <button class="tog-btn" data-ntcolmode="light" onclick="ntSetColMode(this)">Light</button>
                <button class="tog-btn" data-ntcolmode="outline" onclick="ntSetColMode(this)">Outline</button>
              </div></div>
            </div>
            <div class="preview-box" id="nt-preview"><p class="preview-empty">Fill in a sequence above to preview.</p></div>
            <div class="form-actions">
              <button class="btn-create-more" onclick="openSharedBatch('nt')">⊞ Create more like this</button>
              <button class="btn btn-blue" id="add-q-btn-nt" onclick="addToolQuestion('nt')">+ Add Question</button>
              <button class="btn btn-ghost" onclick="closeTool()">Cancel</button>
            </div>`;
}

