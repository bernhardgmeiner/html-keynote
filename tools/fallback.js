// Screenshots für die Notfall-PowerPoint.
//   NODE_PATH=$(npm root -g) node tools/fallback.js dist/<datei>.html [ordner=fb]
// Auswahl: jede Übersicht, jede Szene im Endzustand, dazu Zwischenstände aus data-fb="0,2" an der Szene.
// Szenen mit <video> werden als Video übernommen (Datei wird aus der HTML extrahiert).
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
 const file=process.argv[2]; const out=process.argv[3]||'fb'; fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
 await p.goto('file://'+path.resolve(file));await p.waitForTimeout(900);
 const steps=await p.evaluate(()=>window.__deck.steps());
 const extra=await p.evaluate(()=>[...document.querySelectorAll('section.chapter')].map(c=>[...c.querySelectorAll(':scope > .scene')].map(s=>(s.dataset.fb||'').split(',').filter(x=>x!=='').map(Number))));
 const pick=[];
 for(let i=0;i<steps.length;i++){const s=steps[i],n=steps[i+1];
   if(s.k!=='sc'){pick.push(i);continue;}
   const last=!n||n.k!=='sc'||n.sc!==s.sc||n.ch!==s.ch;
   if(last||extra[s.ch][s.sc].includes(s.f)) pick.push(i);
 }
 const list=[];let vids=0;
 for(const i of pick){
   await p.evaluate(i=>window.__deck.go(i,{instant:true,force:true}),i);await p.waitForTimeout(2000);
   const f=path.join(out,String(i).padStart(3,'0')+'.png');await p.screenshot({path:f});
   const info=await p.evaluate(i=>{const s=window.__deck.steps()[i];const n=window.__deck.noteFor(i);
     let root=null;if(s.k==='sc')root=document.querySelectorAll('section.chapter')[s.ch].querySelectorAll(':scope > .scene')[s.sc];
     else if(s.k==='fin')root=document.querySelectorAll('#finale .scene')[s.i];
     let note='';
     if(root){note=[...root.querySelectorAll('aside.note')].filter(a=>+a.dataset.f<=s.f).map(a=>(a.dataset.t?'['+a.dataset.t+'] ':'')+a.textContent.trim()).join('\n\n');}
     else note=(n.t?'['+n.t+'] ':'')+(n.txt||'');
     const v=root&&root.querySelector('video[data-src]');
     return {note,label:n.label,video:v&&s.f===0?v.dataset.src:null};},i);
   let video=null;
   if(info.video&&info.video.startsWith('data:')){video=path.join(out,`video${++vids}.mp4`);fs.writeFileSync(video,Buffer.from(info.video.split(',')[1],'base64'));}
   list.push({i,file:f,step:steps[i],label:info.label,note:info.note,video});
 }
 fs.writeFileSync(path.join(out,'list.json'),JSON.stringify(list,null,1));
 console.log(list.length,'Folien für die Notfall-PowerPoint');await b.close();})();
