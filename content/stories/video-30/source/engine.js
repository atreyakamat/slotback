const q=new URLSearchParams(location.search);const V=VIDEOS[(+q.get('d')||1)-1];
document.body.classList.add(V.theme);if(q.has('guides'))document.body.classList.add('guides');
window.DUR=V.dur||7;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const cl=x=>Math.max(0,Math.min(1,x)),P=(t,a,d)=>cl((t-a)/d);
const eo=x=>1-Math.pow(1-x,3);
const bk=x=>{const c1=2.2,c3=c1+1;return x<=0?0:1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
// pop: element enters at time a (scale from s0, rises y0)
function pop(el,t,a,{d=.45,y=60,s=.9,x=0}={}){const p=P(t,a,d),e=bk(p);el.style.opacity=cl(p*2.5);el.style.transform=`translate(${x*(1-e)}px,${y*(1-e)}px) scale(${s+(1-s)*e})`}
function slam(el,t,a){const p=P(t,a,.35),e=bk(p);el.style.opacity=cl(p*3);el.style.transform=`scale(${1.6-.6*e})`}
$('#kicker').textContent=V.kicker;
const M=$('#main');const sub=V.sub?`<p class="sub a" id="sub">${V.sub}</p>`:'';
const hint=V.hint?`<div class="hint a" id="hint">${V.hint} ↓</div><div class="sticker"></div>`:'';
let R=()=>{};
const T={
kinetic(){M.innerHTML=V.lines.map(([s,a],i)=>`<span class="k a ${a?'acc':''}" data-i="${i}"><span>${s}</span></span>`).join('')+sub+hint;
  const ks=$$('.k');const step=V.lines.length>3?.5:.6;
  R=t=>{ks.forEach((k,i)=>slam(k,t,.4+i*step));const e=.4+ks.length*step;
    if($('#sub'))pop($('#sub'),t,e+.1,{y:30,s:1});if($('#hint'))pop($('#hint'),t,e+.2,{y:30,s:1}),$('#hint').style.transform+=` translateY(${Math.sin(t*6)*8*P(t,e+.6,.1)}px)`;}},
logo(){const svg=`<svg class="vlogo a" id="lg" viewBox="0 0 1080 1080">${LOGO}</svg>`;
  M.innerHTML=svg+`<h1 class="a" id="ln">${V.line}</h1>`+sub+(V.cta?`<div class="cta a" id="cta">${V.cta}</div>`:'');
  const lg=$('#lg'),paths=lg.querySelectorAll('path'),arc=paths[0],head=paths[1],chk=paths[2];
  [arc,chk].forEach(p=>{p.setAttribute('pathLength','1');p.style.strokeDasharray='1';});
  const cal=[...lg.querySelectorAll('rect:not(:first-child),line')];
  if(V.theme==='lime')lg.querySelector('rect').setAttribute('fill','#0F2E22');
  R=t=>{pop(lg,t,.2,{d:.6,y:0,s:.6});lg.style.rotate=`${-40*(1-eo(P(t,.2,1.2)))}deg`;
    arc.style.strokeDashoffset=1-eo(P(t,.3,1.0));head.style.opacity=P(t,1.15,.15);
    cal.forEach(c=>c.style.opacity=P(t,.6,.3));chk.style.strokeDashoffset=1-eo(P(t,1.2,.4));
    pop($('#ln'),t,1.6,{y:50});if($('#sub'))pop($('#sub'),t,2.1,{y:30,s:1});
    if($('#cta')){pop($('#cta'),t,2.2,{y:40,s:.6});if(t>2.8)$('#cta').style.transform=`scale(${1+.05*Math.max(0,Math.sin((t-2.8)*4))})`;}}},
calls(){M.innerHTML=`<div style="width:100%;display:flex;flex-direction:column;gap:18px">${V.calls.map(n=>`<div class="call a"><span class="ph">📞</span><span>Calling ${n}…</span><span class="st">No answer</span></div>`).join('')}</div><h1 class="a" id="end" style="margin-top:70px">${V.end}</h1>`;
  const cs=$$('.call');R=t=>{cs.forEach((c,i)=>{const a=.3+i*.6;pop(c,t,a,{x:-120,y:0,s:1});const st=c.querySelector('.st');st.textContent=t<a+.45?'Ringing…':'No answer';st.style.color=t<a+.45?'var(--mut)':'#FF4D3D';});
    cs.forEach(c=>{if(t>3.0)c.style.opacity=1-.6*P(t,3.0,.3)});slam($('#end'),t,3.2)}},
calendar(){M.innerHTML=`<h1 class="m a" id="h">${V.h}</h1><div class="cal a" id="cal">${V.rows.map(([tm,nm])=>`<div class="slot"><div class="sweep"></div><span class="tm" style="position:relative">${tm}</span><span class="nm">${nm}</span><span class="tg"></span></div>`).join('')}</div>`;
  const sl=$$('.slot');R=t=>{pop($('#h'),t,.2);pop($('#cal'),t,.5,{y:80,s:.95});
    V.hit.forEach((ix,k)=>{const s=sl[ix],a=1.4+k*2.0,nm=s.querySelector('.nm'),tg=s.querySelector('.tg'),sw=s.querySelector('.sweep');
      const cancel=t>=a,filled=t>=a+1.1;
      nm.style.textDecoration=cancel&&!filled?'line-through':'none';nm.style.opacity=cancel&&!filled?.5:1;
      nm.textContent=filled?V.fill[k]:V.rows[ix][1];
      tg.textContent=filled?'Filled ✓':cancel?'Cancelled':'';tg.style.background=filled?'#0F2E22':'#FF4D3D';tg.style.color=filled?'#C6F432':'#fff';
      tg.style.transform=`scale(${cancel?bk(P(t,filled?a+1.1:a,.35)):0})`;
      sw.style.transform=`scaleX(${eo(P(t,a+.7,.45))})`;s.classList.toggle('filled',t>=a+.9);
      s.style.transform=`translateX(${cancel&&!filled?Math.sin(t*60)*6*(1-P(t,a,.3)):0}px)`;});}},
counter(){M.innerHTML=`<div class="stat"><div class="label a" id="lb">${V.label}</div><div class="bigc a" id="bc"></div><p class="sub a" id="sb" style="margin-top:0;font-weight:700;font-size:52px;opacity:1">${V.sub}</p>${V.foot?`<div class="footnote a" id="fn">${V.foot}</div>`:''}</div>`;
  R=t=>{pop($('#lb'),t,.2,{y:30,s:1});pop($('#bc'),t,.5,{y:0,s:.7});const v=Math.round(V.to*eo(P(t,.6,2.0)));
    $('#bc').textContent=(V.prefix||'')+v.toLocaleString('en-IN')+(V.suffix||'');
    if(t>2.6)$('#bc').style.transform=`scale(${1+.06*Math.sin(P(t,2.6,.4)*Math.PI)})`;
    pop($('#sb'),t,2.7,{y:30,s:1});if($('#fn'))pop($('#fn'),t,3.2,{y:20,s:1})}},
typing(){M.innerHTML=`<h1 class="m a" id="h">${V.h}</h1><div class="chat">${V.bubbles.map(([w,s])=>`<div class="bb ${w} a"><span class="tx"></span></div>`).join('')}${V.btn?`<div class="bbtn a" id="bt">${V.btn}</div>`:''}</div>`;
  const bs=$$('.bb');R=t=>{pop($('#h'),t,.2);let a=.8;bs.forEach((b,i)=>{const s=V.bubbles[i][1],dur=s.length/32;pop(b,t,a,{y:40,s:.8});
      const tx=b.querySelector('.tx');const typ=P(t,a+.5,dur);
      tx.innerHTML=t<a+.5?'<span class="dots"><i></i><i></i><i></i></span>':s.slice(0,Math.ceil(s.length*typ));
      if(t<a+.5)tx.querySelectorAll('i').forEach((d,j)=>d.style.transform=`translateY(${Math.sin(t*12-j)*6}px)`);
      a+=.5+dur+.5;});
    if($('#bt')){pop($('#bt'),t,a-.2,{y:30,s:.6});if(t>a+.4)$('#bt').style.transform=`scale(${1+.05*Math.max(0,Math.sin((t-a)*5))})`;}}},
timer(){M.innerHTML=`<h1 class="m a" id="h">${V.h}</h1><div class="tcard a" id="tc"><div class="ttl">Today, 4:30 PM</div><div class="tt"><span>Link expires in</span><b id="tv">10:00</b></div><div class="bar"><i id="br"></i></div><div class="stamp a" id="st">${V.stamp}</div></div>`;
  R=t=>{pop($('#h'),t,.2);pop($('#tc'),t,.5,{y:80,s:.95});const p=P(t,.9,V.fast?2.6:3.0);const sec=Math.round(V.from-(V.from-V.to)*(V.fast?eo(p)*0+p*p:p));
    $('#tv').textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;$('#br').style.transform=`scaleX(${sec/600})`;
    const sa=V.fast?3.6:4.0;const e=bk(P(t,sa,.35));$('#st').style.opacity=P(t,sa,.1);$('#st').style.transform=`translate(-50%,-50%) rotate(-8deg) scale(${2.2-1.2*e})`;}},
notifs(){M.innerHTML=`<h1 class="a" id="h">${V.h}</h1><div style="width:100%;display:flex;flex-direction:column;gap:22px;margin-top:60px">${V.notifs.map(n=>`<div class="nt a"><img src="../../../brand/slotback-logo.svg"><div><div class="t1">SlotBack · now</div><div class="t2">${n}</div></div><span class="ck">✓</span></div>`).join('')}</div>${V.foot?`<div class="hint a" id="fn" style="font-size:28px">${V.foot}</div>`:''}`;
  const ns=$$('.nt');R=t=>{pop($('#h'),t,.2);ns.forEach((n,i)=>pop(n,t,1.0+i*.7,{y:-120,s:.9}));if($('#fn'))pop($('#fn'),t,3.4,{y:10,s:1})}},
list(){M.innerHTML=`<h1 class="m a" id="h">${V.h}</h1><div class="rows">${V.items.map(([k,s])=>`<div class="row a"><span class="ic ${k} a">${k=='x'?'✕':'✓'}</span>${s}</div>`).join('')}</div>`;
  const rs=$$('.row');R=t=>{pop($('#h'),t,.2);rs.forEach((r,i)=>{const a=.9+i*.55;pop(r,t,a,{x:-100,y:0,s:1});pop(r.querySelector('.ic'),t,a+.25,{y:0,s:0})})}},
versus(){M.innerHTML=`<div class="vs" style="margin-top:0"><div class="vsc a" id="va"><b>${V.a[0]}</b><span>${V.a[1]}</span><div class="xline" id="xl"></div></div><div class="vsc win a" id="vb"><b>${V.b[0]}</b><span>${V.b[1]}</span></div><div class="chip a" id="ch">vs</div></div>`;
  R=t=>{pop($('#va'),t,.3,{x:-300,y:0,s:1});pop($('#vb'),t,.7,{x:300,y:0,s:1});pop($('#ch'),t,1.1,{y:0,s:0});$('#ch').style.transform='translate(-50%,-50%) '+$('#ch').style.transform;
    $('#xl').style.transform=`translateY(-50%) rotate(-12deg) scaleX(${eo(P(t,2.0,.35))})`;if(t>2.0)$('#va').style.opacity=1-.45*P(t,2.0,.3);
    if(t>2.4)$('#vb').style.transform=`scale(${1+.06*Math.sin(P(t,2.4,.5)*Math.PI)})`;}},
chips(){M.innerHTML=`<h1 class="m a" id="h">${V.h}</h1><div class="chipw">${V.chips.map(c=>`<span class="chip2 a">${c}</span>`).join('')}</div>`;
  const cs=$$('.chip2');R=t=>{pop($('#h'),t,.2);cs.forEach((c,i)=>pop(c,t,1.2+i*.22,{y:30,s:.4}))}},
countdown(){M.innerHTML=V.nums.map(n=>`<div class="cdn a">${n}</div>`).join('')+`<h1 class="a" id="end" style="font-size:150px">${V.end}</h1>`;
  const ns=$$('.cdn');R=t=>{ns.forEach((n,i)=>{const a=.3+i*1.0,p=P(t,a,1.0);n.style.opacity=p>0&&p<1?Math.min(1,p*6,(1-p)*4):0;n.style.transform=`translateY(-50%) scale(${1.4-.5*eo(p)})`});slam($('#end'),t,.3+ns.length*1.0)}},
};
T[V.type]();
window.render=t=>{pop($('#kicker'),t,0,{y:-30,s:1,d:.4});$('#foot').style.opacity=P(t,.3,.4);R(t)};
window.render(q.has('t')?+q.get('t'):99);
