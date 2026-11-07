/* html-keynote · Engine-JS. Nicht pro Vortrag ändern. Vortragsspezifisches über window.deckHooks (siehe docs/BAUSTEINE.md). */
(()=>{
"use strict";
const W=1920,H=1080;
const stage=document.getElementById('stage');
const hub=document.getElementById('hub');
const finale=document.getElementById('finale');
const HOOKS=window.deckHooks||{};

/* Overlays */
stage.insertAdjacentHTML('beforeend','<div id="blank"></div><div id="help"></div><div id="toast"></div>');

let scale=1;
function fit(){scale=Math.min(innerWidth/W,innerHeight/H);
  stage.style.transform=`translate(${(innerWidth-W*scale)/2}px,${(innerHeight-H*scale)/2}px) scale(${scale})`;}
addEventListener('resize',fit);fit();

function sceneInfo(el){
  const fr=[...el.querySelectorAll('[data-f]:not(aside)')].map(x=>+x.dataset.f).concat([...el.querySelectorAll('[data-at]')].map(x=>+x.dataset.at));
  const hl=[...el.querySelectorAll('[data-hl]')].map(x=>+x.dataset.hl);
  return {el,max:Math.max(0,+(el.dataset.steps||0),...fr,...hl),nhl:hl.length?Math.max(...hl):0,skip:el.hasAttribute('data-skip'),label:el.dataset.label||'',
    notes:[...el.querySelectorAll('aside.note')].map(a=>({f:+a.dataset.f,t:a.dataset.t||'',txt:a.textContent.trim()}))};
}
const chapters=[...document.querySelectorAll('section.chapter')].map((el,i)=>({el,i,title:el.dataset.title||'',
  scenes:[...el.querySelectorAll(':scope > .scene')].map(sceneInfo)}));
const NCH=chapters.length;
const hasProlog=!!(chapters[0]&&chapters[0].el.classList.contains('prolog'));
const OFF=hasProlog?1:0;                       // Kapitelnummer = Index - OFF + 1
const numOf=ci=>ci-OFF+1;                      // Prolog → 0
const NUM=NCH-OFF;                             // Anzahl nummerierter Kapitel
const tiles=[...hub.querySelectorAll('.tile[data-ch]')].sort((a,b)=>+a.dataset.ch - +b.dataset.ch);
if(tiles.length!==NCH) console.warn(`html-keynote: ${tiles.length} Kacheln mit data-ch, aber ${NCH} Kapitel`);
const grid=hub.querySelector('.grid');
grid.dataset.n=NUM;
tiles.forEach(t=>{const n=+t.dataset.ch; if(n>0) t.style.gridArea='abcdefgh'[n-1];});
const finScenes=finale?[...finale.querySelectorAll('.scene')].map(sceneInfo):[];
chapters.forEach(c=>{const pb=c.el.querySelector('.pbar');if(!pb)return;const me=numOf(c.i);
  pb.innerHTML=Array.from({length:NUM},(_,j)=>`<i class="${j+1<me?'d':j+1===me?'c':''}"></i>`).join('');});
const hubNotes=[...hub.querySelectorAll('aside.note[data-done]')].reduce((o,a)=>(o[+a.dataset.done]={t:a.dataset.t||'',txt:a.textContent.trim()},o),{});
document.getElementById('help').innerHTML=
  '<b>→ · Leertaste · Bild↓</b>weiter<br><b>← · Bild↑</b>zurück<br><b>Esc · O</b>Übersicht<br>'+
  `<b>1 bis ${NUM}</b>Kapitel direkt<br><b>0</b>Startseite<br><b>K</b>Kurzfassung an/aus<br><b>N</b>Notizenfenster<br>`+
  '<b>V</b>Video starten/anhalten<br><b>B · .</b>Schwarzbild<br><b>F</b>Vollbild (besser: F11)<br><b>H</b>diese Hilfe';

let short=false, steps=[], idx=0, cur=null, busy=false, queued=0;
function build(){
  steps=[{k:'hub',done:0}];
  chapters.forEach((c,ci)=>{c.scenes.forEach((s,si)=>{if(short&&s.skip)return;for(let f=0;f<=s.max;f++)steps.push({k:'sc',ch:ci,sc:si,f});});
    steps.push({k:'hub',done:ci+1});});
  finScenes.forEach((s,i)=>steps.push({k:'fin',i,f:0}));
}
build();
const same=(a,b)=>a&&b&&a.k===b.k&&a.ch===b.ch&&a.sc===b.sc&&a.f===b.f&&a.done===b.done&&a.i===b.i;

function instantly(fn){document.body.classList.add('instant');fn();stage.offsetHeight;requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.remove('instant')));}
function fmt(v,dec){return v.toFixed(dec).replace('.',',');}
function countUp(el,instant){
  const tgt=parseFloat(el.dataset.count),dec=+(el.dataset.dec||0);
  if(instant){el.textContent=fmt(tgt,dec);return;}
  const t0=performance.now(),dur=1400;el.textContent=fmt(0,dec);
  const tick=t=>{const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=fmt(tgt*e,dec);if(p<1)requestAnimationFrame(tick);};
  requestAnimationFrame(tick);
}
/* Kurven: path.draw zeichnet sich, sobald sichtbar */
document.querySelectorAll('path.draw').forEach(p=>{try{const L=Math.ceil(p.getTotalLength());p.style.strokeDasharray=L;p.style.strokeDashoffset=L;p._L=L;}catch(e){}});
function draws(s,show){s.el.querySelectorAll('path.draw').forEach(p=>{const fr=p.closest('.f');const vis=show&&(!fr||fr.classList.contains('in'));p.style.strokeDashoffset=vis?0:(p._L||0);});}

