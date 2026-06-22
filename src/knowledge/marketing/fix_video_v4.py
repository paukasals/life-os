#!/usr/bin/env python3
"""
Version 4:
- No pill backgrounds — raw text on video, direct energy
- Impact font, cream text + navy stroke outline
- Orange accents for subtitles
- Much bigger, bolder type
- Lobsteria brand colors throughout
"""

import imageio
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import os

INPUT  = '/Users/paucasals/Documents/LOBSTERIA/Studio Pictures/maine & connecticut video.mp4'
OUTPUT = '/Users/paucasals/Desktop/lobsteria_rolls_final_v4.mp4'
LOGO   = '/Users/paucasals/Documents/LOBSTERIA/LOGO/Logo LOBSTERIA HD.png'

OUT_W, OUT_H = 1080, 1920

NAVY   = (27,  58,  92)
CREAM  = (255, 245, 228)
ORANGE = (232, 98,  42)

FONT_IMPACT = '/System/Library/Fonts/Supplemental/Impact.ttf'
FONT_BOLD   = '/System/Library/Fonts/HelveticaNeue.ttc'
FONT_EMOJI  = '/System/Library/Fonts/Apple Color Emoji.ttc'

# ─────────────────────────────────────────────────────────────────────────────

def remove_sparkle(img_array):
    img = img_array.copy()
    bg  = img[600:610, 1150:1180].mean(axis=(0,1)).astype(np.uint8)
    y1,y2,x1,x2 = 605,670,1160,1255
    noise = np.random.randint(-8, 8, (y2-y1, x2-x1, 3))
    img[y1:y2, x1:x2] = np.clip(bg.astype(int)+noise, 0, 255).astype(np.uint8)
    return img

def color_grade(pil_img):
    img = pil_img.convert('RGB')
    img = ImageEnhance.Brightness(img).enhance(1.08)
    img = ImageEnhance.Contrast(img).enhance(1.12)
    img = ImageEnhance.Color(img).enhance(1.25)
    r,g,b = img.split()
    r = r.point(lambda x: min(255, int(x*1.06)))
    b = b.point(lambda x: int(x*0.93))
    return Image.merge('RGB',(r,g,b))

