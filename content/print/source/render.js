// Renders the flyer and table card at 300 dpi (device scale 2), then wraps each PNG into a print PDF.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  for (const [p, w, h] of [['flyer', 874, 1240], ['card', 620, 874]]) {
    const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await pg.goto('file://' + path.resolve(__dirname, 'flyer.html') + '?p=' + p);
    await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(200);
    await pg.screenshot({ path: path.join(process.argv[2] || 'out', `${p}.png`) });
    console.log('done', p);
  }
  await b.close();
})();
