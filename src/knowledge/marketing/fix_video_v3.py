#!/usr/bin/env python3
"""
Version 3:
- Logo background removed (transparent), placed bottom right, larger
- Typography redesigned: cream text, navy semi-transparent pill backgrounds
- Brand colors: navy #1B3A5C, cream #FFF5E4, orange #E8622A
"""

import imageio
import imageio.plugins.ffmpeg as ffmpeg_plugin
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import os

INPUT  = '/Users/paucasals/Documents/LOBSTERIA/Studio Pictures/maine & connecticut video.mp4'
OUTPUT = '/Users/paucasals/Desktop/lobsteria_rolls_final.mp4'
LOGO   = '/Users/paucasals/Documents/LOBSTERIA/LOGO/Logo LOBSTERIA HD.png'

OUT_W, OUT_H = 1080, 1920

NAVY   = (27, 58, 92)
CREAM  = (255, 245, 228)
ORANGE = (232, 98, 42)

FONT_BOLD  = '/System/Library/Fonts/HelveticaNeue.ttc'
FONT_EMOJI = '/System/Library/Fonts/Apple Color Emoji.ttc'

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
    """Remove cream background from logo and return RGBA image."""
    img = Image.open(logo_path).convert('RGBA')
    arr = np.array(img, dtype=float)
    # Background color ~(254, 239, 220)
    bg = np.array([254, 239, 220], dtype=float)
    # Distance from background color in RGB space
    diff = np.sqrt(((arr[:,:,:3] - bg)**2).sum(axis=2))
    # Make pixels close to background transparent
    threshold = 30
    alpha = arr[:,:,3].copy()
    alpha[diff < threshold] = 0
    # Smooth edges
    arr[:,:,3] = alpha
    result = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    result = result.resize((size, size), Image.LANCZOS)
    return result

def draw_pill(draw, x, y, w, h, color, radius=20):
    """Draw a rounded rectangle (pill) background."""
    draw.rounded_rectangle([x, y, x+w, y+h], radius=radius, fill=color)

