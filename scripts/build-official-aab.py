import zipfile
import hashlib
import base64
import os
import subprocess

print("=== Building Official Google Play AAB with Proto Manifest and Resources ===")

proto_apk_path = "/tmp/proto_apk.zip"
apk_path = "public/downloads/dor-zaban-v1.0.apk"
aab_out = "public/downloads/dor-zaban-v1.0.aab"
key_path = "release.key"
crt_path = "release.crt"

proto_zip = zipfile.ZipFile(proto_apk_path, 'r')
apk_zip = zipfile.ZipFile(apk_path, 'r')

files = {}

# 1. BundleConfig.pb
files["BundleConfig.pb"] = b'\n\x08\n\x061.15.6\x1a\x17\n\tassets/**\n\nres/raw/**'

# 2. BUNDLE-METADATA
files["BUNDLE-METADATA/com.android.tools.build.gradle/app-metadata.properties"] = (
    "bundletool.version=1.15.6\n"
    "android.gradle.plugin.version=8.2.2\n"
).encode('utf-8')

# 3. Proto Manifest & Resources from proto_apk.zip
files["base/manifest/AndroidManifest.xml"] = proto_zip.read("AndroidManifest.xml")
files["base/resources.pb"] = proto_zip.read("resources.pb")

# Res files from proto_zip
for name in proto_zip.namelist():
    if name.startswith("res/"):
        files[f"base/{name}"] = proto_zip.read(name)

# 4. Dex bytecode from APK
files["base/dex/classes.dex"] = apk_zip.read("classes.dex")

# 5. Assets from APK (excluding large package zips/apks)
for name in apk_zip.namelist():
    if name.startswith("assets/"):
        if "google-play-package.zip" in name or "dor-zaban-v1.0.apk" in name:
            continue
        files[f"base/{name}"] = apk_zip.read(name)

proto_zip.close()
apk_zip.close()

# 6. Generate MANIFEST.MF
main_attrs = "Manifest-Version: 1.0\r\nCreated-By: 1.0 (Android)\r\n\r\n"
manifest_content = main_attrs
manifest_sections = {}

for name in sorted(files.keys()):
    digest = base64.b64encode(hashlib.sha256(files[name]).digest()).decode('ascii')
    section = f"Name: {name}\r\nSHA-256-Digest: {digest}\r\n\r\n"
    manifest_sections[name] = section
    manifest_content += section

manifest_bytes = manifest_content.encode('utf-8')

# 7. Generate .SF
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

# 8. Sign .SF using OpenSSL PKCS#7
temp_sf = "/tmp/bundle_dor.sf"
temp_rsa = "/tmp/bundle_dor.rsa"
with open(temp_sf, "wb") as f:
    f.write(sf_bytes)

cmd = [
    "openssl", "smime", "-sign",
    "-in", temp_sf,
    "-inkey", key_path,
    "-signer", crt_path,
    "-outform", "DER",
    "-binary",
    "-noattr",
    "-out", temp_rsa
]
subprocess.check_call(cmd)

with open(temp_rsa, "rb") as f:
    rsa_bytes = f.read()

# 9. Verify PKCS#7 signature
subprocess.check_call([
    "openssl", "smime", "-verify",
    "-in", temp_rsa,
    "-inform", "DER",
    "-content", temp_sf,
    "-noverify"
], stdout=subprocess.DEVNULL)
print("Signature verified successfully.")

# 10. Write final signed AAB (META-INF entries first as required by JAR spec)
if os.path.exists(aab_out):
    os.remove(aab_out)

with zipfile.ZipFile(aab_out, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    z.writestr("META-INF/MANIFEST.MF", manifest_bytes)
    z.writestr("META-INF/DOR_RELE.SF", sf_bytes)
    z.writestr("META-INF/DOR_RELE.RSA", rsa_bytes)
    for name in sorted(files.keys()):
        z.writestr(name, files[name])

size_mb = os.path.getsize(aab_out) / (1024 * 1024)
print(f"SUCCESS: Built official signed AAB at {aab_out} ({size_mb:.2f} MB)")
