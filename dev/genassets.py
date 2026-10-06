import os, glob, re
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = "D:/OneDrive/Desktop/dsh/timeless-china"
CL = os.path.join(ROOT, "dev", "clean")
ST = os.path.join(ROOT, "dev", "stills")
OUT = os.path.join(ROOT, "screenshots")
GHA = os.path.join(ROOT, ".github", "assets")
os.makedirs(OUT, exist_ok=True); os.makedirs(GHA, exist_ok=True)

def font(sz, cjk=False, bold=False):
    cands = ([r"C:\Windows\Fonts\msyhbd.ttc", r"C:\Windows\Fonts\msyh.ttc", r"C:\Windows\Fonts\simhei.ttf"] if cjk
             else [r"C:\Windows\Fonts\georgiab.ttf" if bold else r"C:\Windows\Fonts\georgia.ttf",
                   r"C:\Windows\Fonts\timesbd.ttf" if bold else r"C:\Windows\Fonts\times.ttf",
                   r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf"])
    for c in cands:
        if os.path.exists(c):
            try: return ImageFont.truetype(c, sz)
            except Exception: pass
    return ImageFont.load_default()

def spaced(d, xy, text, f, fill, sp=0, anchor="la"):
    x, y = xy
    if sp == 0:
        d.text((x, y), text, font=f, fill=fill, anchor=anchor); return
    total = sum(d.textlength(ch, font=f) + sp for ch in text) - sp
    if anchor[0] == "m": x -= total / 2
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill, anchor="l" + anchor[1])
        x += d.textlength(ch, font=f) + sp

def vignette(im, strength=0.5):
    w, h = im.size
    m = Image.new("L", (w, h), 0)
    dm = ImageDraw.Draw(m)
    for i in range(40):
        t = i / 39.0
        dm.ellipse([-w*0.28 + t*w*0.28, -h*0.3 + t*h*0.3, w*1.28 - t*w*0.28, h*1.3 - t*h*0.3], fill=int(255*(1-t)**0.75))
    m = m.filter(ImageFilter.GaussianBlur(w*0.02))
    dark = Image.new("RGB", (w, h), (4, 6, 11))
    return Image.composite(im, Image.blend(im, dark, strength), m)

def grad_bottom(im, h_frac=0.4, top=0.0, bottom=0.85):
    w, h = im.size
    gh = int(h * h_frac)
    ov = Image.new("L", (w, gh), 0)
    do = ImageDraw.Draw(ov)
    for y in range(gh):
        do.line([(0, y), (w, y)], fill=int(255 * (top + (bottom - top) * (y / gh))))
    ov = ov.resize((w, h), Image.BILINEAR)
    ov = Image.new("L", (w, h), 0).paste if False else ov
    black = Image.new("RGB", (w, h), (3, 5, 9))
    mask = Image.new("L", (w, h), 0)
    mask.paste(ov.crop((0, h - gh, w, h)), (0, h - gh))
    return Image.composite(black, im, mask)

ORDER = ["01-opening","02-great-wall","03-yellow-mountains","04-li-river","05-silk-road","06-shanghai","07-suzhou-garden"]
LABEL = ["OPENING","THE GREAT WALL","YELLOW MOUNTAINS","LI RIVER","SILK ROAD","SHANGHAI","SUZHOU GARDEN"]

# --- README stills: resize to 1600x1000 already captured
for n in ORDER:
    src = os.path.join(ST, n + ".png")
    im = Image.open(src).convert("RGB")
    im.save(os.path.join(OUT, n + ".png"), optimize=True)

# --- poster: title over the intro frame
intro = Image.open(os.path.join(CL, "_clean-01-opening.png")).convert("RGB")
poster = vignette(grad_bottom(intro, 0.45, 0.0, 0.9), 0.45)
w, h = poster.size
d = ImageDraw.Draw(poster)
spaced(d, (w/2, h*0.30), "T I M E L E S S", font(int(h*0.115), False, True), (248, 232, 196), 0, "ma")
spaced(d, (w/2, h*0.47), "CHINA", font(int(h*0.062), False, True), (232, 199, 132), int(h*0.026), "ma")
fz = font(int(h*0.045), True)
tw = d.textlength("\u5927\u7f8e\u4e2d\u56fd", font=fz)
d.text((w/2, h*0.585), "\u5927\u7f8e\u4e2d\u56fd", font=fz, fill=(240, 214, 158), anchor="ma")
spaced(d, (w/2, h*0.69), "A CHINA TRAVEL FILM", font(int(h*0.019)), (226, 220, 206), int(h*0.011), "ma")
d.line([(w*0.36, h*0.655), (w*0.64, h*0.655)], fill=(180, 148, 96), width=1)
poster.save(os.path.join(OUT, "poster.png"), optimize=True)

# --- hero: poster crop 1:1.9 wide
hw = 1920; hh = 1010
hero = poster.resize((hw, int(hw * poster.size[1] / poster.size[0])), Image.LANCZOS)
top = max(0, (hero.size[1] - hh) // 2 - 20)
hero = hero.crop((0, top, hw, min(hero.size[1], top + hh)))
hero.save(os.path.join(OUT, "hero.png"), optimize=True)

# --- social preview 1280x640
sp = poster.resize((1280, int(1280 * poster.size[1] / poster.size[0])), Image.LANCZOS)
sp = sp.crop((0, (sp.size[1]-640)//2, 1280, (sp.size[1]-640)//2 + 640))
ds = ImageDraw.Draw(sp)
sp.save(os.path.join(GHA, "social-preview.png"), optimize=True)

# --- montage 3x3 with labels
cw, ch = 760, 428
cols, rows = 3, 3
pad = 10
sheet = Image.new("RGB", (cols*cw + (cols+1)*pad, rows*ch + (rows+1)*pad), (7, 9, 13))
for i, n in enumerate(ORDER):
    im = Image.open(os.path.join(CL, "_clean-" + n + ".png")).convert("RGB").resize((cw, ch), Image.LANCZOS)
    x = pad + (i % cols) * (cw + pad); y = pad + (i // cols) * (ch + pad)
    sheet.paste(im, (x, y))
    dd = ImageDraw.Draw(sheet)
    dd.rectangle([x, y, x+cw-1, y+ch-1], outline=(58, 50, 34))
    tag = "%02d  %s" % (i+1, LABEL[i])
    f = font(19, False, True)
    dd.rectangle([x, y+ch-30, x+cw, y+ch], fill=(6, 8, 12))
    spaced(dd, (x+14, y+ch-26), tag, f, (226, 197, 138), 2)
sheet.save(os.path.join(OUT, "montage.png"), optimize=True)

# --- demo.gif: 7 acts x 12 frames, 960x540 -> 640x360
gf = []
for i in range(7):
    for k in range(12):
        p = os.path.join(CL, "g%d-%d.png" % (i, k))
        if os.path.exists(p): gf.append(p)
frames = [Image.open(p).convert("RGB").resize((640, 360), Image.LANCZOS) for p in gf]
pal = [f.quantize(colors=128, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG) for f in frames]
pal[0].save(os.path.join(OUT, "demo.gif"), save_all=True, append_images=pal[1:], duration=95, loop=0, optimize=True)
gif_kb = os.path.getsize(os.path.join(OUT, "demo.gif")) / 1024.0
print("poster", poster.size, "hero", hero.size, "montage", sheet.size, "gif", len(frames), "frames", round(gif_kb), "KB")
for f in sorted(os.listdir(OUT)): print("  ", f, round(os.path.getsize(os.path.join(OUT, f))/1024), "KB")
