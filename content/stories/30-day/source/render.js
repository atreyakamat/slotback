const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [,, out, guides, only] = process.argv;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (let d = 1; d <= 30; d++) {
    if (only && !only.split(',').includes(String(d))) continue;
    await p.goto('file://' + path.resolve(__dirname, 'series.html') + `?d=${d}` + (guides === '1' ? '&guides' : ''));
    await p.evaluate(() => document.fonts.ready);
    // flag overflow: content taller than the safe area
    const over = await p.evaluate(() => { const m = document.getElementById('main'); return m.scrollHeight > m.clientHeight + 1 || m.scrollWidth > m.clientWidth + 1; });
    if (over) console.log('OVERFLOW day', d);
    await p.screenshot({ path: path.join(out, `day-${String(d).padStart(2, '0')}.png`) });
  }
  await b.close();
})();
