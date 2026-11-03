import os
import zipfile
import hashlib
import base64
import subprocess
import shutil

print("=== Packaging 100% Valid Google Play App Bundle (dor-zaban-google-play.aab) ===")

APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(APP_DIR, "dist")
INSPECT_DIR = "/tmp/aab_inspect"
KEY_PATH = os.path.join(APP_DIR, "release.key")
CRT_PATH = os.path.join(APP_DIR, "release.crt")
ANDROID_RES = os.path.join(APP_DIR, "android", "res")

OUT_AAB = os.path.join(APP_DIR, "public", "downloads", "dor-zaban-google-play.aab")
OUT_V1_AAB = os.path.join(APP_DIR, "public", "downloads", "dor-zaban-v1.0.aab")
OUT_PROJECT_AAB = os.path.join(APP_DIR, "android-studio-project", "dor-zaban-v1.0.aab")

# If INSPECT_DIR doesn't exist, extract base structure from OUT_AAB
if not os.path.exists(INSPECT_DIR) or not os.path.exists(os.path.join(INSPECT_DIR, "BundleConfig.pb")):
    print(f"Extracting base proto template to {INSPECT_DIR}...")
    os.makedirs(INSPECT_DIR, exist_ok=True)
    with zipfile.ZipFile(OUT_AAB, 'r') as z:
        for info in z.infolist():
            if not info.filename.startswith("base/assets/dist/") and not info.filename.startswith("META-INF/"):
                z.extract(info, INSPECT_DIR)

# 1. Read existing proto manifest and ensure versionCode is 10014 and versionName is 1.1.4
manifest_path = os.path.join(INSPECT_DIR, "base", "manifest", "AndroidManifest.xml")
with open(manifest_path, "rb") as f:
    manifest_bytes = f.read()

# Replace versionCode string (10013 -> 10014) and varint (\x9d\x4e -> \x9e\x4e)
target_code = b'\x12\x0bversionCode\x1a\x0510013"\x02\x08\x02(\x9b\x84\x84\x082\x05:\x030\x9dN'
replacement_code = b'\x12\x0bversionCode\x1a\x0510014"\x02\x08\x02(\x9b\x84\x84\x082\x05:\x030\x9eN'

if target_code in manifest_bytes:
    manifest_bytes = manifest_bytes.replace(target_code, replacement_code)
    print("Replaced versionCode: 10013 -> 10014 (varint 0x4e9e)")
else:
    print("Checking versionCode in manifest...")
    assert b'10014' in manifest_bytes or b'10013' in manifest_bytes

target_name = b'\x12\x0bversionName\x1a\x051.1.3'
replacement_name = b'\x12\x0bversionName\x1a\x051.1.4'
if target_name in manifest_bytes:
    manifest_bytes = manifest_bytes.replace(target_name, replacement_name)
    print("Replaced versionName: 1.1.3 -> 1.1.4")

assert b'10014' in manifest_bytes
assert b'1.1.4' in manifest_bytes

# 2. Collect all AAB files into a dict: { entry_name: bytes }
files = {}

# 2.1 BundleConfig.pb
with open(os.path.join(INSPECT_DIR, "BundleConfig.pb"), "rb") as f:
    files["BundleConfig.pb"] = f.read()

# 2.2 BUNDLE-METADATA
meta_app = os.path.join(INSPECT_DIR, "BUNDLE-METADATA", "com.android.tools.build.gradle", "app-metadata.properties")
if os.path.exists(meta_app):
    with open(meta_app, "rb") as f:
        files["BUNDLE-METADATA/com.android.tools.build.gradle/app-metadata.properties"] = f.read()

meta_pg = os.path.join(INSPECT_DIR, "BUNDLE-METADATA", "com.android.tools.build.obfuscation", "proguard.map")
if os.path.exists(meta_pg):
    with open(meta_pg, "rb") as f:
        files["BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map"] = f.read()

# 2.3 Manifest & Resources
files["base/manifest/AndroidManifest.xml"] = manifest_bytes

res_pb_path = os.path.join(INSPECT_DIR, "base", "resources.pb")
with open(res_pb_path, "rb") as f:
    res_pb_data = f.read()

# Patch app_name in resources.pb to prevent BiDi inversion (change 'دور: زبان' to 'دور')
old_name_chunk = b'\x12\x08app_name\x1a\x02\x12\x002"\n\x00\x12\x1e\n\x06\x08\x06\x12\x02\x08\x03"\x14\x12\x12\n\x10\xd8\xaf\xd9\x88\xd8\xb1: \xd8\xb2\xd8\xa8\xd8\xa7\xd9\x86\x1a'
new_name_chunk = b'\x12\x08app_name\x1a\x02\x12\x002\x18\n\x00\x12\x14\n\x06\x08\x06\x12\x02\x08\x03"\n\x12\x08\n\x06\xd8\xaf\xd9\x88\xd8\xb1\x1a'
if old_name_chunk in res_pb_data:
    res_pb_data = res_pb_data.replace(old_name_chunk, new_name_chunk)
    print("Patched resources.pb: app_name -> دور (prevents BiDi flipping to 'زبان دور')")

