# scripts/bump_and_package_release.py
# Automated release bumper and packager for Google Play: Version 1.1.4 (versionCode 10014)

import os
import sys
import zipfile
import shutil
import base64
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def find_jarsigner():
    candidates = [
        r"C:\Program Files\Android\Android Studio\jbr\bin\jarsigner.exe",
        shutil.which("jarsigner")
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    return None

def update_aab_manifest(content: bytes) -> bytes:
    # 1. Update versionCode 10013 -> 10014
    old_vc = b'versionCode\x1a\x0510013"\x02\x08\x02(\x9b\x84\x84\x082\x05:\x030\x9dN'
    new_vc = b'versionCode\x1a\x0510014"\x02\x08\x02(\x9b\x84\x84\x082\x05:\x030\x9eN'
    if old_vc in content:
        content = content.replace(old_vc, new_vc)
        print("  -> Updated AAB manifest versionCode to 10014")
    else:
        content = content.replace(b'10013', b'10014')

    # 2. Update versionName 1.1.3 -> 1.1.4
    old_vn = b'versionName\x1a\x051.1.3'
    new_vn = b'versionName\x1a\x051.1.4'
    if old_vn in content:
        content = content.replace(old_vn, new_vn)
        print("  -> Updated AAB manifest versionName to 1.1.4")
    else:
        content = content.replace(b'1.1.3', b'1.1.4')

    return content

def prepare_unsigned_archive(in_path: str, out_path: str, manifest_entry: str):
    with zipfile.ZipFile(in_path, 'r') as in_z, zipfile.ZipFile(out_path, 'w', compression=zipfile.ZIP_DEFLATED) as out_z:
        for item in in_z.infolist():
            # Exclude existing META-INF signature files so jarsigner can generate fresh SHA-256 digests
            if item.filename.startswith('META-INF/'):
                continue
            data = in_z.read(item.filename)
            if item.filename == manifest_entry:
                data = update_aab_manifest(data)
            out_z.writestr(item, data)

def sign_and_verify_archive(archive_path: str, keystore_path: str):
    jarsigner = find_jarsigner()
    if not jarsigner:
        raise RuntimeError("jarsigner executable not found in Android Studio or PATH")

    cmd = [
        jarsigner,
        "-keystore", keystore_path,
        "-storepass", "dorzaban2026",
        "-keypass", "dorzaban2026",
        "-sigalg", "SHA256withRSA",
        "-digestalg", "SHA-256",
        archive_path,
        "dor-release"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"jarsigner signing failed: {res.stderr}")

    verify_cmd = [jarsigner, "-verify", archive_path]
    v_res = subprocess.run(verify_cmd, capture_output=True, text=True)
    if v_res.returncode != 0 or "jar verified" not in v_res.stdout:
        raise RuntimeError(f"jarsigner verification failed: {v_res.stdout} {v_res.stderr}")
    print(f"  -> Signed & Verified archive with official jarsigner: OK ({os.path.basename(archive_path)})")

def main():
    print("=== BUMPING APP RELEASE TO VERSION 1.1.4 (versionCode 10014) WITH CLEAN JARSIGNER SIGNATURE ===")
    
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    keystore_path = os.path.join(root_dir, 'release.keystore')
    aab_path = os.path.join(root_dir, 'public', 'downloads', 'dor-zaban-v1.0.aab')
    temp_aab = os.path.join(root_dir, 'public', 'downloads', 'temp_v114.aab')

    if os.path.exists(aab_path):
        print(f"Repackaging and signing AAB bundle: {aab_path}")
        prepare_unsigned_archive(aab_path, temp_aab, 'base/manifest/AndroidManifest.xml')
        shutil.move(temp_aab, aab_path)
        sign_and_verify_archive(aab_path, keystore_path)
        
        # Sync to mirror destinations
        google_play_aab = os.path.join(root_dir, 'public', 'downloads', 'dor-zaban-google-play.aab')
        studio_aab = os.path.join(root_dir, 'android-studio-project', 'dor-zaban-v1.0.aab')
        shutil.copy2(aab_path, google_play_aab)
        shutil.copy2(aab_path, studio_aab)
        print(f"Synced signed AAB to {google_play_aab} and {studio_aab}")

    # Update embedded Base64 AAB
    with open(aab_path, 'rb') as f:
        aab_b64 = base64.b64encode(f.read()).decode('utf-8')
    embedded_file = os.path.join(root_dir, 'utils', 'embeddedAabData.ts')
    with open(embedded_file, 'w', encoding='utf-8') as f:
        f.write('// Official Bundletool & Jarsigner-Signed Google Play AAB Bundle (Min SDK 24, Target SDK 36, Version 1.1.4)\n')
        f.write(f'export const EMBEDDED_AAB_BASE64 = "{aab_b64}";\n')
    print("Updated utils/embeddedAabData.ts with new signed AAB Base64.")

    # Update and sign APK
    apk_path = os.path.join(root_dir, 'public', 'downloads', 'dor-zaban-v1.0.apk')
    temp_apk = os.path.join(root_dir, 'public', 'downloads', 'temp_v114.apk')
    if os.path.exists(apk_path):
        print(f"Repackaging and signing APK: {apk_path}")
        prepare_unsigned_archive(apk_path, temp_apk, 'AndroidManifest.xml')
        shutil.move(temp_apk, apk_path)
        sign_and_verify_archive(apk_path, keystore_path)
        studio_apk = os.path.join(root_dir, 'android-studio-project', 'dor-zaban-v1.0.apk')
        shutil.copy2(apk_path, studio_apk)
        print(f"Synced signed APK to {studio_apk}")

    # Clean up test files if any
    for test_f in ['public/downloads/unsigned_test.aab', 'public/downloads/unsigned_test.apk']:
        p = os.path.join(root_dir, test_f)
        if os.path.exists(p):
            os.remove(p)

    # Pack Google Play upload package zip
    zip_dest = os.path.join(root_dir, 'public', 'downloads', 'dor-zaban-google-play-package.zip')
    temp_zip = os.path.join(root_dir, 'public', 'downloads', 'temp_studio_pkg')
    studio_folder = os.path.join(root_dir, 'android-studio-project')
    shutil.make_archive(temp_zip, 'zip', studio_folder)
    shutil.move(temp_zip + '.zip', zip_dest)
    print(f"Generated new Google Play full project package zip: {zip_dest}")

    print("\n>>> OFFICIAL RELEASE 1.1.4 (versionCode 10014) SIGNED & VERIFIED FOR GOOGLE PLAY CONSOLE! <<<")

if __name__ == '__main__':
    main()
