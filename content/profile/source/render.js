const { chromium } = require('playwright'); const path=require('path'),fs=require('fs');
(async()=>{const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'});
const names=['how-it-works','faq','demo','who-its-for','results'];
for(const [m,n,w,h] of [...[1,2,3,4,5].map(i=>['cover',i,1080,1920]),...[1,2,3].map(i=>['post',i,1080,1350])]){
  const p=await b.newPage({viewport:{width:w,height:h}});await p.goto('file://'+path.resolve(__dirname,'profile.html')+`?m=${m}&i=${n}`);
  await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(100);
  await p.screenshot({path:path.join(out,m==='cover'?`highlight-${n}-${names[n-1]}.png`:`pinned-${n}.png`)});await p.close();}
await b.close();})();