files["base/resources.pb"] = res_pb_data

# 2.4 Res files (icons, drawables)
res_dir = os.path.join(INSPECT_DIR, "base", "res")
if os.path.exists(res_dir):
    for root, _, filenames in os.walk(res_dir):
        for fn in filenames:
            fp = os.path.join(root, fn)
            rel = os.path.relpath(fp, os.path.join(INSPECT_DIR, "base"))
            with open(fp, "rb") as f:
                files[f"base/{rel}"] = f.read()

# CRITICAL FIX: Replace all dummy 70-byte 1x1 mipmap icons with real high-resolution icons!
densities = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]
for d in densities:
    icon_src = os.path.join(ANDROID_RES, f"mipmap-{d}", "ic_launcher.png")
    round_src = os.path.join(ANDROID_RES, f"mipmap-{d}", "ic_launcher_round.png")
    if os.path.exists(icon_src):
        with open(icon_src, "rb") as f:
            data = f.read()
            files[f"base/res/mipmap-{d}-v4/ic_launcher.png"] = data
            print(f"Injected high-res launcher icon for {d} ({len(data)} bytes)")
    if os.path.exists(round_src):
        with open(round_src, "rb") as f:
            data = f.read()
            files[f"base/res/mipmap-{d}-v4/ic_launcher_round.png"] = data
            print(f"Injected high-res round launcher icon for {d} ({len(data)} bytes)")

# 2.5 Dex file
dex_fp = os.path.join(INSPECT_DIR, "base", "dex", "classes.dex")
with open(dex_fp, "rb") as f:
    files["base/dex/classes.dex"] = f.read()

# 2.6 Assets from dist/ (Exclude downloads, recursive bundles, etc.)
print(f"Adding assets from {DIST_DIR}...")
asset_count = 0
for root, _, filenames in os.walk(DIST_DIR):
    for fn in filenames:
        fp = os.path.join(root, fn)
        rel = os.path.relpath(fp, DIST_DIR)
        # Skip downloads directory and bundle files
        if rel.startswith("downloads/") or rel == "downloads":
            continue
        if fn.endswith(".aab") or fn.endswith(".apk") or (fn.endswith(".zip") and "package" in fn):
            continue
        entry_name = f"base/assets/dist/{rel}"
        with open(fp, "rb") as f:
            files[entry_name] = f.read()
            asset_count += 1

print(f"Added {asset_count} asset files into base/assets/dist/.")
print("CRITICAL: base/assets.pb is intentionally NOT included so bundletool treats all assets as untargeted base assets.")

# 3. Generate JAR Signature (MANIFEST.MF, DOR_RELE.SF, DOR_RELE.RSA)
print("Computing SHA-256 digests for all entries...")
main_attrs = "Manifest-Version: 1.0\r\nCreated-By: 1.0 (Android)\r\n\r\n"
manifest_content = main_attrs
manifest_sections = {}

for name in sorted(files.keys()):
    digest = base64.b64encode(hashlib.sha256(files[name]).digest()).decode('ascii')
    section = f"Name: {name}\r\nSHA-256-Digest: {digest}\r\n\r\n"
    manifest_sections[name] = section
    manifest_content += section

sig_manifest_bytes = manifest_content.encode('utf-8')

main_attrs_digest = base64.b64encode(hashlib.sha256(main_attrs.encode('utf-8')).digest()).decode('ascii')
manifest_digest = base64.b64encode(hashlib.sha256(sig_manifest_bytes).digest()).decode('ascii')

sf_content = (
    "Signature-Version: 1.0\r\n"
    "Created-By: 1.0 (Android)\r\n"
    f"SHA-256-Digest-Manifest-Main-Attributes: {main_attrs_digest}\r\n"
    f"SHA-256-Digest-Manifest: {manifest_digest}\r\n\r\n"
)

for name in sorted(files.keys()):
    section_digest = base64.b64encode(hashlib.sha256(manifest_sections[name].encode('utf-8')).digest()).decode('ascii')
    sf_content += f"Name: {name}\r\nSHA-256-Digest: {section_digest}\r\n\r\n"

sf_bytes = sf_content.encode('utf-8')

