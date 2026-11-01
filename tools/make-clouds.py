# Gera as nuvens translúcidas que atravessam a vista aérea (dist/clouds/cloud-*.png).
import random
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
out = Path(__file__).resolve().parent.parent / 'dist' / 'clouds'
out.mkdir(exist_ok=True)
for n, (w, h, puffs) in enumerate([(900, 520, 26), (760, 460, 20), (620, 360, 16)], 1):
    rnd = random.Random(n * 7)
    alpha = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(alpha)
    for _ in range(puffs):
        r = rnd.uniform(.12, .24) * w
        r = min(r, w * .18)
        x = min(max(rnd.gauss(w / 2, w * .12), w * .3), w * .7)
        y = min(max(rnd.gauss(h / 2, h * .08), h * .4), h * .6)
        d.ellipse((x - r, y - r * .55, x + r, y + r * .55), fill=rnd.randint(60, 120))
    alpha = alpha.filter(ImageFilter.GaussianBlur(w * .045))
    # Garante borda totalmente transparente para não aparecer recorte retangular.
    fade = Image.new('L', (w, h), 0)
    ImageDraw.Draw(fade).ellipse((w * .06, h * .1, w * .94, h * .9), fill=255)
    fade = fade.filter(ImageFilter.GaussianBlur(w * .06))
    alpha = Image.composite(alpha, Image.new('L', (w, h), 0), fade)
    img = Image.new('RGBA', (w, h), (255, 255, 255, 0))
    img.putalpha(alpha)
    img.save(out / f'cloud-{n}.png', optimize=True)
print('ok')