function tileInset(ci){
  const t=tiles[ci].getBoundingClientRect(),s=stage.getBoundingClientRect();
  const l=(t.left-s.left)/scale,tp=(t.top-s.top)/scale,w=t.width/scale,h=t.height/scale;
  return `inset(${tp}px ${W-l-w}px ${H-tp-h}px ${l}px)`;
}
function setHub(done,flashIdx){
  tiles.forEach((t,i)=>{t.classList.toggle('done',i<done);t.classList.toggle('next',i===done);t.classList.toggle('pending',i>done);
    if(i===flashIdx){t.classList.remove('flash');void t.offsetWidth;t.classList.add('flash');}});
}
function applyFrag(s,f,instant,entering){
  s.el.querySelectorAll('.f[data-f]').forEach(e=>{
    const now=+e.dataset.f<=f,was=e.classList.contains('in');
    e.classList.toggle('in',now);
    if(now&&!was) e.querySelectorAll('[data-count]').forEach(c=>countUp(c,instant||entering));
  });
  s.el.querySelectorAll('[data-at]').forEach(e=>e.classList.toggle('at',f>=+e.dataset.at));
  s.el.querySelectorAll('[data-hl]').forEach(e=>{const k=+e.dataset.hl;
    e.classList.toggle('hl',f===k);e.classList.toggle('dim',f>0&&f<=s.nhl&&f!==k);});
  draws(s,true);
  demoFor(s,f);
  if(HOOKS.fragment) try{HOOKS.fragment(s.el,f,{instant:!!instant});}catch(e){console.warn(e);}
}

