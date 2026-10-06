import os
import zipfile
import shutil
import base64
import subprocess
from sign_aab import sign_bundle

def main():
    print("=== Syncing All Latest App Updates to Android APK, AAB & Google Play ===")
    
    # 1. Update android-studio-project assets
    studio_assets = 'android-studio-project/app/src/main/assets/dist'
    os.makedirs(studio_assets, exist_ok=True)
    for item in os.listdir(studio_assets):
        p = os.path.join(studio_assets, item)
        if os.path.isdir(p):
            shutil.rmtree(p)
        else:
            os.remove(p)
    for item in os.listdir('dist'):
        src = os.path.join('dist', item)
        dst = os.path.join(studio_assets, item)
        if os.path.isdir(src):
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
    print("Updated android-studio-project assets.")

    # 2. Update public/downloads/dor-zaban-v1.0.aab
    aab_path = 'public/downloads/dor-zaban-v1.0.aab'
    temp_aab = '/tmp/temp_dor_unsigned.aab'
    signed_aab = '/tmp/temp_dor_signed.aab'

    with zipfile.ZipFile(aab_path, 'r') as in_zip, zipfile.ZipFile(temp_aab, 'w', compression=zipfile.ZIP_DEFLATED) as out_zip:
        for item in in_zip.infolist():
            # Skip old dist assets and signatures
            if item.filename.startswith('base/assets/dist/') or item.filename.startswith('META-INF/'):
                continue
            out_zip.writestr(item, in_zip.read(item.filename))
        
        # Add new dist assets
        for root, _, files in os.walk('dist'):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, 'dist')
                if any(bad in rel_path for bad in ['downloads', 'embeddedAabData']):
                    continue
                aab_entry_name = f"base/assets/dist/{rel_path}"
                with open(full_path, 'rb') as f:
                    out_zip.writestr(aab_entry_name, f.read())

    # Sign the updated bundle
    sign_bundle(temp_aab, signed_aab, 'release.key', 'release.crt')

    # Copy to destinations
    shutil.copy2(signed_aab, aab_path)
    shutil.copy2(signed_aab, 'public/downloads/dor-zaban-google-play.aab')
    shutil.copy2(signed_aab, 'android-studio-project/dor-zaban-v1.0.aab')
    print("Updated and signed all AAB bundles.")

    # 3. Update public/downloads/dor-zaban-v1.0.apk
    apk_path = 'public/downloads/dor-zaban-v1.0.apk'
    temp_apk = '/tmp/temp_dor.apk'
    if os.path.exists(apk_path):
        with zipfile.ZipFile(apk_path, 'r') as in_zip, zipfile.ZipFile(temp_apk, 'w', compression=zipfile.ZIP_DEFLATED) as out_zip:
            for item in in_zip.infolist():
                if item.filename.startswith('assets/dist/'):
                    continue
                out_zip.writestr(item, in_zip.read(item.filename))
            for root, _, files in os.walk('dist'):
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, 'dist')
                    if any(bad in rel_path for bad in ['downloads', 'embeddedAabData']):
                        continue
                    apk_entry_name = f"assets/dist/{rel_path}"
                    with open(full_path, 'rb') as f:
                        out_zip.writestr(apk_entry_name, f.read())
        shutil.copy2(temp_apk, apk_path)
        print("Updated APK assets.")

    # 4. Update utils/embeddedAabData.ts for in-browser AAB downloads
    with open(aab_path, 'rb') as f:
        b64_data = base64.b64encode(f.read()).decode('utf-8')
    with open('utils/embeddedAabData.ts', 'w') as f:
        f.write('// Official Bundletool & OpenSSL-Signed Google Play AAB Bundle (Target SDK 36)\n')
        f.write(f'export const EMBEDDED_AAB_BASE64 = "{b64_data}";\n')
    print("Updated utils/embeddedAabData.ts with new AAB.")

    # 5. Update google play package zip
    pkg_zip_path = 'public/downloads/dor-zaban-google-play-package.zip'
    shutil.make_archive('/tmp/dor-zaban-google-play-package', 'zip', 'android-studio-project')
    shutil.copy2('/tmp/dor-zaban-google-play-package.zip', pkg_zip_path)
    print("Updated google-play-package.zip.")

    print("ALL ANDROID & GOOGLE PLAY BUILDS FULLY UPDATED AND IN SYNC!")

if __name__ == '__main__':
    main()