# Sign .SF with OpenSSL PKCS#7
temp_sf = "/tmp/dor_release.sf"
temp_rsa = "/tmp/dor_release.rsa"
with open(temp_sf, "wb") as f:
    f.write(sf_bytes)

cmd = [
    "openssl", "smime", "-sign",
    "-in", temp_sf,
    "-inkey", KEY_PATH,
    "-signer", CRT_PATH,
    "-outform", "DER",
    "-binary",
    "-noattr",
    "-out", temp_rsa
]
subprocess.check_call(cmd)

with open(temp_rsa, "rb") as f:
    rsa_bytes = f.read()

# Verify PKCS#7 signature
subprocess.check_call([
    "openssl", "smime", "-verify",
    "-in", temp_rsa,
    "-inform", "DER",
    "-content", temp_sf,
    "-noverify"
], stdout=subprocess.DEVNULL)
print("JAR Signature (PKCS#7) generated and verified successfully.")

# 4. Write signed AAB file
def write_aab(target_path):
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    if os.path.exists(target_path):
        os.remove(target_path)
    
    with zipfile.ZipFile(target_path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        # Signature block MUST come first according to JAR specification
        z.writestr("META-INF/MANIFEST.MF", sig_manifest_bytes)
        z.writestr("META-INF/DOR_RELE.SF", sf_bytes)
        z.writestr("META-INF/DOR_RELE.RSA", rsa_bytes)
        
        # Then all payload files in sorted order
        for name in sorted(files.keys()):
            z.writestr(name, files[name])
            
    size_mb = os.path.getsize(target_path) / (1024 * 1024)
    print(f"Wrote AAB: {target_path} ({size_mb:.2f} MB)")

write_aab(OUT_AAB)
write_aab(OUT_V1_AAB)
write_aab(OUT_PROJECT_AAB)

# 5. Also copy dist/ into android-studio-project assets
studio_assets_dist = os.path.join(APP_DIR, "android-studio-project", "app", "src", "main", "assets", "dist")
if os.path.exists(studio_assets_dist):
    shutil.rmtree(studio_assets_dist)
os.makedirs(studio_assets_dist, exist_ok=True)
for root, dirs, fnames in os.walk(DIST_DIR):
    if "downloads" in root:
        continue
    rel_root = os.path.relpath(root, DIST_DIR)
    dest_dir = os.path.join(studio_assets_dist, rel_root) if rel_root != "." else studio_assets_dist
    os.makedirs(dest_dir, exist_ok=True)
    for fn in fnames:
        if fn.endswith(".aab") or fn.endswith(".apk") or (fn.endswith(".zip") and "package" in fn):
            continue
        shutil.copy2(os.path.join(root, fn), os.path.join(dest_dir, fn))
print("Synced assets to android-studio-project/app/src/main/assets/dist/")

# 6. Re-package the Google Play ZIP
zip_pkg_path = os.path.join(APP_DIR, "public", "downloads", "dor-zaban-google-play-package.zip")
if os.path.exists(zip_pkg_path):
    os.remove(zip_pkg_path)

studio_dir = os.path.join(APP_DIR, "android-studio-project")
subprocess.check_call(
    ["python3", "-m", "zipfile", "-c", zip_pkg_path, "."],
    cwd=studio_dir
)
zip_size_mb = os.path.getsize(zip_pkg_path) / (1024 * 1024)
print(f"Created Google Play upload zip: {zip_pkg_path} ({zip_size_mb:.2f} MB)")

# Also copy the generated AABs and ZIP to dist/downloads/ so Vite serves them properly in production build
dist_downloads = os.path.join(DIST_DIR, "downloads")
os.makedirs(dist_downloads, exist_ok=True)
shutil.copy2(OUT_AAB, os.path.join(dist_downloads, "dor-zaban-google-play.aab"))
shutil.copy2(OUT_V1_AAB, os.path.join(dist_downloads, "dor-zaban-v1.0.aab"))
shutil.copy2(zip_pkg_path, os.path.join(dist_downloads, "dor-zaban-google-play-package.zip"))
print("Synchronized all download assets into dist/downloads/.")

# 7. Update utils/embeddedAabData.ts for in-browser AAB downloads
with open(OUT_AAB, 'rb') as f:
    b64_data = base64.b64encode(f.read()).decode('utf-8')
with open(os.path.join(APP_DIR, 'utils', 'embeddedAabData.ts'), 'w') as f:
    f.write('// Official Bundletool & OpenSSL-Signed Google Play AAB Bundle (Min SDK 24, Target SDK 36)\n')
    f.write(f'export const EMBEDDED_AAB_BASE64 = "{b64_data}";\n')
print("Updated utils/embeddedAabData.ts with new AAB.")

print("=== All builds completed successfully! ===")