/* ---------- Live-Demo im iframe ---------- */
function demoDoc(fr){try{return fr.contentDocument;}catch(e){return null;}}
function demoFor(s,f){
  const fr=s.el.querySelector('iframe.demo'); if(!fr)return;
  const labels=(HOOKS.demoLabels||[]);
  const n=s.el.querySelector('.dn'),l=s.el.querySelector('.dl'); if(n){n.textContent=(f+1)+'/'+(s.max+1);if(l)l.textContent=labels[f]||'';}
  const d=demoDoc(fr);
  if(!d||!d.body||!fr._ready){fr._pending=[s,f];return;}
  if(HOOKS.demo) try{HOOKS.demo(d,f);}catch(e){console.warn(e);}
  try{if(d.activeElement&&d.activeElement.blur)d.activeElement.blur();}catch(e){}
  try{window.focus();}catch(e){}
}
document.querySelectorAll('iframe.demo').forEach(fr=>{
  fr.addEventListener('load',()=>{fr._ready=true;
    try{fr.contentWindow.addEventListener('keydown',e=>{e.preventDefault();e.stopImmediatePropagation();onKey(e);},true);}catch(e){}
    if(fr._pending){const [s,f]=fr._pending;fr._pending=null;demoFor(s,f);}
  });
  const b=fr.dataset.b64;
  if(b){try{const bin=atob(b);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);fr.srcdoc=new TextDecoder().decode(u);}catch(e){console.warn(e);}}
});

function sceneCounts(s,instant){s.el.querySelectorAll('[data-count]').forEach(c=>{if(!c.closest('.f'))countUp(c,instant);});}
document.querySelectorAll('video[data-src]').forEach(v=>{const src=v.dataset.src;
  fetch(src).then(r=>r.blob()).then(b=>{v.src=URL.createObjectURL(b);}).catch(()=>{v.src=src;});});
function videoFor(s,on,dir){
  const v=s.el.querySelector('video'); if(!v)return;
  if(on){ if(dir>=0){try{v.currentTime=0;}catch(e){} const p=v.play(); if(p&&p.catch)p.catch(()=>toast('Video startet nicht automatisch: Taste V drücken'));} }
  else v.pause();
}
function showScene(c,si,f,dir,instant){
  c.scenes.forEach((s,j)=>{
    if(j===si){
      const entering=!s.el.classList.contains('on');
      if(entering){
        s.el.classList.remove('off-l','off-r');
        if(!instant){s.el.classList.add(dir>=0?'off-r':'off-l');void s.el.offsetWidth;s.el.classList.remove('off-r','off-l');}
        s.el.classList.add('on');
        applyFrag(s,f,instant,dir<0||instant);
        sceneCounts(s,instant||dir<0);
        videoFor(s,true,instant?1:dir);
        c.el.classList.toggle('dark-on',s.el.classList.contains('dark'));
      } else applyFrag(s,f,instant,false);
    } else if(s.el.classList.contains('on')){
      s.el.classList.remove('on');s.el.classList.add(dir>=0?'off-l':'off-r');videoFor(s,false);draws(s,false);
    }
  });
}
function hideChapter(c){c.el.classList.remove('open','opening','closing','dark-on');
  c.scenes.forEach(s=>{s.el.classList.remove('on','off-l','off-r');videoFor(s,false);draws(s,false);});}
