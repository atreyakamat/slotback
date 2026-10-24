# Print source

`flyer.html?p=flyer` is the A5 flyer and `flyer.html?p=card` is the A6 table card. Fonts and `logo.js` are the same files as in `posts/carousels/source` (copy them in before rendering).

```
python3 -c "import segno; segno.make('https://instagram.com/slotback.app',error='m').save('qr-ig.svg',scale=10,border=0,dark='#07140F',light=None)"
NODE_PATH=/opt/node22/lib/node_modules node render.js out   # PNGs at 300 dpi
```

The PDFs are the PNGs wrapped at 300 dpi with Pillow (`Image.save(..., resolution=300)`).
