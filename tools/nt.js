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

