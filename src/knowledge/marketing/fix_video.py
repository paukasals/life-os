#!/usr/bin/env python3
"""
Fix the maine & connecticut video:
1. Remove AI sparkle watermark (bottom right)
2. Convert landscape 1280x720 to portrait 720x1280 (9:16) with blurred background
3. Apply warm color grade (more appetizing)
4. Output as 1080x1920 for TikTok
"""

import imageio
import imageio.plugins.ffmpeg as ffmpeg_plugin
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
import os

INPUT  = '/Users/paucasals/Documents/LOBSTERIA/Studio Pictures/maine & connecticut video.mp4'
OUTPUT = '/Users/paucasals/Desktop/connecticut_maine_tiktok.mp4'

# Output size: 1080x1920 (9:16 portrait)
OUT_W, OUT_H = 1080, 1920

def remove_sparkle(img_array):
    """Paint over the AI sparkle watermark in the bottom right."""
    img = img_array.copy()
    h, w = img.shape[:2]
    # Sparkle is roughly at x: 1170-1245, y: 610-665 (in 1280x720)
    # Sample background color from nearby area
    bg_sample = img[600:610, 1150:1180].mean(axis=(0,1)).astype(np.uint8)
    # Paint over sparkle region with background color + slight noise
    y1, y2 = 605, 670
    x1, x2 = 1160, 1255
    patch_h = y2 - y1
    patch_w = x2 - x1
    noise = np.random.randint(-8, 8, (patch_h, patch_w, 3))
    patch = np.clip(bg_sample.astype(int) + noise, 0, 255).astype(np.uint8)
    img[y1:y2, x1:x2] = patch
    return img

def color_grade(pil_img):
    """Warm up the image — more appetizing, less cold/sterile."""
    # Boost warmth (red/yellow) and saturation slightly
    img = pil_img.convert('RGB')
    # Brightness up slightly
    img = ImageEnhance.Brightness(img).enhance(1.08)
    # Contrast up
    img = ImageEnhance.Contrast(img).enhance(1.12)
    # Saturation up — makes food pops more
    img = ImageEnhance.Color(img).enhance(1.25)
    # Warm tint: boost red channel slightly, reduce blue slightly
    r, g, b = img.split()
    r = r.point(lambda x: min(255, int(x * 1.06)))
    b = b.point(lambda x: int(x * 0.93))
    img = Image.merge('RGB', (r, g, b))
    return img

def make_portrait_frame(pil_img):
    """
    Convert 1280x720 landscape frame to 1080x1920 portrait.
    - Background: blurred, zoomed version of the frame
    - Foreground: original frame centered
    """
    src_w, src_h = pil_img.size  # 1280x720

    # --- Background: scale to fill 1080x1920 ---
    # Scale factor to fill height: 1920/720 = 2.667
    bg_scale = OUT_H / src_h
    bg_w = int(src_w * bg_scale)  # ~3413
    bg = pil_img.resize((bg_w, OUT_H), Image.LANCZOS)
    # Center crop to 1080 wide
    bg_x = (bg_w - OUT_W) // 2
    bg = bg.crop((bg_x, 0, bg_x + OUT_W, OUT_H))
    # Heavy blur
    bg = bg.filter(ImageFilter.GaussianBlur(radius=20))
    # Darken bg so food stands out
    bg = ImageEnhance.Brightness(bg).enhance(0.55)

    # --- Foreground: scale original to fit 1080 wide ---
    fg_scale = OUT_W / src_w  # 1080/1280 = 0.844
    fg_h = int(src_h * fg_scale)  # ~608
    fg = pil_img.resize((OUT_W, fg_h), Image.LANCZOS)

    # Paste foreground centered vertically
    fg_y = (OUT_H - fg_h) // 2
    bg.paste(fg, (0, fg_y))

    return bg

def process():
    ffmpeg_exe = ffmpeg_plugin.get_exe()
    print(f"Using ffmpeg: {ffmpeg_exe}")
    print(f"Reading: {INPUT}")

    reader = imageio.get_reader(INPUT)
    meta = reader.get_meta_data()
    fps = meta.get('fps', 24)
    n_frames = reader.count_frames()
    print(f"Frames: {n_frames}, FPS: {fps}")

    writer = imageio.get_writer(
        OUTPUT,
        fps=fps,
        quality=9,
        ffmpeg_log_level='error',
        codec='libx264',
        pixelformat='yuv420p',
        ffmpeg_params=['-crf', '18', '-preset', 'slow']
    )

    print("Processing frames...")
    for i, frame in enumerate(reader):
        if i % 24 == 0:
            print(f"  Frame {i}/{n_frames}")

        # 1. Remove sparkle
        clean = remove_sparkle(frame)

        # 2. Convert to PIL
        pil = Image.fromarray(clean)

        # 3. Color grade
        pil = color_grade(pil)

        # 4. Convert to portrait 9:16
        portrait = make_portrait_frame(pil)

        # 5. Write
        writer.append_data(np.array(portrait))

    reader.close()
    writer.close()
    print(f"\n✅ Done! Saved to: {OUTPUT}")
    size_mb = os.path.getsize(OUTPUT) / 1024 / 1024
    print(f"   File size: {size_mb:.1f} MB")

if __name__ == "__main__":
    process()
