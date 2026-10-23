// Renders deck.html to a PDF and one PNG per slide.
// Usage: NODE_PATH=<global node_modules> node render.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const here = __dirname, out = path.join(here, '..');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.join(here, 'deck.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(out, 'slotback-pitch-deck-v1.pdf'), width: '1920px', height: '1080px', printBackground: true });
  const slides = await p.$$('.slide');
  for (let i = 0; i < slides.length; i++) {
    await slides[i].screenshot({ path: path.join(out, 'slides', String(i + 1).padStart(2, '0') + '.png') });
  }
  console.log(slides.length, 'slides');
  await b.close();
})();
