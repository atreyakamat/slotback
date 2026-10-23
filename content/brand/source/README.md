# Logo + launch Story source

- `gen_logos.py` writes `logo-A.svg`, `logo-B.svg` and `logo-C.svg`. **B is the chosen logo** (it's copied to `../slotback-logo.svg`).
- `story.html` is the 1080×1920 launch Story. `?logo=A|B|C` swaps the mark, and `?guides` shades Instagram's top and bottom UI zones.
- `shot.js` renders an HTML/SVG file to PNG with Playwright:

```sh
python3 gen_logos.py
NODE_PATH=$(npm root -g) node shot.js logo-B.svg logo-B.png 1080 1080
NODE_PATH=$(npm root -g) node shot.js "file://$PWD/story.html" story.png 1080 1920
```

`shot.js` hardcodes the sandbox's headless Chromium path. Delete `executablePath` to use Playwright's default browser.

Fonts: Archivo Black and Inter Tight (OFL), taken from the brand reel source.
