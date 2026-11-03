import os
import subprocess

APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(APP_DIR, "public")
ANDROID_RES = os.path.join(APP_DIR, "android", "res")
STUDIO_RES = os.path.join(APP_DIR, "android-studio-project", "app", "src", "main", "res")
PLAY_META = os.path.join(APP_DIR, "android-studio-project", "google_play_metadata")

print("=== Generating High-Resolution DOUR App Icons Across All Densities ===")

# 1. Master Square Full-Bleed 512x512 (Official Google Play & Maskable PWA)
master_square = os.path.join(PUBLIC_DIR, "master_icon_512.png")
cmd_master = [
    'convert', '-size', '512x512', 'xc:#170b2c',
    # Outer dark circle
    '-fill', '#241442', '-draw', 'circle 256,256 256,40',
    # Cyan outer ring
    '-fill', 'none', '-stroke', '#00f0ff', '-strokewidth', '14', '-draw', 'circle 256,256 256,58',
    # Magenta inner ring
    '-stroke', '#ff007f', '-strokewidth', '10', '-draw', 'circle 256,256 256,104',
    # Inner dark disc
    '-fill', '#170b2c', '-stroke', 'none', '-draw', 'circle 256,256 256,128',
    # 4 team player dots
    '-fill', '#00f0ff', '-draw', 'circle 154,180 154,166',
    '-fill', '#ff4b4b', '-draw', 'circle 358,180 358,166',
    '-fill', '#00e676', '-draw', 'circle 154,332 154,318',
    '-fill', '#ffb300', '-draw', 'circle 358,332 358,318',
    # Golden Hourglass
    '-fill', '#ffe600', '-stroke', '#d4af37', '-strokewidth', '6',
    '-draw', 'polygon 180,154 332,154 278,256 332,336 180,336 234,256',
    # Hourglass inner facets
    '-fill', '#ffea38', '-stroke', 'none',
    '-draw', 'polygon 196,166 316,166 256,246',
    '-fill', '#f5be00',
    '-draw', 'polygon 196,324 316,324 256,266',
    # Center lightning bolt
    '-fill', '#ff007f', '-stroke', '#ffffff', '-strokewidth', '4',
    '-draw', 'polygon 262,204 232,260 260,260 246,306 286,248 258,248',
    master_square
]
subprocess.check_call(cmd_master)
print(f"Generated square master: {master_square}")

# 2. Master Squircle 512x512 (Standard Android Launcher icon)
master_squircle = os.path.join(PUBLIC_DIR, "master_squircle_512.png")
cmd_squircle = [
    'convert', master_square,
    '(', '-size', '512x512', 'xc:black', '-fill', 'white', '-draw', 'roundrectangle 0,0 512,512 110,110', ')',
    '-alpha', 'off', '-compose', 'CopyOpacity', '-composite',
    master_squircle
]
subprocess.check_call(cmd_squircle)

# 3. Master Circle 512x512 (Round Android Launcher icon)
master_round = os.path.join(PUBLIC_DIR, "master_round_512.png")
cmd_round = [
    'convert', master_square,
    '(', '-size', '512x512', 'xc:black', '-fill', 'white', '-draw', 'circle 256,256 256,0', ')',
    '-alpha', 'off', '-compose', 'CopyOpacity', '-composite',
    master_round
]
subprocess.check_call(cmd_round)

# Densities configuration
densities = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}

# 4. Generate all mipmaps for Android and Android Studio project
for density, size in densities.items():
    for base_res in [ANDROID_RES, STUDIO_RES]:
        target_dir = os.path.join(base_res, f"mipmap-{density}")
        os.makedirs(target_dir, exist_ok=True)
        
        # ic_launcher.png (squircle)
        launcher_png = os.path.join(target_dir, "ic_launcher.png")
        subprocess.check_call(['convert', master_squircle, '-resize', f"{size}x{size}", launcher_png])
        
        # ic_launcher_round.png (round)
        round_png = os.path.join(target_dir, "ic_launcher_round.png")
        subprocess.check_call(['convert', master_round, '-resize', f"{size}x{size}", round_png])
        
    print(f"Generated {density} ({size}x{size}) icons.")

# 5. Generate Web & PWA assets in public/
pwa_assets = {
    "icon-512.png": (master_square, 512),
    "pwa-512x512.png": (master_square, 512),
    "pwa-maskable-512x512.png": (master_square, 512),
    "icon-192.png": (master_square, 192),
    "pwa-192x192.png": (master_square, 192),
    "apple-touch-icon.png": (master_squircle, 180),
    "dour_icon_512.png": (master_squircle, 512),
}

for name, (src, sz) in pwa_assets.items():
    dest = os.path.join(PUBLIC_DIR, name)
    subprocess.check_call(['convert', src, '-resize', f"{sz}x{sz}", dest])
    print(f"Generated public/{name} ({sz}x{sz}, {os.path.getsize(dest)} bytes)")

# 6. Google Play Store Metadata Icon
os.makedirs(PLAY_META, exist_ok=True)
store_icon = os.path.join(PLAY_META, "app_icon_512x512.png")
subprocess.check_call(['convert', master_square, store_icon])
print(f"Generated {store_icon} ({os.path.getsize(store_icon)} bytes)")

print("=== All Icons Generated Successfully! ===")