def make_portrait_frame(pil_img):
    src_w, src_h = pil_img.size
    bg_scale = OUT_H / src_h
    bg_w = int(src_w * bg_scale)
    bg = pil_img.resize((bg_w, OUT_H), Image.LANCZOS)
    bg_x = (bg_w - OUT_W) // 2
    bg = bg.crop((bg_x, 0, bg_x+OUT_W, OUT_H))
    bg = bg.filter(ImageFilter.GaussianBlur(radius=20))
    bg = ImageEnhance.Brightness(bg).enhance(0.5)
    fg_h = int(src_h * OUT_W/src_w)
    fg = pil_img.resize((OUT_W, fg_h), Image.LANCZOS)
    bg.paste(fg, (0, (OUT_H-fg_h)//2))
    return bg

def make_logo_transparent(logo_path, size=160):
    img = Image.open(logo_path).convert('RGBA')
    arr = np.array(img, dtype=float)
    bg  = np.array([254, 239, 220], dtype=float)
    diff = np.sqrt(((arr[:,:,:3] - bg)**2).sum(axis=2))
    alpha = arr[:,:,3].copy()
    alpha[diff < 30] = 0
    arr[:,:,3] = alpha
    result = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    return result.resize((size, size), Image.LANCZOS)

# ─────────────────────────────────────────────────────────────────────────────

def centered_x(d, text, font):
    """Return x that centers text horizontally."""
    tb = d.textbbox((0,0), text, font=font)
    return (OUT_W - (tb[2]-tb[0])) // 2

def draw_outlined(d, x, y, text, font, fill, stroke_color=NAVY, stroke=10):
    d.text((x, y), text, font=font, fill=fill,
           stroke_width=stroke, stroke_fill=stroke_color)

def draw_outlined_emoji(img, d, x, y, emoji, font_emoji, stroke=10):
    """Emoji needs embedded_color; stroke done manually via offsets."""
    # Draw dark offsets first for shadow/outline feel
    for dx, dy in [(-stroke,0),(stroke,0),(0,-stroke),(0,stroke),
                   (-stroke,-stroke),(stroke,-stroke),(-stroke,stroke),(stroke,stroke)]:
        d.text((x+dx, y+dy), emoji, font=font_emoji,
               fill=(*NAVY, 255), embedded_color=False)
    # Draw emoji on top
    d.text((x, y), emoji, font=font_emoji, embedded_color=True)

# ─────────────────────────────────────────────────────────────────────────────

def add_overlays(pil_img, frame_idx, fps, logo_img):
    img = pil_img.copy().convert('RGBA')
    t   = frame_idx / fps

    try:
        f_big  = ImageFont.truetype(FONT_IMPACT, 185)
        f_med  = ImageFont.truetype(FONT_IMPACT, 90)
        f_sub  = ImageFont.truetype(FONT_BOLD,   58, index=0)
        f_hand = ImageFont.truetype(FONT_BOLD,   48, index=0)
    except Exception as e:
        print(f"Font error: {e}")
        f_big = f_med = f_sub = f_hand = ImageFont.load_default()
    try:
        f_emoji = ImageFont.truetype(FONT_EMOJI, 96, index=0)
    except:
        f_emoji = f_med

    def ease(start, end, tt, dur=0.35):
        if tt < start: return 0.0
        if tt > end:   return 1.0
        return min(1.0, (tt-start)/dur)

    overlay = Image.new('RGBA', img.size, (0,0,0,0))
    d = ImageDraw.Draw(overlay)

    # ── Phase 1: 0–3s — MAINE ────────────────────────────────────────────
    if t <= 3.2:
        a = ease(0, 0.0, t) * (1.0 - ease(2.85, 3.2, t))
        if a > 0.01:
            alpha = int(255 * a)

            title = "MAINE"
            tx = centered_x(d, title, f_big)
            ty = 110
            draw_outlined(d, tx, ty, title, f_big,
                          fill=(*CREAM, alpha),
                          stroke_color=(*NAVY, alpha), stroke=10)

            sub = "Cold · Mayo · Old Bay"
            sx = centered_x(d, sub, f_sub)
            tb = d.textbbox((0,0), title, font=f_big)
            sy = ty + (tb[3]-tb[1]) + 18
            draw_outlined(d, sx, sy, sub, f_sub,
                          fill=(*ORANGE, alpha),
                          stroke_color=(*NAVY, alpha), stroke=6)

    # ── Phase 2: 3–7s — CONNECTICUT ──────────────────────────────────────
    elif t <= 7.2:
        a = ease(3.0, 3.4, t) * (1.0 - ease(6.85, 7.2, t))
        if a > 0.01:
            alpha = int(255 * a)

            title = "CONNECTICUT"
            f_ct = f_big
            tb = d.textbbox((0,0), title, font=f_ct)
            if (tb[2]-tb[0]) > OUT_W - 40:
                f_ct = ImageFont.truetype(FONT_IMPACT, 145)
            tx = centered_x(d, title, f_ct)
            ty = 110
            draw_outlined(d, tx, ty, title, f_ct,
                          fill=(*CREAM, alpha),
                          stroke_color=(*NAVY, alpha), stroke=10)

            sub = "Warm · Brown Butter"
            sx = centered_x(d, sub, f_sub)
            tb2 = d.textbbox((0,0), title, font=f_ct)
            sy = ty + (tb2[3]-tb2[1]) + 18
            draw_outlined(d, sx, sy, sub, f_sub,
                          fill=(*ORANGE, alpha),
                          stroke_color=(*NAVY, alpha), stroke=6)

    # ── Phase 3: 7–10s — CTA ─────────────────────────────────────────────
    else:
        a = ease(7.0, 7.5, t)
        if a > 0.01:
            alpha = int(255 * a)

            text_main  = "WHICH ONE? "
            emoji_char = "🦞"

            tb_m = d.textbbox((0,0), text_main,  font=f_med)
            tb_e = d.textbbox((0,0), emoji_char, font=f_emoji)
            tw_m = tb_m[2]-tb_m[0]; th_m = tb_m[3]-tb_m[1]
            tw_e = tb_e[2]-tb_e[0]; th_e = tb_e[3]-tb_e[1]
            tw   = tw_m + tw_e

            tx = (OUT_W - tw) // 2
            ty = 110

            draw_outlined(d, tx, ty, text_main, f_med,
                          fill=(*ORANGE, alpha),
                          stroke_color=(*NAVY, alpha), stroke=10)

            # Emoji drawn on overlay with embedded_color (same as v3 — works)
            ey = ty + (th_m - th_e) // 2
            d.text((tx + tw_m, ey), emoji_char, font=f_emoji, embedded_color=True)

            handle = "@lobsteriaco"
            hx = centered_x(d, handle, f_hand)
            hy = ty + th_m + 20
            draw_outlined(d, hx, hy, handle, f_hand,
                          fill=(*CREAM, alpha),
                          stroke_color=(*NAVY, alpha), stroke=6)

    img = Image.alpha_composite(img, overlay)

    # ── Logo: bottom right, always ────────────────────────────────────────
    if logo_img:
        lx = OUT_W - logo_img.width - 36
        ly = OUT_H - logo_img.height - 110
        img.paste(logo_img, (lx, ly), logo_img)

    return img.convert('RGB')

# ─────────────────────────────────────────────────────────────────────────────

def process():
    print("Preparing logo...")
    logo_img = make_logo_transparent(LOGO, size=170)

    print("Reading video...")
    reader = imageio.get_reader(INPUT)
    meta   = reader.get_meta_data()
    fps    = meta.get('fps', 24)
    n      = reader.count_frames()
    print(f"{n} frames @ {fps}fps")

    writer = imageio.get_writer(
        OUTPUT, fps=fps, quality=9,
        ffmpeg_log_level='error',
        codec='libx264', pixelformat='yuv420p',
        ffmpeg_params=['-crf','16','-preset','slow']
    )

    for i, frame in enumerate(reader):
        if i % 48 == 0:
            print(f"  {i}/{n} ({i/fps:.1f}s)")
        clean    = remove_sparkle(frame)
        pil      = color_grade(Image.fromarray(clean))
        portrait = make_portrait_frame(pil)
        final    = add_overlays(portrait, i, fps, logo_img)
        writer.append_data(np.array(final))

    reader.close()
    writer.close()
    mb = os.path.getsize(OUTPUT)/1024/1024
    print(f"\n✅ {OUTPUT} ({mb:.1f} MB)")

if __name__ == "__main__":
    process()
