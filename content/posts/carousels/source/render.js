const { chromium } = require('playwright'); const path=require('path'),fs=require('fs');
(async()=>{const [,,out,which]=process.argv;fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'});
const p=await b.newPage({viewport:{width:1080,height:1350}});
for(const c of (which||'1,2,3,4').split(',').map(Number)){
  await p.goto('file://'+path.resolve(__dirname,'carousel.html')+'?c='+c);await p.evaluate(()=>document.fonts.ready);
  const {N,name}=await p.evaluate(()=>({N:window.N,name:CAROUSELS[(+new URLSearchParams(location.search).get('c'))-1].name}));
  await p.setViewportSize({width:N*1080,height:1350});await p.waitForTimeout(150);
  const dir=path.join(out,`${c}-${name}`);fs.mkdirSync(dir,{recursive:true});
  for(let i=0;i<N;i++)await p.screenshot({path:path.join(dir,`slide-${i+1}.png`),clip:{x:i*1080,y:0,width:1080,height:1350}});
  await p.screenshot({path:path.join(out,`${c}-${name}-strip.png`)});console.log('done',c,N);}
await b.close();})();
