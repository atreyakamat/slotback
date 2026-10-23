const LOGOSVG=`<svg viewBox="0 0 1080 1080" style="width:220px;height:220px;border-radius:50%;box-shadow:0 0 0 10px rgba(255,255,255,.08),0 0 90px rgba(198,244,50,.4)">${window.LOGO}</svg>`;
const CTA=(h,sub)=>`${LOGOSVG}<h2 style="margin-top:56px">${h}</h2><p class="p">${sub}</p>
<div style="margin-top:56px"><span class="glass lime cta">DM “DEMO” to @slotback.app →</span></div>
<div class="foot" style="margin-top:40px">For salons, clinics &amp; studios in Goa</div>`;
const swipe=t=>`<div class="sw" style="margin-top:70px"><span class="glass" style="padding:0;width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px">→</span>${t}</div>`;
const meter=n=>`<div class="meter">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</div>`;
const rankSlide=(n,title,desc,score,pro,con,lime)=>`<div style="display:flex;align-items:flex-end;gap:30px"><div class="rank" ${lime?'style="color:var(--l);-webkit-text-stroke:0"':''}>#${n}</div><span class="tag" style="margin-bottom:30px">${lime?'BEST':'RANKED'}</span></div>
<h2 style="margin-top:40px">${title}</h2><p class="p">${desc}</p>
<div class="glass ${lime?'lime':''}" style="padding:30px 36px;margin-top:40px"><div style="font-weight:800;font-size:26px;letter-spacing:.14em;opacity:.8">HOW WELL IT REFILLS THE SLOT</div>${meter(score)}</div>
<div class="pc"><div class="glass"><b style="color:var(--l)">UPSIDE</b>${pro}</div><div class="glass red"><b style="color:#FF8A7A">DOWNSIDE</b>${con}</div></div>`;
const mythSlide=(n,m,t)=>`<span class="tag" style="align-self:flex-start">MYTH #${n}</span>
<div class="glass red" style="padding:50px 54px;margin-top:34px"><div style="font-weight:800;font-size:26px;letter-spacing:.14em;color:#FF8A7A">MYTH</div><div class="myth" style="margin-top:14px;text-decoration:line-through;text-decoration-color:#FF5A4A;text-decoration-thickness:10px">${m}</div></div>
<div class="glass lime" style="padding:50px 54px;margin-top:28px"><div style="font-weight:800;font-size:26px;letter-spacing:.14em">TRUTH</div><h3 style="margin-top:14px;font-size:58px">${t}</h3></div>`;

const msgSlide=(n,when,title,text)=>`<div style="display:flex;align-items:center;gap:26px"><div class="num">${n}</div><div><div class="kick" style="margin:0">${when}</div><h2 style="font-size:76px">${title}</h2></div></div>
<div class="bub" style="margin-top:60px">${text}<small>✓✓ Sent from your phone</small></div>
<div class="glass" style="margin-top:34px;padding:24px 34px;font-weight:700;font-size:30px;display:flex;justify-content:space-between;align-items:center"><span>Swap in your name + time</span><span class="pill g" style="margin:0">COPY IT</span></div>`;
const ruleSlide=(n,title,desc,badge)=>`<div style="display:flex;align-items:flex-end;gap:30px"><div class="rank">${n}</div><span class="tag" style="margin-bottom:30px">RULE ${n} OF 5</span></div>
<h2 style="margin-top:44px">${title}</h2><p class="p">${desc}</p>
<div class="glass lime" style="margin-top:50px;padding:40px;text-align:center;font-family:AB;font-size:64px;letter-spacing:-.03em">${badge}</div>`;

