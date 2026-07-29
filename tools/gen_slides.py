#!/usr/bin/env python3
"""gen_slides.py — composite example slides for all 53 Year 1 maths nuggets."""
import json, os
from PIL import Image, ImageDraw, ImageFont

BASE      = '/sessions/jolly-eloquent-bell/mnt/Year 1 maths'
OUT_DIR   = os.path.join(BASE, 'example-slides')
MANIFEST  = '/tmp/slide-images/manifest.json'
BG_PATH   = os.path.join(BASE, 'background_keynote.png')
FONT_BOLD = '/tmp/ProximaSoftBoldSB.ttf'
FONT_REG  = '/tmp/ProximaSoftRegSB.ttf'
FONT_SEMI = '/tmp/ProximaSoftSemiboldSB.otf'

os.makedirs(OUT_DIR, exist_ok=True)

S = 2
W, H = 1920*S, 1080*S

TEAL = (49, 147, 119)
DARK = (40, 40, 40)

SHIFT = 35   # shift all content down (more space above prompt, less below explanation)

Y_PROMPT  = (141 + SHIFT) * S
Y_DIVIDER = (476 + SHIFT) * S
Y_ANS_LBL = (536 + SHIFT) * S
Y_EXPL    = (846 + SHIFT) * S
EXPL_STEP = 56 * S

Q_CY      = (Y_PROMPT + Y_DIVIDER) // 2
ANS_CY    = (Y_ANS_LBL + Y_EXPL) // 2

Q_MAX_H   = Y_DIVIDER - Y_PROMPT - 20*S
ANS_MAX_H = Y_EXPL - Y_ANS_LBL - 20*S

IMG_MAX_W   = int(W * 0.82)
IMAGE_SCALE    = 0.65   # scale for NT images
IMAGE_SCALE_NL = 0.90   # number lines are short — use a larger scale
IMAGE_SCALE_NR = 0.80   # numerical representations (multilink, beads, numicon)
IMAGE_SCALE_PR = 0.90   # pictorial representations — larger to make count badges legible
IMAGE_SCALE_PV = 0.85   # place value blocks
# Per-nugget scale overrides (nuggetId → scale)
NUGGET_SCALE_OVERRIDE = {96: 0.95}
DIV_W = int(W * 0.60)
DIV_H = 4 * S

FS_PROMPT = 100   # effective 50px at 1080p
FS_LABEL  = 76
FS_EXPL   = 76

bg_raw  = Image.open(BG_PATH).convert('RGBA')
bg_full = bg_raw.resize((W, H), Image.LANCZOS)
BG = Image.new('RGB', (W, H), (255, 255, 255))
BG.paste(bg_full, mask=bg_full.split()[3])

font_prompt = ImageFont.truetype(FONT_BOLD, FS_PROMPT)
font_label  = ImageFont.truetype(FONT_BOLD, FS_LABEL)
font_expl   = ImageFont.truetype(FONT_SEMI, FS_EXPL)

def auto_crop(img, pad=20):
    """Crop transparent margins, add small padding."""
    rgba = img.convert('RGBA')
    bb = rgba.getbbox()           # bounding box of non-transparent pixels
    if not bb:
        return img
    l, t, r, b = bb
    iw, ih = rgba.size
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(iw, r + pad)
    b = min(ih, b + pad)
    return img.crop((l, t, r, b))

def fit_image(img, max_w, max_h, explicit_scale=1.0):
    ow, oh = img.size
    scale = min(max_w / ow, max_h / oh, 1.0) * explicit_scale
    return img.resize((max(1, int(ow*scale)), max(1, int(oh*scale))), Image.LANCZOS)

def paste_c(canvas, img, cx, cy):
    x = cx - img.width  // 2
    y = cy - img.height // 2
    if img.mode == 'RGBA':
        canvas.paste(img, (x, y), img.split()[3])
    else:
        canvas.paste(img, (x, y))

