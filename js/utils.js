/* ── Shared utilities ────────────────────────────────────────────────────── *
 * Depends on: number-line-renderer.js, bar-model-renderer.js (for export)   */

/** Render an SVG string to a PNG Blob at 2× scale. */
function svgToPng(svgStr) {
  return new Promise((res, rej) => {
    const div  = document.createElement('div');
    div.innerHTML = svgStr;
    const el   = div.querySelector('svg');
    const vb   = (el?.getAttribute('viewBox') || '0 0 460 120').split(/\s+/).map(Number);
    const w = vb[2], h = vb[3], sc = 2;
    const cv   = document.createElement('canvas');
    cv.width   = w * sc; cv.height = h * sc;
    const ctx  = cv.getContext('2d');
    ctx.scale(sc, sc);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload  = () => { ctx.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url); cv.toBlob(res, 'image/png'); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('SVG render failed')); };
    img.src = url;
  });
}

/** HTML-escape a value for safe insertion into markup. */
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/**
 * Build a QTI v2.2 assessmentItem XML string for one question.
 * @param {object} q       — question object (id, text, answer, ...)
 * @param {string} imgFile — relative image filename, or null
 */
function qtiXML(q, imgFile) {
  const rid  = `RESPONSE-${10000 + q.id}`;
  const iid  = `ITEM-${String(q.id).padStart(3, '0')}`;
  const ans  = parseFloat(q.answer);
  const av   = isNaN(ans) ? q.answer : ans;
  const imgLine = imgFile ? `\n      <p><img src="${esc(imgFile)}" alt=""/></p>` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p2"
  identifier="${iid}" title="${esc(q.text.slice(0, 80))}"
  adaptive="false" timeDependent="false">
  <responseDeclaration identifier="${rid}" cardinality="single" baseType="float">
    <correctResponse><value>${av}</value></correctResponse>
  </responseDeclaration>
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>
  <itemBody>
    <div>
      <p>${esc(q.text)}</p>${imgLine}
      <p><textEntryInteraction responseIdentifier="${rid}"/></p>
    </div>
    <div/>
  </itemBody>
  <responseProcessing>
    <responseCondition><responseIf>
      <match><variable identifier="${rid}"/><correct identifier="${rid}"/></match>
      <setOutcomeValue identifier="SCORE"><baseValue baseType="float">1</baseValue></setOutcomeValue>
    </responseIf></responseCondition>
  </responseProcessing>
</assessmentItem>`;
}
