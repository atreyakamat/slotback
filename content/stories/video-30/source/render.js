// node render.js <outdir> <days e.g. 1,2,3 or all> [stills]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
const FPS = 30;
(async () => {
  const [,, out, which, stills] = process.argv;
  fs.mkdirSync(out, { recursive: true });
  const days = which === 'all' ? [...Array(30)].map((_, i) => i + 1) : which.split(',').map(Number);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const d of days) {
    await p.goto('file://' + path.resolve(__dirname, 'video.html') + `?d=${d}&t=0`);
    await p.evaluate(() => document.fonts.ready);
    const dur = await p.evaluate(() => window.DUR);
    const name = path.join(out, `story-video-${String(d).padStart(2, '0')}`);
    if (stills) { // contact frames for review
      for (const t of stills.split(',').map(Number)) { await p.evaluate(t => window.render(t), t); await p.screenshot({ path: `${name}-t${t}.png` }); }
      continue;
    }
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', name + '.mp4']);
    for (let f = 0; f < dur * FPS; f++) {
      await p.evaluate(t => window.render(t), f / FPS);
      const buf = await p.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    console.log('done', d);
  }
  await b.close();
})();