function openChapter(ci,st,dir,instant){
  const c=chapters[ci];
  if(instant){c.el.classList.add('open');showScene(c,st.sc,st.f,1,true);return Promise.resolve();}
  return new Promise(res=>{
    c.el.classList.add('open','opening');
    showScene(c,st.sc,st.f,dir,true);
    const a=c.el.animate([{clipPath:tileInset(ci)},{clipPath:'inset(0px 0px 0px 0px)'}],{duration:720,easing:'cubic-bezier(.65,0,.35,1)'});
    setTimeout(()=>{c.el.classList.remove('opening');
      const s=c.scenes[st.sc]; s.el.classList.remove('on');void s.el.offsetWidth;s.el.classList.add('on');
      if(dir>=0){s.el.querySelectorAll('[data-count]').forEach(x=>{if(!x.closest('.f')||x.closest('.f.in'))countUp(x,false);});videoFor(s,true,1);
        draws(s,false);requestAnimationFrame(()=>requestAnimationFrame(()=>draws(s,true)));}
    },380);
    a.onfinish=()=>res();
  });
}
function closeChapter(ci,instant){
  const c=chapters[ci];
  if(instant){hideChapter(c);return Promise.resolve();}
  return new Promise(res=>{
    c.el.classList.add('closing');
    const a=c.el.animate([{clipPath:'inset(0px 0px 0px 0px)'},{clipPath:tileInset(ci)}],{duration:620,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});
    a.onfinish=()=>{hideChapter(c);a.cancel();res();};
  });
}
function setFinale(i,dir){
  hub.classList.toggle('gone',i!==null);
  finScenes.forEach((s,j)=>{
    if(j===i){ if(!s.el.classList.contains('on')){s.el.classList.remove('off-l','off-r');s.el.classList.add('on');} }
    else if(s.el.classList.contains('on')){s.el.classList.remove('on');s.el.classList.add(dir>=0?'off-l':'off-r');}
  });
}
function hubDoneOf(s){return s.k==='hub'?s.done:s.k==='sc'?s.ch:NCH;}
async function render(prev,next,dir,instant){
  const pCh=prev&&prev.k==='sc'?prev.ch:null, nCh=next.k==='sc'?next.ch:null;
  const fin=next.k==='fin'?next.i:null;
  if(instant||!prev){
    instantly(()=>{chapters.forEach(hideChapter);setHub(hubDoneOf(next));
      if(nCh!==null){chapters[nCh].el.classList.add('open');showScene(chapters[nCh],next.sc,next.f,1,true);}
      finScenes.forEach(s=>s.el.classList.remove('on','off-l','off-r'));setFinale(fin,1);});
    return;
  }
  if(pCh!==nCh){
    busy=true;
    if(pCh!==null) await closeChapter(pCh,false);
    const flash=(next.k==='hub'&&pCh!==null&&next.done===pCh+1)?pCh:-1;
    setHub(hubDoneOf(next),flash);
    setFinale(fin,dir);
    if(nCh!==null){ if(pCh!==null) await new Promise(r=>setTimeout(r,120)); await openChapter(nCh,next,dir,false); }
    busy=false;
  } else if(nCh!==null){
    showScene(chapters[nCh],next.sc,next.f,dir,false);
  } else {
    setHub(hubDoneOf(next)); setFinale(fin,dir);
  }
}
async function go(i,opt={}){
  i=Math.max(0,Math.min(steps.length-1,i));
  const prev=cur,next=steps[i];
  if(same(prev,next)&&!opt.force) return;
  const dir=opt.dir!==undefined?opt.dir:(i>=idx?1:-1);
  idx=i;cur=next;
  if(!timerStart&&i>0) timerStart=Date.now();
  await render(prev,next,dir,!!opt.instant);
  save();updateNotes();
  if(queued){const q=queued;queued=0;step(q);}
}
function step(d){ if(busy){queued=d;return;} go(idx+d,{dir:d}); }
function goChapter(ci){const j=steps.findIndex(s=>s.k==='sc'&&s.ch===ci);if(j>=0)go(j,{dir:1});}
function overview(){
  if(!cur)return; const d=hubDoneOf(cur);
  const j=steps.findIndex(s=>s.k==='hub'&&s.done===d); if(j>=0)go(j,{dir:-1});
}
function toggleShort(){
  const keep=cur; short=!short; build();
  let j=steps.findIndex(s=>same(s,keep));
  if(j<0){ const ch=keep.ch; j=steps.findIndex(s=>s.k==='hub'&&s.done===ch+1);
    const later=steps.findIndex(s=>s.k==='sc'&&s.ch===ch&&s.sc>keep.sc); if(later>=0)j=later; }
  idx=j; go(j,{force:true,dir:1});
  toast(short?'Kurzfassung an: Sollbruchstellen übersprungen':'Kurzfassung aus: volle Fassung');
}
function save(){try{history.replaceState(null,'','#'+idx+(short?'k':''));}catch(e){}}
function load(){const m=(location.hash||'').match(/^#(\d+)(k?)/);if(m){short=!!m[2];build();return Math.min(+m[1],steps.length-1);}return 0;}

function onKey(e){
  const k=e.key;
  if(['ArrowRight','ArrowDown','PageDown',' ','Enter'].includes(k)){e.preventDefault();step(1);}
  else if(['ArrowLeft','ArrowUp','PageUp','Backspace'].includes(k)){e.preventDefault();step(-1);}
  else if(k==='Escape'||k==='o'||k==='O'){overview();}
  else if(/^[1-9]$/.test(k)){const n=+k;if(n<=NUM)goChapter(n-1+OFF);}
  else if(k==='0'||k==='Home'){go(0,{dir:-1});}
  else if(k==='End'){go(steps.length-1,{dir:1});}
  else if(k==='k'||k==='K'||k==='s'||k==='S'){toggleShort();}
  else if(k==='b'||k==='B'||k==='.'||k===','){document.getElementById('blank').classList.toggle('on');}
  else if(k==='n'||k==='N'){openNotes();}
  else if(k==='v'||k==='V'){const v=document.querySelector('.scene.on video');if(v){if(v.paused)v.play();else v.pause();}}
  else if(k==='f'||k==='F'){if(!document.fullscreenElement)document.documentElement.requestFullscreen().catch(()=>{});else document.exitFullscreen();}
  else if(k==='h'||k==='H'||k==='?'){document.getElementById('help').classList.toggle('on');}
  else if(k==='F5'){e.preventDefault();}
}
addEventListener('keydown',onKey);
tiles.forEach((t,i)=>t.addEventListener('click',()=>{if(cur&&cur.k!=='sc')goChapter(i);}));
let idleT;addEventListener('mousemove',()=>{document.body.classList.remove('idle');clearTimeout(idleT);idleT=setTimeout(()=>document.body.classList.add('idle'),2000);});
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),2200);}