def draw_text_c(draw, text, yc, font, fill=DARK):
    bb = draw.textbbox((0,0), text, font=font)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    x = (W - tw) // 2
    y = yc - th // 2
    draw.text((x, y), text, font=font, fill=fill)

def load_img(path):
    img = Image.open(path).convert('RGBA')
    return auto_crop(img)

def compose(item):
    canvas = BG.copy()
    draw   = ImageDraw.Draw(canvas)

    vt = item.get('visualType')
    nid = item.get('nuggetId')
    img_scale = NUGGET_SCALE_OVERRIDE.get(nid,
                IMAGE_SCALE_NL if vt == 'nl' else
                IMAGE_SCALE_NR if vt == 'nr' else
                IMAGE_SCALE_PR if vt == 'pr' else
                IMAGE_SCALE_PV if vt == 'pv' else
                IMAGE_SCALE)

    # Prompt text always sits at the top of the slide
    draw_text_c(draw, item['promptText'], Y_PROMPT, font_prompt)

    if vt == 'pr':
        # Normalise Q and A to the same displayed scale (both constrained by ANS_MAX_H)
        # so 10-frame Q and A appear the same size
        q_nat = load_img(item['qPath'])
        a_nat = load_img(item['aPath'])
        s_q = min(IMG_MAX_W / q_nat.width, ANS_MAX_H / q_nat.height, 1.0) * img_scale
        s_a = min(IMG_MAX_W / a_nat.width, ANS_MAX_H / a_nat.height, 1.0) * img_scale
        norm = min(s_q, s_a)
        qi = q_nat.resize((max(1, int(q_nat.width*norm)), max(1, int(q_nat.height*norm))), Image.LANCZOS)
        ai = a_nat.resize((max(1, int(a_nat.width*norm)), max(1, int(a_nat.height*norm))), Image.LANCZOS)
    else:
        qi = fit_image(load_img(item['qPath']), IMG_MAX_W, Q_MAX_H, img_scale)
        ai = fit_image(load_img(item['aPath']), IMG_MAX_W, ANS_MAX_H, img_scale)
    paste_c(canvas, qi, W//2, Q_CY)

    x0 = (W - DIV_W) // 2
    draw.line([(x0, Y_DIVIDER), (x0+DIV_W, Y_DIVIDER)], fill=TEAL, width=DIV_H)

    draw_text_c(draw, f'Answer:  {item["answer"]}', Y_ANS_LBL, font_label, fill=TEAL)

    # Nuggets 83, 85, 91, 92, 93, 94, 95, 97: explanation shifts down one line
    expl_shift = EXPL_STEP if nid in {83, 85, 91, 92, 93, 94, 95, 97} else 0
    # Same set: answer image re-centred midway in the expanded answer zone
    ans_cy = (Y_ANS_LBL + Y_EXPL + expl_shift) // 2 if nid in {83, 85, 91, 92, 93, 94, 95, 97} else ANS_CY
    paste_c(canvas, ai, W//2, ans_cy)

    for i, line in enumerate(item['explanation']):
        draw_text_c(draw, line, Y_EXPL + expl_shift + i*EXPL_STEP, font_expl)

    return canvas.resize((1920, 1080), Image.LANCZOS)

manifest = sorted(json.load(open(MANIFEST)), key=lambda x: x['nuggetId'])
print(f"Compositing {len(manifest)} slides...")
for item in manifest:
    nid = item['nuggetId']
    out = os.path.join(OUT_DIR, f'nugget-{nid:03d}.jpg')
    try:
        slide = compose(item)
        slide.save(out, 'JPEG', quality=98, subsampling=0)
        print(f"  [{nid:3d}] ✓  {item['visualType']}  ans={item['answer']}")
    except Exception as e:
        print(f"  [{nid:3d}] ERROR: {e}")
        import traceback; traceback.print_exc()
print("Done.")
