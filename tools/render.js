// Rendert jeden Schritt als PNG und prüft auf JS-Fehler und Überläufe.
//   NODE_PATH=$(npm root -g) node tools/render.js dist/<datei>.html [ordner=shots] [schritte=3,7,12]
// Umgebungsvariable WAIT = Wartezeit pro Schritt in ms (Standard 300; für Endzustände mit Animation 1600).
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
 const file=process.argv[2]; if(!file){console.log('Aufruf: node tools/render.js dist/x.html [ordner] [schritte]');process.exit(1);}
 const out=process.argv[3]||'shots'; fs.mkdirSync(out,{recursive:true});
 const only=process.argv[4]?process.argv[4].split(',').map(Number):null;
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('file://'+path.resolve(file));await p.waitForTimeout(900);
 const n=await p.evaluate(()=>window.__deck.steps().length);
 const warn=[];
 for(let i=0;i<n;i++){ if(only&&!only.includes(i))continue;
   await p.evaluate(i=>window.__deck.go(i,{instant:true,force:true}),i);
   await p.waitForTimeout(process.env.WAIT?+process.env.WAIT:300);
   const info=await p.evaluate(i=>{
     const st=window.__deck.steps()[i];const label=window.__deck.noteFor(i).label;
     const S=document.getElementById('stage').getBoundingClientRect();const k=S.width/1920;
     const root=st.k==='hub'?document.getElementById('hub'):document.querySelector(st.k==='fin'?'#finale .scene.on':'.chapter.open .scene.on');
     const w=[];
     if(root){
       // sichtbare Elemente, die über den Bühnenrand oder den Inhaltsrahmen ragen
       const wrap=root.querySelector('.wrap');const WR=wrap?wrap.getBoundingClientRect():null;
       root.querySelectorAll('*').forEach(el=>{
         if(el.closest('aside')||el.closest('svg')&&el.tagName!=='svg')return;
         const cs=getComputedStyle(el);if(cs.visibility==='hidden'||+cs.opacity===0||cs.display==='none')return;
         const f=el.closest('.f');if(f&&!f.classList.contains('in'))return;
         const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
         const x2=(r.right-S.left)/k,y2=(r.bottom-S.top)/k;
         if(x2>1921||y2>1081) w.push(`ragt aus der Bühne: <${el.tagName.toLowerCase()} class="${el.className.baseVal??el.className}"> ${Math.round(x2)}×${Math.round(y2)}`);
         else if(WR&&el!==wrap&&wrap.contains(el)&&(r.right>WR.right+40*k||r.bottom>WR.bottom+40*k)) w.push(`ragt aus dem Inhaltsrahmen: <${el.tagName.toLowerCase()} class="${el.className.baseVal??el.className}">`);
       });
       // Kacheln mit abgeschnittenem Text
       if(st.k==='hub') root.querySelectorAll('.tile.done').forEach(t=>{
         const T=t.getBoundingClientRect(),head=T.top+72*k;let bad=t.scrollHeight>t.clientHeight+2||t.scrollWidth>t.clientWidth+2;
         t.querySelectorAll('.sum *').forEach(e=>{const r=e.getBoundingClientRect();if(r.height&&(r.top<head||r.right>T.right-10*k))bad=true;});
         if(bad)w.push('Kernaussage passt nicht in die Kachel: '+(t.querySelector('.ttl')||{}).textContent);});
     }
     return {label,w:[...new Set(w)].slice(0,6)};
   },i);
   await p.screenshot({path:path.join(out,String(i).padStart(3,'0')+'.png')});
   console.log(String(i).padStart(3),info.label);
   info.w.forEach(x=>{console.log('      ⚠ '+x);warn.push(i+': '+x);});
 }
 console.log(`\nSchritte: ${n} · JS-Fehler: ${errs.length?errs.join(' | '):'keine'} · Warnungen: ${warn.length}`);
 await b.close();})();
