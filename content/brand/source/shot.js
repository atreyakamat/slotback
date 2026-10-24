const { chromium } = require('playwright');
(async () => {
  const [,, html, out, w, h] = process.argv;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  await p.goto(html.startsWith('file:') ? html : 'file://' + require('path').resolve(html));
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: out, omitBackground: false });
  await b.close();
})();
