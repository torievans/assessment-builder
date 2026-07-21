/* tools/pv.js — Place Value Representations tool
 * Depends on: tools/shared.js (none directly, uses canvas API)
 * Globals from builder: activeTool
 */

let pv_N=24,pv_repType='blocks',pv_dispMode='standalone',pv_numEqMode='none';
let pv_missingVals=new Set();
let pv_blkColors={1000:'#788CB4',100:'#50B4A0',10:'#F0B478',1:'#C86464'};
let pv_pvColors={};
const PV_FONT="'Proxima Soft','Nunito','Arial Rounded MT Bold',sans-serif";
const PV_GAP=6,PV_PAD=16,PV_CELL=16,PV_DEP=6,PV_CTR=44;
const PV_BLK_PER_ROW={1000:3,100:3,10:5,1:5};
const PV_FULL_PARTS=[
  {val:1000000,label:'Millions',         abbr:'M',  defColor:'#288C50'},
  {val:100000, label:'Hundred Thousands',abbr:'HTh',defColor:'#50B4C8'},
  {val:10000,  label:'Ten Thousands',    abbr:'TTh',defColor:'#B478B4'},
  {val:1000,   label:'Thousands',        abbr:'Th', defColor:'#788CB4'},
  {val:100,    label:'Hundreds',         abbr:'H',  defColor:'#50B4A0'},
  {val:10,     label:'Tens',             abbr:'T',  defColor:'#F0B478'},
  {val:1,      label:'Ones',             abbr:'O',  defColor:'#C86464'},
  {val:0.1,    label:'Tenths',           abbr:'t',  defColor:'#C878B4',frac:'1/10'},
  {val:0.01,   label:'Hundredths',       abbr:'h',  defColor:'#F0B0D4',frac:'1/100'},
  {val:0.001,  label:'Thousandths',      abbr:'th', defColor:'#F0A090',frac:'1/1000'},
];
function pvGetPVArray(pvColors){return PV_FULL_PARTS.map(p=>({...p,color:(pvColors&&pvColors[p.val]!==undefined)?pvColors[p.val]:p.defColor}));}
function pvAdjustColor(hex,f){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`rgb(${Math.min(255,Math.round(r*f))},${Math.min(255,Math.round(g*f))},${Math.min(255,Math.round(b*f))})`;}
function pvDecompose(n,forBlocks,pvColors){
  const PV=pvGetPVArray(pvColors);
  const intPV=PV.filter(p=>p.val>=1);
  const cols=forBlocks?intPV.slice(-4):PV;
  let rem=Math.round(Math.max(0,n)*1000);
  return cols.map(c=>{const cVal=Math.round(c.val*1000);const count=Math.floor(rem/cVal);rem-=count*cVal;return{...c,count};});
}
function pvSetupCanvas(cv,lw,lh,sc){cv.width=lw*sc;cv.height=lh*sc;cv.style.width=lw+'px';cv.style.height=lh+'px';const ctx=cv.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.scale(sc,sc);ctx.fillStyle='#fff';ctx.fillRect(0,0,lw,lh);return ctx;}
function pvOneBlkBounds(val){const cols=val>=100?10:1,rows=val>=10?10:1,depth=val>=1000?10:1;return{w:cols*PV_CELL+depth*PV_DEP,h:rows*PV_CELL+depth*PV_DEP};}
function pvBlkSize(val,count){if(!count)return{w:0,h:0};const{w:bw,h:bh}=pvOneBlkBounds(val);const pr=PV_BLK_PER_ROW[val]||5;return{w:Math.min(count,pr)*(bw+PV_GAP)-PV_GAP,h:Math.ceil(count/pr)*(bh+PV_GAP)-PV_GAP};}
function pvDrawBlock(ctx,bx,by,val,blkColors){
  const cols=val>=100?10:1,rows=val>=10?10:1,depth=val>=1000?10:1;
  const W=cols*PV_CELL,H=rows*PV_CELL,D=depth*PV_DEP,fx=bx,fy=by+D;
  const base=(blkColors&&blkColors[val])||'#999',topC=pvAdjustColor(base,1.30),sideC=pvAdjustColor(base,0.70);
  ctx.fillStyle=sideC;ctx.beginPath();ctx.moveTo(fx+W,fy);ctx.lineTo(fx+W+D,fy-D);ctx.lineTo(fx+W+D,fy-D+H);ctx.lineTo(fx+W,fy+H);ctx.closePath();ctx.fill();
  ctx.fillStyle=topC;ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx+W,fy);ctx.lineTo(fx+W+D,fy-D);ctx.lineTo(fx+D,fy-D);ctx.closePath();ctx.fill();
  ctx.fillStyle=base;ctx.fillRect(fx,fy,W,H);
  ctx.strokeStyle='#374151';ctx.lineWidth=0.55;
  for(let r=1;r<rows;r++){const ly=fy+r*PV_CELL;ctx.beginPath();ctx.moveTo(fx,ly);ctx.lineTo(fx+W,ly);ctx.stroke();}
  for(let c=1;c<cols;c++){const lx=fx+c*PV_CELL;ctx.beginPath();ctx.moveTo(lx,fy);ctx.lineTo(lx,fy+H);ctx.stroke();ctx.beginPath();ctx.moveTo(lx,fy);ctx.lineTo(lx+D,fy-D);ctx.stroke();}
  for(let d=1;d<depth;d++){const ox=d*PV_DEP,oy=-d*PV_DEP;ctx.beginPath();ctx.moveTo(fx+ox,fy+oy);ctx.lineTo(fx+W+ox,fy+oy);ctx.stroke();}
  for(let r=1;r<rows;r++){const ly=fy+r*PV_CELL;ctx.beginPath();ctx.moveTo(fx+W,ly);ctx.lineTo(fx+W+D,ly-D);ctx.stroke();}
  for(let d=1;d<depth;d++){const ox=d*PV_DEP,oy=-d*PV_DEP;ctx.beginPath();ctx.moveTo(fx+W+ox,fy+oy);ctx.lineTo(fx+W+ox,fy+oy+H);ctx.stroke();}
  ctx.strokeStyle='#374151';ctx.lineWidth=1.0;
  ctx.beginPath();ctx.moveTo(fx+D,fy-D);ctx.lineTo(fx+W+D,fy-D);ctx.lineTo(fx+W+D,fy-D+H);ctx.lineTo(fx+W,fy+H);ctx.lineTo(fx,fy+H);ctx.lineTo(fx,fy);ctx.closePath();ctx.stroke();
  ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx+W,fy);ctx.stroke();
  ctx.beginPath();ctx.moveTo(fx+W,fy);ctx.lineTo(fx+W,fy+H);ctx.stroke();
  ctx.beginPath();ctx.moveTo(fx+W,fy);ctx.lineTo(fx+W+D,fy-D);ctx.stroke();
}
function pvDrawBlks(ctx,x,y,val,count,blkColors){const{w:bw,h:bh}=pvOneBlkBounds(val);const pr=PV_BLK_PER_ROW[val]||5;for(let i=0;i<count;i++){const c=i%pr,r=Math.floor(i/pr);pvDrawBlock(ctx,x+c*(bw+PV_GAP),y+r*(bh+PV_GAP),val,blkColors);}}
function pvCtrSize(count,perRow){if(!count)return{w:0,h:0};perRow=perRow||2;const cols=Math.min(count,perRow),rows=Math.ceil(count/perRow);return{w:cols*(PV_CTR+PV_GAP)-PV_GAP,h:rows*(PV_CTR+PV_GAP)-PV_GAP};}
function pvDrawCtrs(ctx,x,y,pv,count,perRow){const R=PV_CTR/2;perRow=perRow||2;for(let i=0;i<count;i++){const col=i%perRow,row=Math.floor(i/perRow),cx=x+col*(PV_CTR+PV_GAP)+R,cy=y+row*(PV_CTR+PV_GAP)+R;ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fillStyle=pv.color;ctx.fill();ctx.strokeStyle=pvAdjustColor(pv.color,0.65);ctx.lineWidth=1.5;ctx.stroke();const txt=pv.val<1?String(pv.val):pv.abbr;const fs=txt.length>=5?8:txt.length>=4?9:txt.length>2?10:txt.length>1?12:15;ctx.font=`bold ${fs}px ${PV_FONT}`;ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,cx,cy);}}
function pvNumSize(ctx,val,count){if(!count)return{w:0,h:0};ctx.font=`bold 32px ${PV_FONT}`;const product=Math.round(val*count*1e6)/1e6;return{w:ctx.measureText(String(product)).width+16,h:44};}
function pvDrawNumTxt(ctx,cx,cy,val,count,color){ctx.font=`bold 32px ${PV_FONT}`;ctx.fillStyle=color||'#1A1A2E';ctx.textAlign='center';ctx.textBaseline='middle';const product=Math.round(val*count*1e6)/1e6;ctx.fillText(String(product),cx,cy);}
function pvDrawColoredNum(ctx,n,parts,bx,cy){
  const numStr=String(n);ctx.font=`bold 32px ${PV_FONT}`;ctx.textBaseline='middle';ctx.textAlign='left';
  const colMap={};parts.forEach(p=>{colMap[Math.round(p.val*1e6)]=p.color;});
  const dotIdx=numStr.indexOf('.');const intLen=dotIdx>=0?dotIdx:numStr.length;
  let dx=bx+8;
  numStr.split('').forEach((ch,i)=>{
    let color='#1A1A2E';
    if(ch==='.'){color='#9CA3AF';}else if(ch!=='-'){
      let pv;if(i<intLen){pv=Math.pow(10,intLen-1-i);}else{const dp=i-intLen-1;pv=Math.round(Math.pow(10,-(dp+1))*1e6)/1e6;}
      color=colMap[Math.round(pv*1e6)]||'#1A1A2E';
    }
    ctx.fillStyle=color;ctx.fillText(ch,dx,cy);dx+=ctx.measureText(ch).width;
  });
}
function pvSecSize(ctx,pv,count,repType,perRow){if(repType==='blocks')return pvBlkSize(pv.val,count);if(repType==='counters')return pvCtrSize(count,perRow);return pvNumSize(ctx,pv.val,count);}
function pvDrawContent(ctx,pv,count,x,y,repType,blkColors,perRow){if(repType==='blocks'){pvDrawBlks(ctx,x,y,pv.val,count,blkColors);return;}if(repType==='counters'){pvDrawCtrs(ctx,x,y,pv,count,perRow);return;}const sz=pvNumSize(ctx,pv.val,count);pvDrawNumTxt(ctx,x+sz.w/2,y+sz.h/2,pv.val,count,pv.color);}
function pvDrawQMark(ctx,x,y,w,h){const R=Math.min(10,w/4,h/4);ctx.save();ctx.fillStyle='#F3F4F6';ctx.beginPath();ctx.moveTo(x+R,y);ctx.lineTo(x+w-R,y);ctx.quadraticCurveTo(x+w,y,x+w,y+R);ctx.lineTo(x+w,y+h-R);ctx.quadraticCurveTo(x+w,y+h,x+w-R,y+h);ctx.lineTo(x+R,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-R);ctx.lineTo(x,y+R);ctx.quadraticCurveTo(x,y,x+R,y);ctx.closePath();ctx.fill();ctx.strokeStyle='#9CA3AF';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);const fs=Math.max(Math.min(w*0.45,h*0.65,52),18);ctx.font=`bold ${fs}px ${PV_FONT}`;ctx.fillStyle='#6B7280';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('?',x+w/2,y+h/2);ctx.restore();}
function pvDrawQMarkCircle(ctx,cx,cy,r){ctx.font=`bold ${Math.max(r*0.7,20)}px ${PV_FONT}`;ctx.fillStyle='#1A1A2E';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('?',cx,cy);}
function pvRenderToCanvas(cv,cfg,scale){
  const rawN=cfg.n||0;
  const repType=cfg.repType||'blocks',dispMode=cfg.dispMode||'standalone',numEqMode=cfg.numEqMode||'none';
  const mv=new Set(cfg.missingVals||[]);
  const blkColors=cfg.blkColors||{1000:'#788CB4',100:'#50B4A0',10:'#F0B478',1:'#C86464'};
  const pvColors=cfg.pvColors||{};
  scale=scale||2;
  const forBlocks=repType==='blocks';
  const n=forBlocks?Math.min(9999,Math.max(0,Math.floor(rawN))):Math.min(9999999,Math.max(0,rawN));
  const parts=pvDecompose(n,forBlocks,pvColors);
  const tmp=document.createElement('canvas').getContext('2d');

  if(dispMode==='standalone'){
    const active=parts.filter(p=>p.count>0||mv.has(p.val));
    if(!active.length){pvSetupCanvas(cv,300,100,scale);return;}
    const sizes=active.map(p=>pvSecSize(tmp,p,Math.max(p.count,1),repType));
    const maxH=Math.max(...sizes.map(s=>s.h),40);
    let plusW=0,eqW=0,numW=0;
    if(repType==='numbers'){
      tmp.font=`bold 28px ${PV_FONT}`;plusW=tmp.measureText(' + ').width;
      if(numEqMode!=='none'){tmp.font=`bold 32px ${PV_FONT}`;numW=tmp.measureText(String(n)).width+16;tmp.font=`bold 28px ${PV_FONT}`;eqW=tmp.measureText(' = ').width;}
    }
    const SEC_GAP=repType==='numbers'?0:28;
    let totalW=PV_PAD*2;
    if(repType==='numbers'&&numEqMode!=='none')totalW+=numW+eqW;
    sizes.forEach((sz,i)=>{totalW+=sz.w+(i>0?(repType==='numbers'?plusW:SEC_GAP):0);});
    const lw=Math.max(totalW,100),lh=Math.max(maxH+PV_PAD*2,80);
    const ctx=pvSetupCanvas(cv,lw,lh,scale);
    let cx=PV_PAD;
    if(repType==='numbers'&&numEqMode==='before'){
      pvDrawColoredNum(ctx,n,parts,cx,PV_PAD+maxH/2);cx+=numW;
      ctx.font=`bold 28px ${PV_FONT}`;ctx.fillStyle='#AAAAAA';ctx.textAlign='left';ctx.textBaseline='alphabetic';
      ctx.fillText(' = ',cx,PV_PAD+maxH*0.75);cx+=eqW;
    }
    active.forEach((p,i)=>{
      const sz=sizes[i];
      if(i>0&&repType==='numbers'){ctx.font=`bold 28px ${PV_FONT}`;ctx.fillStyle='#AAAAAA';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(' + ',cx,PV_PAD+sz.h*0.75);cx+=plusW;}
      else if(i>0){cx+=SEC_GAP;}
      if(mv.has(p.val)){pvDrawQMark(ctx,cx,PV_PAD,sz.w,maxH);}else{pvDrawContent(ctx,p,p.count,cx,PV_PAD,repType,blkColors);}
      cx+=sz.w;
    });
    if(repType==='numbers'&&numEqMode==='after'){
      ctx.font=`bold 28px ${PV_FONT}`;ctx.fillStyle='#AAAAAA';ctx.textAlign='left';ctx.textBaseline='alphabetic';
      ctx.fillText(' = ',cx,PV_PAD+maxH*0.75);cx+=eqW;
      pvDrawColoredNum(ctx,n,parts,cx,PV_PAD+maxH/2);
    }
    return;
  }

  if(dispMode==='grid'){
    const nonZeroIdx=parts.reduce((acc,p,i)=>(p.count>0?[...acc,i]:acc),[]);
    let lo,hi;
    if(!nonZeroIdx.length){lo=hi=parts.findIndex(p=>p.val===1);if(lo<0){lo=0;hi=parts.length-1;}}
    else{lo=Math.min(...nonZeroIdx);hi=Math.max(...nonZeroIdx);}
    const onesIdx=parts.findIndex(p=>p.val===1);
    if(onesIdx>=0&&hi>onesIdx)lo=Math.min(lo,onesIdx);
    const vp=parts.slice(lo,hi+1);
    const compact=vp.length>7;
    const HDR_H=46,CELL_PAD=compact?6:14,MIN_W=compact?72:120;
    const cSizes=vp.map(p=>pvSecSize(tmp,p,Math.max(p.count,1),repType));
    const colWs=cSizes.map(sz=>Math.max(sz.w+CELL_PAD*2,MIN_W));
    const activeH=vp.filter(p=>p.count>0).map(p=>pvSecSize(tmp,p,p.count,repType).h);
    const colH=(activeH.length?Math.max(...activeH):60)+CELL_PAD*2;
    const lw=Math.max(colWs.reduce((a,b)=>a+b,0)+2,200),lh=Math.max(HDR_H+colH+2,120);
    const ctx=pvSetupCanvas(cv,lw,lh,scale);
    let x=1;const decDots=[];
    vp.forEach((p,i)=>{
      const cw=colWs[i],isFirst=i===0,isLast=i===vp.length-1,R=8;
      ctx.fillStyle=p.color;ctx.beginPath();ctx.moveTo(x+(isFirst?R:0),1);ctx.lineTo(x+cw-(isLast?R:0),1);if(isLast)ctx.arcTo(x+cw,1,x+cw,1+R,R);else ctx.lineTo(x+cw,1);ctx.lineTo(x+cw,1+HDR_H);ctx.lineTo(x,1+HDR_H);if(isFirst){ctx.lineTo(x,1+R);ctx.arcTo(x,1,x+R,1,R);}else ctx.lineTo(x,1);ctx.closePath();ctx.fill();
      ctx.fillStyle='#000000';ctx.textAlign='center';ctx.textBaseline='middle';
      if(compact){ctx.font=`bold 12px ${PV_FONT}`;ctx.fillText(p.frac||p.abbr,x+cw/2,1+HDR_H/2);}
      else{ctx.font=`bold 15px ${PV_FONT}`;const lw2=ctx.measureText(p.label).width;if(lw2>cw-10&&p.label.includes(' ')){const sp=p.label.lastIndexOf(' ');ctx.font=`bold 13px ${PV_FONT}`;ctx.fillText(p.label.slice(0,sp),x+cw/2,1+HDR_H/2-8);ctx.fillText(p.label.slice(sp+1),x+cw/2,1+HDR_H/2+8);}else{ctx.fillText(p.label,x+cw/2,1+HDR_H/2);}}
      ctx.fillStyle='#F9FAFB';ctx.fillRect(x,1+HDR_H,cw,colH);
      if(i<vp.length-1){const isDecBound=p.val===1&&vp[i+1]&&vp[i+1].val<1;ctx.strokeStyle=isDecBound?'#6B7280':'#E5E7EB';ctx.lineWidth=isDecBound?1.5:1;ctx.beginPath();ctx.moveTo(x+cw,1);ctx.lineTo(x+cw,1+HDR_H+colH);ctx.stroke();if(isDecBound)decDots.push(x+cw);}
      if(p.count>0){const sz=pvSecSize(tmp,p,p.count,repType);if(mv.has(p.val)){const qw=Math.max(sz.w,60),qh=colH-CELL_PAD*2;pvDrawQMark(ctx,x+(cw-qw)/2,1+HDR_H+CELL_PAD,qw,qh);}else if(repType==='numbers'){pvDrawNumTxt(ctx,x+cw/2,1+HDR_H+colH/2,p.val,p.count,p.color);}else{pvDrawContent(ctx,p,p.count,x+(cw-sz.w)/2,1+HDR_H+CELL_PAD,repType,blkColors);}}
      x+=cw;
    });
    decDots.forEach(dotX=>{ctx.fillStyle='#374151';ctx.beginPath();ctx.arc(dotX,1+HDR_H/2,4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(dotX,1+HDR_H+colH/2,4,0,Math.PI*2);ctx.fill();});
    return;
  }

  if(dispMode==='partwhole'){
    const activeParts=parts.filter(p=>p.count>0);
    const CIRC_PAD=10,MIN_R=55,PART_GAP=12,LINE_LEN=60,CTR_PER_ROW=3;
    const partSizes=activeParts.length?activeParts.map(p=>pvSecSize(tmp,p,p.count,repType,CTR_PER_ROW)):[{w:70,h:70}];
    const partRs=activeParts.length?activeParts.map((_,i)=>Math.max(Math.hypot(partSizes[i].w/2,partSizes[i].h/2)+CIRC_PAD,MIN_R)):[MIN_R];
    const maxPartR=Math.max(...partRs);
    tmp.font=`bold 38px ${PV_FONT}`;
    const wholeR=Math.max(tmp.measureText(String(n)).width/2+26,60);
    const partsTotalW=activeParts.length?partRs.reduce((a,r)=>a+r*2,0)+PART_GAP*(activeParts.length-1):partRs[0]*2;
    const lw=Math.max(partsTotalW+PV_PAD*2+40,wholeR*2+PV_PAD*2,360);
    const lh=Math.max(wholeR*2+LINE_LEN+maxPartR*2+PV_PAD*3,300);
    const ctx=pvSetupCanvas(cv,lw,lh,scale);
    const wholeCY=PV_PAD+wholeR,partCY=wholeCY+wholeR+LINE_LEN+maxPartR;
    let px=(lw-partsTotalW)/2;
    const partCXs=[];partRs.forEach(r=>{partCXs.push(px+r);px+=r*2+PART_GAP;});
    const wholeCX=activeParts.length?((partCXs[0]+partCXs[partCXs.length-1])/2):lw/2;
    ctx.strokeStyle='#1A1A2E';ctx.lineWidth=2;
    activeParts.forEach((_,i)=>{const ang=Math.atan2(partCY-wholeCY,partCXs[i]-wholeCX);const sx=wholeCX+wholeR*Math.cos(ang),sy=wholeCY+wholeR*Math.sin(ang);const ex=partCXs[i]-partRs[i]*Math.cos(ang),ey=partCY-partRs[i]*Math.sin(ang);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();});
    ctx.beginPath();ctx.arc(wholeCX,wholeCY,wholeR,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#1A1A2E';ctx.lineWidth=2.5;ctx.stroke();
    if(mv.has('whole')){pvDrawQMarkCircle(ctx,wholeCX,wholeCY,wholeR);}else{(()=>{ctx.font=`bold 38px ${PV_FONT}`;ctx.textBaseline='middle';ctx.textAlign='left';const ns=String(n);const cm={};parts.forEach(p=>{cm[Math.round(p.val*1e6)]=p.color;});const il=ns.indexOf('.')<0?ns.length:ns.indexOf('.');const tw=ctx.measureText(ns).width;let dx=wholeCX-tw/2;ns.split('').forEach((ch,i)=>{let c='#1A1A2E';if(ch!=='.'){const pv=i<il?Math.pow(10,il-1-i):Math.round(Math.pow(10,-(i-il))*1e6)/1e6;c=cm[Math.round(pv*1e6)]||'#1A1A2E';}ctx.fillStyle=c;ctx.fillText(ch,dx,wholeCY);dx+=ctx.measureText(ch).width;});})();}
    activeParts.forEach((p,i)=>{const cx=partCXs[i],r=partRs[i],s=partSizes[i];ctx.beginPath();ctx.arc(cx,partCY,r,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#1A1A2E';ctx.lineWidth=2.5;ctx.stroke();if(mv.has(p.val)){pvDrawQMarkCircle(ctx,cx,partCY,r);}else if(repType==='numbers'){pvDrawNumTxt(ctx,cx,partCY,p.val,p.count,p.color);}else{ctx.save();ctx.beginPath();ctx.arc(cx,partCY,r-4,0,Math.PI*2);ctx.clip();pvDrawContent(ctx,p,p.count,cx-s.w/2,partCY-s.h/2,repType,blkColors,CTR_PER_ROW);ctx.restore();}});
  }
}
function pvGetDataURL(cfg,scale){const cv=document.createElement('canvas');pvRenderToCanvas(cv,cfg,scale||2);return cv.toDataURL('image/png');}
function pvGetPngBlob(cfg){return new Promise((res,rej)=>{const cv=document.createElement('canvas');pvRenderToCanvas(cv,cfg,4);cv.toBlob(b=>{if(b)res(b);else rej(new Error('canvas toBlob failed'));},'image/png');});}
function pvSetN(v){const n=parseFloat(v);pv_N=isNaN(n)?0:Math.max(0,n);const el=document.getElementById('pv-num-in');if(el)el.value=pv_N;autoPreviewPV();}
function pvChangeNum(d){pvSetN(pv_N+d);}
function pvSetRep(btn){
  pv_repType=btn.dataset.pvrep;
  document.querySelectorAll('[data-pvrep]').forEach(b=>b.classList.toggle('active',b.dataset.pvrep===pv_repType));
  const bf=document.getElementById('pv-blk-color-field');if(bf)bf.style.display=pv_repType==='blocks'?'':'none';
  const cf=document.getElementById('pv-ctr-color-field');if(cf)cf.style.display=(pv_repType==='counters'||pv_repType==='numbers')?'':'none';
  pvUpdateEqField();autoPreviewPV();
}
function pvSetMode(btn){pv_dispMode=btn.dataset.pvmode;document.querySelectorAll('[data-pvmode]').forEach(b=>b.classList.toggle('active',b.dataset.pvmode===pv_dispMode));pvUpdateEqField();autoPreviewPV();}
function pvSetEqMode(btn){pv_numEqMode=btn.dataset.pveq;document.querySelectorAll('[data-pveq]').forEach(b=>b.classList.toggle('active',b.dataset.pveq===pv_numEqMode));autoPreviewPV();}
function pvUpdateEqField(){const el=document.getElementById('pv-eq-field');if(el)el.style.display=(pv_repType==='numbers'&&pv_dispMode==='standalone')?'':'none';}
function pvSetBlkColor(val,color){pv_blkColors[val]=color;document.querySelectorAll('#pv-blk-color-field .tog-btn').forEach(b=>b.classList.remove('active'));autoPreviewPV();}
function pvSetPVColor(val,color){pv_pvColors[val]=color;autoPreviewPV();}
function pvApplyPreset(name,btn){
  const presets={counter:{1000:'#788CB4',100:'#50B4A0',10:'#F0B478',1:'#C86464'},paleblue:{1000:'#8ABDD8',100:'#8ABDD8',10:'#8ABDD8',1:'#8ABDD8'}};
  pv_blkColors={...presets[name]};
  const c1=document.getElementById('pv-col-1000');if(c1)c1.value=pv_blkColors[1000];
  const c2=document.getElementById('pv-col-100');if(c2)c2.value=pv_blkColors[100];
  const c3=document.getElementById('pv-col-10');if(c3)c3.value=pv_blkColors[10];
  const c4=document.getElementById('pv-col-1');if(c4)c4.value=pv_blkColors[1];
  document.querySelectorAll('#pv-blk-color-field .tog-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  autoPreviewPV();
}
function pvToggleMissing(key){if(pv_missingVals.has(key))pv_missingVals.delete(key);else pv_missingVals.add(key);autoPreviewPV();}
function pvBuildMissingUI(parts){
  const row=document.getElementById('pv-missing-row');if(!row)return;
  const active=parts.filter(p=>p.count>0);
  if(!active.length){row.innerHTML='<span style="font-size:0.78rem;color:#9CA3AF;font-style:italic">Enter a number above</span>';return;}
  const items=[];
  if(pv_dispMode==='partwhole')items.push({key:'whole',label:String(pv_N)});
  active.forEach(p=>items.push({key:p.val,label:p.label}));
  pv_missingVals.forEach(k=>{if(!items.find(i=>i.key===k))pv_missingVals.delete(k);});
  row.innerHTML=items.map(item=>{const isOn=pv_missingVals.has(item.key);const keyStr=typeof item.key==='string'?`'${item.key}'`:item.key;return`<button class="tog-btn${isOn?' active':''}" onclick="pvToggleMissing(${keyStr})">${item.label}</button>`;}).join('');
}
function autoPreviewPV(){
  if(activeTool!=='pv')return;
  const cv=document.getElementById('pv-canvas');if(!cv)return;
  const rawN=parseFloat(document.getElementById('pv-num-in')?.value||'0');
  pv_N=isNaN(rawN)?0:Math.max(0,rawN);
  const forBlocks=pv_repType==='blocks';
  const displayN=forBlocks?Math.min(9999,Math.floor(pv_N)):Math.min(9999999,pv_N);
  pvBuildMissingUI(pvDecompose(displayN,forBlocks,pv_pvColors));
  const cfg={n:pv_N,repType:pv_repType,dispMode:pv_dispMode,numEqMode:pv_numEqMode,missingVals:[...pv_missingVals],blkColors:pv_blkColors,pvColors:pv_pvColors};
  pvRenderToCanvas(cv,cfg,2);
}
function getPVConfig(){return{n:pv_N,repType:pv_repType,dispMode:pv_dispMode,numEqMode:pv_numEqMode,missingVals:[...pv_missingVals],blkColors:{...pv_blkColors},pvColors:{...pv_pvColors}};}
function restorePVConfig(cfg){
  pv_N=cfg.n??24;pv_repType=cfg.repType||'blocks';pv_dispMode=cfg.dispMode||'standalone';pv_numEqMode=cfg.numEqMode||'none';
  pv_missingVals=new Set(cfg.missingVals||[]);
  pv_blkColors=Object.assign({1000:'#788CB4',100:'#50B4A0',10:'#F0B478',1:'#C86464'},cfg.blkColors||{});
  pv_pvColors=Object.assign({},cfg.pvColors||{});
  const numEl=document.getElementById('pv-num-in');if(numEl)numEl.value=pv_N;
  document.querySelectorAll('[data-pvrep]').forEach(b=>b.classList.toggle('active',b.dataset.pvrep===pv_repType));
  document.querySelectorAll('[data-pvmode]').forEach(b=>b.classList.toggle('active',b.dataset.pvmode===pv_dispMode));
  document.querySelectorAll('[data-pveq]').forEach(b=>b.classList.toggle('active',b.dataset.pveq===pv_numEqMode));
  const c1=document.getElementById('pv-col-1000');if(c1)c1.value=pv_blkColors[1000];
  const c2=document.getElementById('pv-col-100');if(c2)c2.value=pv_blkColors[100];
  const c3=document.getElementById('pv-col-10');if(c3)c3.value=pv_blkColors[10];
  const c4=document.getElementById('pv-col-1');if(c4)c4.value=pv_blkColors[1];
  const bf=document.getElementById('pv-blk-color-field');if(bf)bf.style.display=pv_repType==='blocks'?'':'none';
  const cf=document.getElementById('pv-ctr-color-field');if(cf)cf.style.display=(pv_repType==='counters'||pv_repType==='numbers')?'':'none';
  pvUpdateEqField();autoPreviewPV();
}
function pvResetState(){
  pv_N=24;pv_repType='blocks';pv_dispMode='standalone';pv_numEqMode='none';
  pv_missingVals=new Set();pv_blkColors={1000:'#788CB4',100:'#50B4A0',10:'#F0B478',1:'#C86464'};pv_pvColors={};
  const numEl=document.getElementById('pv-num-in');if(numEl)numEl.value=24;
  document.querySelectorAll('[data-pvrep]').forEach(b=>b.classList.toggle('active',b.dataset.pvrep==='blocks'));
  document.querySelectorAll('[data-pvmode]').forEach(b=>b.classList.toggle('active',b.dataset.pvmode==='standalone'));
  document.querySelectorAll('[data-pveq]').forEach(b=>b.classList.toggle('active',b.dataset.pveq==='none'));
  const bf=document.getElementById('pv-blk-color-field');if(bf)bf.style.display='';
  const cf=document.getElementById('pv-ctr-color-field');if(cf)cf.style.display='none';
  const ef=document.getElementById('pv-eq-field');if(ef)ef.style.display='none';
  autoPreviewPV();
}

// ── Panel HTML ─────────────────────────────────────────────────
function pvPanelHTML(){
  return `<div class="form-row">
              <div class="field field-grow"><label>Question text</label><input type="text" id="pv-text" placeholder="e.g. What number is shown?"></div>
              <div class="field field-sm"><label>Answer</label><input type="text" id="pv-answer" placeholder="e.g. 342"></div>
            </div>
            <div class="form-row" style="align-items:center">
              <div class="field field-sm"><label>Number</label>
                <div style="display:flex;align-items:center;gap:4px">
                  <button class="tog-btn" onclick="pvChangeNum(-1)" style="width:30px;height:30px;padding:0">−</button>
                  <input type="number" id="pv-num-in" min="0" step="0.001" value="24" style="width:80px;text-align:center;border:1.5px solid #E2E5EA;border-radius:8px;padding:4px;font-size:14px" oninput="pvSetN(parseFloat(this.value))">
                  <button class="tog-btn" onclick="pvChangeNum(1)" style="width:30px;height:30px;padding:0">+</button>
                </div>
              </div>
              <div class="field"><label>Representation</label>
                <div class="tog-row">
                  <button class="tog-btn active" data-pvrep="blocks"   onclick="pvSetRep(this)">PV Blocks</button>
                  <button class="tog-btn"        data-pvrep="counters" onclick="pvSetRep(this)">PV Counters</button>
                  <button class="tog-btn"        data-pvrep="numbers"  onclick="pvSetRep(this)">Numbers</button>
                </div>
              </div>
              <div class="field"><label>Display</label>
                <div class="tog-row">
                  <button class="tog-btn active" data-pvmode="standalone" onclick="pvSetMode(this)">Standalone</button>
                  <button class="tog-btn"        data-pvmode="grid"       onclick="pvSetMode(this)">PV Grid</button>
                  <button class="tog-btn"        data-pvmode="partwhole"  onclick="pvSetMode(this)">Part-Whole</button>
                </div>
              </div>
              <div class="field" id="pv-eq-field" style="display:none"><label>Equation</label>
                <div class="tog-row">
                  <button class="tog-btn active" data-pveq="none"   onclick="pvSetEqMode(this)">Parts only</button>
                  <button class="tog-btn"        data-pveq="before" onclick="pvSetEqMode(this)">1234 = parts</button>
                  <button class="tog-btn"        data-pveq="after"  onclick="pvSetEqMode(this)">Parts = 1234</button>
                </div>
              </div>
            </div>
            <div id="pv-blk-color-field" class="form-row">
              <div class="field"><label>Block colours</label>
                <div style="display:flex;gap:6px;margin-bottom:6px">
                  <button class="tog-btn active" id="pv-preset-counter" onclick="pvApplyPreset('counter',this)">Match counters</button>
                  <button class="tog-btn" id="pv-preset-paleblue" onclick="pvApplyPreset('paleblue',this)">Pale blue</button>
                </div>
                <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
                  <div style="display:flex;align-items:center;gap:4px"><span style="font-size:.72rem;font-weight:700;color:#6B7280">1000s</span><input type="color" id="pv-col-1000" value="#788CB4" oninput="pvSetBlkColor(1000,this.value)"></div>
                  <div style="display:flex;align-items:center;gap:4px"><span style="font-size:.72rem;font-weight:700;color:#6B7280">100s</span><input type="color" id="pv-col-100" value="#50B4A0" oninput="pvSetBlkColor(100,this.value)"></div>
                  <div style="display:flex;align-items:center;gap:4px"><span style="font-size:.72rem;font-weight:700;color:#6B7280">10s</span><input type="color" id="pv-col-10" value="#F0B478" oninput="pvSetBlkColor(10,this.value)"></div>
                  <div style="display:flex;align-items:center;gap:4px"><span style="font-size:.72rem;font-weight:700;color:#6B7280">1s</span><input type="color" id="pv-col-1" value="#C86464" oninput="pvSetBlkColor(1,this.value)"></div>
                </div>
              </div>
            </div>
            <div id="pv-ctr-color-field" class="form-row" style="display:none">
              <div class="field"><label>Counter &amp; grid colours</label>
                <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
                  <div style="display:flex;align-items:center;gap:4px"><span style="font-size:.72rem;font-weight:700;color:#6B7280">M</span><input type="color" id="pv-cc-1000000" value="#288C50" oninput="pvSetPVColor(1000000,this.value)"></div>
                  <div style="display:flex;align-items:center;gap:4px"><span style="font-size:.72rem;font-weight:700;color:#6B7280">HTh</span><input type="color" id="pv-cc-100000" value="#50B4C8" oninput="pvSetPVColor(100000,this.value)"></div>
                  <div style="display:flex;align-items:center;gap:4px"><span style="font-size:.72rem;font-weight:700;color:#6B7280">TTh</span><input type="color" id="pv-cc-10000" value="#B478B4" oninput="pvSetPVColor(10000,this.value)"></div>
                  <div style="display:flex;align-items:center;gap:4px"><span style="font-size:.72rem;font-weight:700;color:#6B7280">Th</span><input type="color" id="pv-cc-1000" value="#788CB4" oninput="pvSetPVColor(1000,this.value)"></div>
                  <div style="display:flex;align-items:center;gap:4px"><span style="font-size:.72rem;font-weight:700;color:#6B7280">H</span><input type="color" id="pv-cc-100" value="#50B4A0" oninput="pvSetPVColor(100,this.value)"></div>
                  <div style="display:flex;align-items:center;gap:4px"><span style="font-size:.72rem;font-weight:700;color:#6B7280">T</span><input type="color" id="pv-cc-10" value="#F0B478" oninput="pvSetPVColor(10,this.value)"></div>
                  <div style="display:flex;align-items:center;gap:4px"><span style="font-size:.72rem;font-weight:700;color:#6B7280">O</span><input type="color" id="pv-cc-1" value="#C86464" oninput="pvSetPVColor(1,this.value)"></div>
                  <div style="display:flex;align-items:center;gap:4px"><span style="font-size:.72rem;font-weight:700;color:#6B7280">1/10</span><input type="color" id="pv-cc-tenth" value="#C878B4" oninput="pvSetPVColor(0.1,this.value)"></div>
                  <div style="display:flex;align-items:center;gap:4px"><span style="font-size:.72rem;font-weight:700;color:#6B7280">1/100</span><input type="color" id="pv-cc-hundredth" value="#F0B0D4" oninput="pvSetPVColor(0.01,this.value)"></div>
                  <div style="display:flex;align-items:center;gap:4px"><span style="font-size:.72rem;font-weight:700;color:#6B7280">1/1000</span><input type="color" id="pv-cc-thousandth" value="#F0A090" oninput="pvSetPVColor(0.001,this.value)"></div>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="field"><label>Hide as ?</label><div class="tog-row" id="pv-missing-row"><span style="font-size:0.78rem;color:#9CA3AF;font-style:italic">Enter a number above</span></div></div>
            </div>
            <div class="preview-box" id="pv-preview" style="padding:10px;min-height:80px">
              <canvas id="pv-canvas" style="max-width:100%;height:auto;display:block;margin:auto"></canvas>
            </div>
            <div class="form-actions">
              <button class="btn-create-more" onclick="openSharedBatch('pv')">⊞ Create more like this</button>
              <button class="btn btn-blue" id="add-q-btn-pv" onclick="addToolQuestion('pv')">+ Add Question</button>
              <button class="btn btn-ghost" onclick="closeTool()">Cancel</button>
            </div>`;
}