window.CAROUSELS=[
{name:"money-leak",seed:3,rings:[[700,180,760],[4100,500,900]],orbs:[[860,920,260],[2050,120,180],[3180,1000,220],[5300,140,240],[6300,950,200]],slides:[
`<div class="kick">Example · ₹1,000 slot</div><h1>A client<br>just <span class="l">cancelled.</span></h1><p class="p" style="max-width:780px">Here's where the money actually goes, and how to get it back.</p>${swipe("Swipe to see the damage")}`,
`<div class="kick">The hour still costs you</div><h2>Booked or empty,<br>you still pay for:</h2>
<div style="display:flex;flex-direction:column;gap:20px;margin-top:50px">${[["🏠","Rent for that hour"],["👩‍🔧","Staff wages"],["❄️","AC &amp; electricity"],["🧴","Prep &amp; product"]].map(([i,t])=>`<div class="glass item"><span class="ico">${i}</span>${t}</div>`).join('')}</div>`,
`<div class="kick">The revenue</div><h2>What that slot<br>earned you:</h2>
<div class="glass" style="padding:60px;margin-top:50px;text-align:center"><div class="big" style="color:rgba(245,239,225,.45)"><span class="strike">₹1,000</span></div><div class="big l" style="margin-top:20px">₹0</div></div>`,
`<div class="kick">Now multiply it</div><h2>Just one cancel<br>a day adds up.</h2>
<div style="display:flex;flex-direction:column;gap:20px;margin-top:50px">
<div class="row">${[["1","cancel a day"],["₹1,000","per slot"],["26","working days"]].map(([a,b])=>`<div class="glass" style="flex:1;padding:36px 24px;text-align:center"><div style="font-family:AB;font-size:64px">${a}</div><div style="font-weight:700;font-size:28px;opacity:.7;margin-top:8px">${b}</div></div>`).join('')}</div>
<div class="glass lime" style="padding:44px;text-align:center"><div style="font-weight:800;font-size:28px;letter-spacing:.14em">= LOST EVERY MONTH</div><div style="font-family:AB;font-size:150px;letter-spacing:-.05em;line-height:1">₹26,000</div></div></div>
<div class="foot" style="margin-top:24px">Example numbers. Plug in your own.</div>`,
`<div class="kick">Over a year</div><div class="big l" style="font-size:210px">₹3,12,000</div><h2 style="margin-top:30px">walks out<br>the door.</h2><p class="p">From one empty slot a day. Most businesses have more than one.</p>`,
`<div class="kick">Or…</div><h1>Refill it<br><span class="l">in minutes.</span></h1>
<div class="flow" style="margin-top:70px"><div class="glass st">Client<br>cancels</div><span class="ar">→</span><div class="glass st">Waitlist gets<br>a link</div><span class="ar">→</span><div class="glass lime st">Slot<br>filled ✓</div></div>
<p class="p">First to tap gets the slot. No calls. No chasing.</p>`,
CTA("Stop the leak.","SlotBack sends your waitlist a claim link the moment someone cancels.")]},

{name:"cancel-ranked",seed:7,rings:[[-200,600,800],[3500,-200,820],[6000,700,700]],orbs:[[880,160,200],[2000,1000,240],[4300,1050,200],[5250,180,230]],slides:[
`<div class="kick">Saved by smart owners</div><h1>Someone<br>cancelled<br><span class="l">1 hour before.</span></h1><p class="p">5 ways to handle it, ranked worst to best.</p>${swipe("Swipe · save this for later")}`,
rankSlide(5,"Do nothing.","Accept the gap and move on.",0,"Zero effort.","The slot earns ₹0. Every time."),
rankSlide(4,"Call regulars<br>one by one.","Scroll your contacts and start dialling.",2,"Sometimes works.","30–45 minutes of calls. Most don't pick up."),
rankSlide(3,"Blast a<br>WhatsApp group.","One message to everyone at once.",3,"Fast to send.","5 people reply, 1 gets it, 4 feel let down. Double-booking risk."),
rankSlide(2,"Take deposits.","Charge upfront when they book.",2,"Fewer no-shows.","Doesn't put anyone back in the slot. Some clients push back."),
rankSlide(1,"Send a claim<br>link to your waitlist.","Everyone who wanted an earlier slot gets one link.",5,"First tap books it. Automatic.","Needs a waitlist. (SlotBack helps you build one.)",true),
CTA("That's SlotBack.","Claim links for every cancelled slot. Save this post for your next cancel.")]},

{name:"salon-vs-clinic",seed:11,rings:[[760,330,640],[2900,-150,800],[4700,600,760]],orbs:[[760,1090,200],[2000,180,240],[4060,1120,200]],slides:[
`<div class="split" style="margin-bottom:60px"><div class="glass" style="text-align:center;font-size:120px;padding:50px">💇‍♀️</div><div class="glass" style="text-align:center;font-size:120px;padding:50px">🩺</div></div>
<div class="kick">Salon or clinic?</div><h1>Same empty<br><span class="l">slot.</span></h1>${swipe("Swipe · which one are you?")}`,
`<div class="kick">4:00 PM, today</div><h2>Two businesses.<br>One problem.</h2>
<div class="split" style="margin-top:50px"><div class="glass phone"><div class="mt">Salon · 4:00 PM</div><div class="tt">Hair colour<br>with Tara</div><span class="pill r">Cancelled</span></div>
<div class="glass phone"><div class="mt">Clinic · 4:00 PM</div><div class="tt">Physio<br>with Dev</div><span class="pill r">Cancelled</span></div></div>`,
`<div class="kick">What sits idle</div><h2>The cost looks<br>different. It isn't.</h2>
<div class="split" style="margin-top:50px">${[["SALON",["Stylist waiting","Chair empty","Colour prepped"]],["CLINIC",["Therapist waiting","Room empty","Equipment unused"]]].map(([t,xs])=>`<div class="glass"><div class="tag">${t}</div>${xs.map(x=>`<div style="font-weight:800;font-size:36px;margin-top:26px">✕ ${x}</div>`).join('')}</div>`).join('')}</div>
<p class="p">Either way, the hour is paid for and earns nothing.</p>`,
`<div class="kick">What usually happens</div><h2>Both do<br>the same thing.</h2>
<div style="display:flex;flex-direction:column;gap:20px;margin-top:50px">${["📞  Call a few regulars","⏳  Wait for replies","📭  Nobody's free in time","🕳️  Slot stays empty"].map(t=>`<div class="glass item">${t}</div>`).join('')}</div>`,
`<div class="kick">Same fix</div><h1>One link.<br><span class="l">Slot filled.</span></h1>
<div class="glass" style="padding:40px;margin-top:56px"><div class="flow"><div class="glass st">Cancel</div><span class="ar">→</span><div class="glass st">Claim link</div><span class="ar">→</span><div class="glass lime st">Filled ✓</div></div></div>
<p class="p">Your waitlist gets a link. First tap books it. Works for any appointment.</p>`,
CTA("Which one are you?","Comment 💇 for salon or 🩺 for clinic, and we'll show you how it works for you.")]},

{name:"myths",seed:5,rings:[[600,-200,700],[2700,700,820],[5100,-100,760]],orbs:[[900,1000,220],[1900,200,180],[3900,150,240],[4950,1030,200],[6200,300,200]],slides:[
`<div class="kick">Owners believe these</div><h1>4 myths about<br><span class="l">last-minute</span><br>cancellations.</h1>${swipe("Swipe to bust them")}`,
mythSlide(1,"“It's just bad luck.”","It happens every week. If it's predictable, it's fixable."),
mythSlide(2,"“Deposits solve it.”","Deposits cut no-shows. They don't put a client back in the slot."),
mythSlide(3,"“Clients hate getting links.”","Your waitlist asked for an earlier slot. A link is the fastest way to give it to them."),
mythSlide(4,"“It's too techy for my staff.”","Mark the slot as cancelled. SlotBack does the rest."),
`<div class="kick">Recap</div><h2>Myths, busted.</h2>
<div style="display:flex;flex-direction:column;gap:18px;margin-top:50px">${["Just bad luck","Deposits solve it","Clients hate links","Too techy"].map(t=>`<div class="glass item" style="justify-content:space-between"><span class="strike" style="color:rgba(245,239,225,.6)">${t}</span><span class="pill g" style="margin:0">BUSTED</span></div>`).join('')}</div>`,
CTA("Ready to refill<br>every slot?","Which myth did you believe? Tell us in the comments.")]},

{name:"rescue-messages",seed:13,rings:[[820,200,700],[3300,800,760],[5600,-150,820]],orbs:[[880,1040,210],[2150,160,200],[4300,1080,230],[6400,260,200]],slides:[
`<div class="kick">Copy · paste · fill the slot</div><h1>5 messages<br>that win<br><span class="l">slots back.</span></h1><p class="p">Save this. Use it the next time someone cancels.</p>${swipe("Swipe for the scripts")}`,
msgSlide(1,"Right after a cancel","The offer","Hi! A 4:30 PM slot just opened at Glow Studio today. Want it? Reply YES and it's yours. First reply gets it 🙌"),
msgSlide(2,"To the client who cancelled","The rebook","No worries at all! Want me to move you to another day this week? I'll hold the best time for you."),
msgSlide(3,"24 hours before","The reminder","See you tomorrow at 4:30 PM! If plans change, just reply here so we can give the slot to someone on our waitlist 💚"),
msgSlide(4,"When a slot is full","The waitlist invite","That time's booked, but want me to add you to our waitlist? If anything opens earlier, you'll hear first."),
msgSlide(5,"After someone else claims it","The kind no","So sorry, that slot just got taken! You're still on the waitlist, and you'll be first for the next one."),
CTA("Or let SlotBack<br>send them for you.","Free templates + cost calculator: link in bio. Or DM “DEMO”.")]},

{name:"fair-policy",seed:17,rings:[[-150,300,760],[2600,-100,780],[5000,700,800]],orbs:[[860,1000,220],[1950,180,210],[3900,1050,200],[6200,200,230]],slides:[
`<div class="kick">Fair to you · fair to them</div><h1>A cancellation<br>policy clients<br><span class="l">won't hate.</span></h1>${swipe("Swipe for the 5 rules")}`,
ruleSlide(1,"Pick one notice window.","24 hours works for most. Physio and skin clinics often use 12.","24 HOURS"),
ruleSlide(2,"Say it before they book.","On the booking message, your bio and a card at reception. No surprises.","NO SURPRISES"),
ruleSlide(3,"Keep the fee simple.","A deposit or 50% of the service. Never a mystery number.","50% OR DEPOSIT"),
ruleSlide(4,"Give one free pass.","Life happens. The first late cancel is on you. It earns loyalty.","1 FREE PASS"),
ruleSlide(5,"Refill, then refund.","If someone from your waitlist takes the slot, waive the fee. Everyone wins.","FILLED = NO FEE"),
`<div class="kick">Copy this</div><h2>Your policy,<br>in 3 lines.</h2>
<div class="bub" style="margin-top:50px;font-size:38px">Please give us 24 hours' notice to cancel or move your booking.<br><br>Later than that, we keep a 50% fee, unless we refill your slot.<br><br>Your first late cancel is on us 💚</div>
<p class="p" style="font-size:34px">Write yours in 10 seconds with our free policy writer. Link in bio.</p>`,
CTA("Then fill the slot<br>anyway.","SlotBack sends your waitlist a claim link the moment someone cancels.")]},
];