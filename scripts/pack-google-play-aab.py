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

OUT_AAB = os.path.join(APP_DIR, "public", "downloads", "dor-zaban-google-play.aab")
OUT_V1_AAB = os.path.join(APP_DIR, "public", "downloads", "dor-zaban-v1.0.aab")
OUT_PROJECT_AAB = os.path.join(APP_DIR, "android-studio-project", "dor-zaban-v1.0.aab")

# 1. Read existing proto manifest and update versionCode to 10014 and versionName to 1.1.4
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
    print("Warning: target_code pattern not matched directly, checking if 10014 already present")
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

res_pb = os.path.join(INSPECT_DIR, "base", "resources.pb")
with open(res_pb, "rb") as f:
    files["base/resources.pb"] = f.read()

# 2.4 Res files (icons, drawables)
res_dir = os.path.join(INSPECT_DIR, "base", "res")
for root, _, filenames in os.walk(res_dir):
    for fn in filenames:
        fp = os.path.join(root, fn)
        rel = os.path.relpath(fp, os.path.join(INSPECT_DIR, "base"))
        with open(fp, "rb") as f:
            files[f"base/{rel}"] = f.read()

# 2.5 Dex file
dex_fp = os.path.join(INSPECT_DIR, "base", "dex", "classes.dex")
with open(dex_fp, "rb") as f:
    files["base/dex/classes.dex"] = f.read()

# 2.6 Assets from dist/ (CRITICAL FIX: Include all web assets, especially assets/index-*.js, css, but exclude dist/downloads)
print(f"Adding assets from {DIST_DIR}...")
asset_count = 0
for root, _, filenames in os.walk(DIST_DIR):
    for fn in filenames:
        fp = os.path.join(root, fn)
        rel = os.path.relpath(fp, DIST_DIR)
        # Skip downloads directory
        if rel.startswith("downloads/") or rel == "downloads":
            continue
        # Also ensure no recursive .aab or .zip
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

manifest_bytes = manifest_content.encode('utf-8')

main_attrs_digest = base64.b64encode(hashlib.sha256(main_attrs.encode('utf-8')).digest()).decode('ascii')
manifest_digest = base64.b64encode(hashlib.sha256(manifest_bytes).digest()).decode('ascii')

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
        z.writestr("META-INF/MANIFEST.MF", manifest_bytes)
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

print("=== All builds completed successfully! ===")