def add_overlays(pil_img, frame_idx, fps, logo_img):
    img = pil_img.copy().convert('RGBA')
    t   = frame_idx / fps

    try:
        f_title    = ImageFont.truetype(FONT_BOLD,  108, index=1)
        f_subtitle = ImageFont.truetype(FONT_BOLD,  52,  index=0)
        f_handle   = ImageFont.truetype(FONT_BOLD,  46,  index=0)
    except:
        f_title = f_subtitle = f_handle = ImageFont.load_default()
    try:
        f_emoji = ImageFont.truetype(FONT_EMOJI, 96, index=0)
    except:
        f_emoji = f_title

    def ease(start, end, tt, dur=0.35):
        if tt < start: return 0.0
        if tt > end:   return 1.0
        return min(1.0, (tt-start)/dur)

    # ── Phase 1: 0–3s — Maine ────────────────────────────────────────
    if t <= 3.2:
        a = int(255 * min(ease(0, 0.0, t), 1.0 - ease(2.85, 3.2, t)))
        if a > 0:
            overlay = Image.new('RGBA', img.size, (0,0,0,0))
            d = ImageDraw.Draw(overlay)

            title = "Maine"
            tb = d.textbbox((0,0), title, font=f_title)
            tw = tb[2]-tb[0]; th = tb[3]-tb[1]
            pad_x, pad_y = 48, 18
            rx = (OUT_W - tw) // 2 - pad_x
            ry = 148
            # Navy pill
            pill_color = (*NAVY, int(a * 0.85))
            d.rounded_rectangle([rx, ry, rx+tw+pad_x*2, ry+th+pad_y*2], radius=24, fill=pill_color)
            d.text((rx+pad_x, ry+pad_y), title, font=f_title, fill=(*CREAM, a))

            sub = "Cold · Mayo · Old Bay"
            sb = d.textbbox((0,0), sub, font=f_subtitle)
            sw = sb[2]-sb[0]; sh = sb[3]-sb[1]
            sx = (OUT_W - sw) // 2 - 24
            sy = ry + th + pad_y*2 + 14
            sub_pill = (*NAVY, int(a * 0.65))
            d.rounded_rectangle([sx, sy, sx+sw+48, sy+sh+20], radius=16, fill=sub_pill)
            d.text((sx+24, sy+10), sub, font=f_subtitle, fill=(*CREAM, a))

            img = Image.alpha_composite(img, overlay)

    # ── Phase 2: 3–7s — Connecticut ──────────────────────────────────
    elif t <= 7.2:
        a = int(255 * min(ease(3.0, 3.4, t), 1.0 - ease(6.85, 7.2, t)))
        if a > 0:
            overlay = Image.new('RGBA', img.size, (0,0,0,0))
            d = ImageDraw.Draw(overlay)

            title = "Connecticut"
            tb = d.textbbox((0,0), title, font=f_title)
            tw = tb[2]-tb[0]; th = tb[3]-tb[1]
            pad_x, pad_y = 48, 18
            rx = (OUT_W - tw) // 2 - pad_x
            ry = 148
            pill_color = (*NAVY, int(a * 0.85))
            d.rounded_rectangle([rx, ry, rx+tw+pad_x*2, ry+th+pad_y*2], radius=24, fill=pill_color)
            d.text((rx+pad_x, ry+pad_y), title, font=f_title, fill=(*CREAM, a))

            sub = "Warm · Brown Butter"
            sb = d.textbbox((0,0), sub, font=f_subtitle)
            sw = sb[2]-sb[0]; sh = sb[3]-sb[1]
            sx = (OUT_W - sw) // 2 - 24
            sy = ry + th + pad_y*2 + 14
            sub_pill = (*NAVY, int(a * 0.65))
            d.rounded_rectangle([sx, sy, sx+sw+48, sy+sh+20], radius=16, fill=sub_pill)
            d.text((sx+24, sy+10), sub, font=f_subtitle, fill=(*CREAM, a))

            img = Image.alpha_composite(img, overlay)

    # ── Phase 3: 7–10s — CTA ─────────────────────────────────────────
    else:
        a = int(255 * ease(7.0, 7.5, t))
        if a > 0:
            overlay = Image.new('RGBA', img.size, (0,0,0,0))
            d = ImageDraw.Draw(overlay)

            text_main  = "Which one? "
            emoji_char = "🦞"
            tb_m = d.textbbox((0,0), text_main,  font=f_title)
            tb_e = d.textbbox((0,0), emoji_char, font=f_emoji)
            tw_m = tb_m[2]-tb_m[0]; th = tb_m[3]-tb_m[1]
            tw_e = tb_e[2]-tb_e[0]; th_e = tb_e[3]-tb_e[1]
            tw   = tw_m + tw_e
            pad_x, pad_y = 48, 18
            rx = (OUT_W - tw) // 2 - pad_x
            ry = 148
            pill_color = (*ORANGE, int(a * 0.90))
            d.rounded_rectangle([rx, ry, rx+tw+pad_x*2, ry+th+pad_y*2], radius=24, fill=pill_color)
            d.text((rx+pad_x, ry+pad_y), text_main, font=f_title, fill=(*CREAM, a))
            # Emoji offset: vertically center relative to title baseline
            ey = ry + pad_y + (th - th_e) // 2
            d.text((rx+pad_x+tw_m, ey), emoji_char, font=f_emoji, embedded_color=True)

            handle = "@lobsteriaco"
            hb = d.textbbox((0,0), handle, font=f_handle)
            hw = hb[2]-hb[0]; hh = hb[3]-hb[1]
            hx = (OUT_W - hw) // 2 - 20
            hy = ry + th + pad_y*2 + 14
            h_pill = (*NAVY, int(a * 0.70))
            d.rounded_rectangle([hx, hy, hx+hw+40, hy+hh+18], radius=14, fill=h_pill)
            d.text((hx+20, hy+9), handle, font=f_handle, fill=(*CREAM, a))

            img = Image.alpha_composite(img, overlay)

    # ── Logo: bottom right, always ────────────────────────────────────
    if logo_img:
        lx = OUT_W - logo_img.width - 36
        ly = OUT_H - logo_img.height - 110
        img.paste(logo_img, (lx, ly), logo_img)

    return img.convert('RGB')

def process():
    print("Preparing logo...")
    logo_img = make_logo_transparent(LOGO, size=170)

    print("Reading video...")
    reader  = imageio.get_reader(INPUT)
    meta    = reader.get_meta_data()
    fps     = meta.get('fps', 24)
    n       = reader.count_frames()
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
        clean   = remove_sparkle(frame)
        pil     = color_grade(Image.fromarray(clean))
        portrait = make_portrait_frame(pil)
        final   = add_overlays(portrait, i, fps, logo_img)
        writer.append_data(np.array(final))

    reader.close()
    writer.close()
    mb = os.path.getsize(OUTPUT)/1024/1024
    print(f"\n✅ {OUTPUT} ({mb:.1f} MB)")

if __name__ == "__main__":
    process()