/* ---------- Notizenfenster ---------- */
let nw=null,timerStart=0;
const two=n=>String(n).padStart(2,'0');
function chapName(ci){return hasProlog&&ci===0?'Prolog':'Kapitel '+two(numOf(ci));}
function noteFor(s){
  if(s.k==='hub') return {...(hubNotes[s.done]||{t:'',txt:''}),label:s.done===0?'Startseite':'Übersicht nach '+(hasProlog&&s.done===1?'dem Prolog':chapName(s.done-1))};
  const sc=s.k==='sc'?chapters[s.ch].scenes[s.sc]:finScenes[s.i];
  const f=s.f||0; let n=null; sc.notes.forEach(x=>{if(x.f<=f)n=x;});
  const pre=s.k==='fin'?'Finale · ':hasProlog&&s.ch===0?'Prolog · ':two(numOf(s.ch))+' · ';
  return {t:n?n.t:'',txt:n?n.txt:'',fresh:n&&n.f===f,label:pre+sc.label+(sc.max?` (${f}/${sc.max})`:'')};
}
function mmss(sec){const neg=sec<0;sec=Math.abs(Math.round(sec));return (neg?'−':'')+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');}
function parseT(t){if(!t)return null;const [m,s]=t.split(':').map(Number);return m*60+s;}
const esc=t=>t.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const NOTES_HTML=`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Notizen · ${esc(document.title)}</title><style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:Barlow,Bahnschrift,"Segoe UI",Arial,sans-serif;background:#15171E;color:#EDF0F5;padding:28px 34px;height:100vh;display:flex;flex-direction:column;gap:18px}
.top{display:flex;justify-content:space-between;align-items:baseline;font-size:20px;color:#9AA0AD}
.lab{font-size:26px;font-weight:600;color:#fff}.row{display:flex;gap:40px;align-items:baseline}
.tm{font-size:84px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums}.soll{font-size:28px;color:#9AA0AD}.soll b{color:#EDF0F5}
.dl{font-size:28px;font-weight:600}.late{color:#FF6B5E}.ok{color:#8FD18B}
.txt{font-size:27px;line-height:1.42;flex:1;overflow:auto;border-top:1px solid #343844;padding-top:18px}
.txt.old{color:#9AA0AD}.nx{font-size:22px;color:#9AA0AD;border-top:1px solid #343844;padding-top:12px}.nx b{color:#EDF0F5}
.short{display:inline-block;background:#E0362C;color:#fff;padding:2px 10px;font-weight:600;margin-left:12px}
.btns{display:flex;gap:10px}button{font:inherit;font-size:18px;background:#262A34;color:#EDF0F5;border:1px solid #444;padding:8px 14px;cursor:pointer}
</style></head><body>
<div class="top"><span class="lab" id="lab"></span><span id="pos"></span></div>
<div class="row"><div class="tm" id="el">0:00</div><div class="soll">Soll <b id="soll">–</b></div><div class="dl" id="dl"></div><div class="soll" style="margin-left:auto">Uhr <b id="clk"></b></div></div>
<div class="txt" id="txt"></div>
<div class="nx">Als Nächstes: <b id="nx"></b></div>
<div class="btns"><button id="b1">◀ zurück</button><button id="b2">weiter ▶</button><button id="b3">Kurzfassung</button><button id="b4">Timer auf 0</button></div>
</body></html>`;
function openNotes(){
  if(nw&&!nw.closed){nw.focus();return;}
  nw=window.open('','keynote-notizen','width=1180,height=760');
  if(!nw){toast('Notizenfenster blockiert: Pop-ups für diese Datei erlauben');return;}
  nw.document.open();nw.document.write(NOTES_HTML);nw.document.close();
  nw.addEventListener('keydown',onKey);
  const d=nw.document;d.getElementById('b1').onclick=()=>step(-1);d.getElementById('b2').onclick=()=>step(1);
  d.getElementById('b3').onclick=toggleShort;d.getElementById('b4').onclick=()=>{timerStart=Date.now();updateNotes();};
  updateNotes();
}
function updateNotes(){
  if(!nw||nw.closed||!cur)return; const d=nw.document; const n=noteFor(cur);
  d.getElementById('lab').textContent=n.label;
  if(short) d.getElementById('lab').insertAdjacentHTML('beforeend','<span class="short">KURZ</span>');
  d.getElementById('pos').textContent=`Schritt ${idx+1} von ${steps.length}`;
  const tx=d.getElementById('txt');tx.textContent=n.txt||'';tx.className='txt'+(n.fresh===false?' old':'');
  const nx=steps[idx+1]; d.getElementById('nx').textContent=nx?noteFor(nx).label:'Ende';
  d.getElementById('soll').textContent=n.t||'–'; tickNotes();
}
function tickNotes(){
  if(!nw||nw.closed)return; const d=nw.document;
  const el=timerStart?(Date.now()-timerStart)/1000:0; d.getElementById('el').textContent=mmss(el);
  d.getElementById('clk').textContent=new Date().toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit'});
  const n=cur?noteFor(cur):null, t=n?parseT(n.t):null, dl=d.getElementById('dl');
  if(t!==null&&timerStart){const diff=el-t;dl.textContent=(diff>0?'+':'')+mmss(diff);dl.className='dl '+(diff>45?'late':'ok');}else dl.textContent='';
}
setInterval(tickNotes,500);

const start=load();
document.fonts.ready.then(()=>{idx=start;go(start,{instant:true,force:true});});
/* Schnittstelle für Werkzeuge (tools/render.js, tools/fallback.js) */
window.__deck={go,step,steps:()=>steps,toggleShort,noteFor:i=>noteFor(steps[i]),get idx(){return idx;}};
})();
