#!/usr/bin/env python3
"""
Version 2 — adds text overlays + logo to the processed video.
Timeline:
  0-3s:  "Maine" + "Cold · Mayo · Old Bay"
  3-7s:  "Connecticut" + "Warm · Brown Butter"
  7-10s: "Which one? 🦞" + @lobsteriaco
  All:   Logo bottom left
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

# Fonts
FONT_BOLD  = '/System/Library/Fonts/HelveticaNeue.ttc'
FONT_REG   = '/System/Library/Fonts/HelveticaNeue.ttc'

def remove_sparkle(img_array):
    img = img_array.copy()
    bg_sample = img[600:610, 1150:1180].mean(axis=(0,1)).astype(np.uint8)
    y1, y2, x1, x2 = 605, 670, 1160, 1255
    noise = np.random.randint(-8, 8, (y2-y1, x2-x1, 3))
    patch = np.clip(bg_sample.astype(int) + noise, 0, 255).astype(np.uint8)
    img[y1:y2, x1:x2] = patch
    return img

def color_grade(pil_img):
    img = pil_img.convert('RGB')
    img = ImageEnhance.Brightness(img).enhance(1.08)
    img = ImageEnhance.Contrast(img).enhance(1.12)
    img = ImageEnhance.Color(img).enhance(1.25)
    r, g, b = img.split()
    r = r.point(lambda x: min(255, int(x * 1.06)))
    b = b.point(lambda x: int(x * 0.93))
    return Image.merge('RGB', (r, g, b))

def make_portrait_frame(pil_img):
    src_w, src_h = pil_img.size
    bg_scale = OUT_H / src_h
    bg_w = int(src_w * bg_scale)
    bg = pil_img.resize((bg_w, OUT_H), Image.LANCZOS)
    bg_x = (bg_w - OUT_W) // 2
    bg = bg.crop((bg_x, 0, bg_x + OUT_W, OUT_H))
    bg = bg.filter(ImageFilter.GaussianBlur(radius=20))
    bg = ImageEnhance.Brightness(bg).enhance(0.55)
    fg_scale = OUT_W / src_w
    fg_h = int(src_h * fg_scale)
    fg = pil_img.resize((OUT_W, fg_h), Image.LANCZOS)
    fg_y = (OUT_H - fg_h) // 2
    bg.paste(fg, (0, fg_y))
    return bg

def draw_text_with_shadow(draw, pos, text, font, fill, shadow_offset=3):
    x, y = pos
    # Shadow
    draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=(0, 0, 0, 180))
    # Main text
    draw.text((x, y), text, font=font, fill=fill)

def add_overlays(pil_img, frame_idx, fps, logo_img):
    img = pil_img.copy().convert('RGBA')
    draw = ImageDraw.Draw(img)
    t = frame_idx / fps

    try:
        font_huge  = ImageFont.truetype(FONT_BOLD, 110, index=1)
        font_large = ImageFont.truetype(FONT_BOLD, 72, index=1)
        font_med   = ImageFont.truetype(FONT_REG,  52, index=0)
        font_small = ImageFont.truetype(FONT_REG,  44, index=0)
    except:
        font_huge  = ImageFont.load_default()
        font_large = font_huge
        font_med   = font_huge
        font_small = font_huge

    WHITE  = (255, 255, 255, 255)
    ORANGE = (255, 140, 40, 255)
    CREAM  = (255, 248, 230, 255)

    # --- Fade in helper ---
    def fade(start, end, t):
        if t < start: return 0.0
        if t > end:   return 1.0
        return (t - start) / (end - start)

    # --- Phase 1: 0–3s — Maine ---
    if t <= 3.2:
        alpha = int(255 * min(fade(0, 0.4, t), fade(3.0, 3.2, t) if t > 3.0 else 1.0))
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(overlay)

        # Big label top
        label = "Maine"
        bbox = d.textbbox((0, 0), label, font=font_huge)
        tw = bbox[2] - bbox[0]
        x = (OUT_W - tw) // 2
        d.text((x+4, 184), label, font=font_huge, fill=(0,0,0,alpha))
        d.text((x, 180), label, font=font_huge, fill=(*WHITE[:3], alpha))

        # Subtitle
        sub = "Cold · Mayo · Old Bay"
        bbox2 = d.textbbox((0, 0), sub, font=font_med)
        tw2 = bbox2[2] - bbox2[0]
        x2 = (OUT_W - tw2) // 2
        d.text((x2+3, 303), sub, font=font_med, fill=(0,0,0,alpha))
        d.text((x2, 300), sub, font=font_med, fill=(*CREAM[:3], alpha))

        img = Image.alpha_composite(img, overlay)

    # --- Phase 2: 3–7s — Connecticut ---
    elif t <= 7.2:
        alpha = int(255 * min(fade(3.0, 3.5, t), fade(6.8, 7.2, t) if t > 6.8 else 1.0))
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(overlay)

        label = "Connecticut"
        bbox = d.textbbox((0, 0), label, font=font_large)
        tw = bbox[2] - bbox[0]
        x = (OUT_W - tw) // 2
        d.text((x+4, 184), label, font=font_large, fill=(0,0,0,alpha))
        d.text((x, 180), label, font=font_large, fill=(*WHITE[:3], alpha))

        sub = "Warm · Brown Butter"
        bbox2 = d.textbbox((0, 0), sub, font=font_med)
        tw2 = bbox2[2] - bbox2[0]
        x2 = (OUT_W - tw2) // 2
        d.text((x2+3, 273), sub, font=font_med, fill=(0,0,0,alpha))
        d.text((x2, 270), sub, font=font_med, fill=(*CREAM[:3], alpha))

        img = Image.alpha_composite(img, overlay)

    # --- Phase 3: 7–10s — CTA ---
    else:
        alpha = int(255 * fade(7.0, 7.6, t))
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(overlay)

        label = "Which one? 🦞"
        bbox = d.textbbox((0, 0), label, font=font_large)
        tw = bbox[2] - bbox[0]
        x = (OUT_W - tw) // 2
        d.text((x+4, 184), label, font=font_large, fill=(0,0,0,alpha))
        d.text((x, 180), label, font=font_large, fill=(*ORANGE[:3], alpha))

        handle = "@lobsteriaco"
        bbox3 = d.textbbox((0, 0), handle, font=font_small)
        tw3 = bbox3[2] - bbox3[0]
        x3 = (OUT_W - tw3) // 2
        d.text((x3+2, 314), handle, font=font_small, fill=(0,0,0,alpha))
        d.text((x3, 311), handle, font=font_small, fill=(*CREAM[:3], alpha))

        img = Image.alpha_composite(img, overlay)

    # --- Logo bottom left (always) ---
    if logo_img:
        logo_size = 130
        logo = logo_img.resize((logo_size, logo_size), Image.LANCZOS)
        # Position: bottom left with padding
        lx = 36
        ly = OUT_H - logo_size - 120
        if logo.mode == 'RGBA':
            img.paste(logo, (lx, ly), logo)
        else:
            img.paste(logo, (lx, ly))

    return img.convert('RGB')

def process():
    print("Loading logo...")
    try:
        logo_img = Image.open(LOGO).convert('RGBA')
        # Make logo background transparent if it's white
        logo_img = logo_img.resize((200, 200), Image.LANCZOS)
    except:
        logo_img = None
        print("Logo not found, skipping")

    print(f"Reading video...")
    reader = imageio.get_reader(INPUT)
    meta = reader.get_meta_data()
    fps = meta.get('fps', 24)
    n_frames = reader.count_frames()
    print(f"Frames: {n_frames}, FPS: {fps}, Duration: {n_frames/fps:.1f}s")

    writer = imageio.get_writer(
        OUTPUT,
        fps=fps,
        quality=9,
        ffmpeg_log_level='error',
        codec='libx264',
        pixelformat='yuv420p',
        ffmpeg_params=['-crf', '16', '-preset', 'slow']
    )

    print("Processing frames...")
    for i, frame in enumerate(reader):
        if i % 48 == 0:
            print(f"  {i}/{n_frames} ({i/fps:.1f}s)")

        clean   = remove_sparkle(frame)
        pil     = color_grade(Image.fromarray(clean))
        portrait = make_portrait_frame(pil)
        final   = add_overlays(portrait, i, fps, logo_img)
        writer.append_data(np.array(final))

    reader.close()
    writer.close()

    size_mb = os.path.getsize(OUTPUT) / 1024 / 1024
    print(f"\n✅ Done! {OUTPUT}")
    print(f"   Size: {size_mb:.1f} MB")

if __name__ == "__main__":
    process()
