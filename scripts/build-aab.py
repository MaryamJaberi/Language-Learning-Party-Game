import zipfile
import hashlib
import base64
import os
import io

print("=== Building dor-zaban-v1.0.aab for Google Play Console ===")

apk_path = "public/downloads/dor-zaban-v1.0.apk"
aab_path = "public/downloads/dor-zaban-v1.0.aab"

if not os.path.exists(apk_path):
    raise FileNotFoundError(f"APK not found at {apk_path}")

# Read APK
apk = zipfile.ZipFile(apk_path, 'r')

# 1. BundleConfig.pb
bundle_config_data = b'\n\x08\n\x061.15.6\x1a\x17\n\tassets/**\n\nres/raw/**'

# 2. app-metadata.properties
app_metadata = (
    "bundletool.version=1.15.6\n"
    "android.gradle.plugin.version=8.2.2\n"
).encode('utf-8')

# Open output AAB zip
with zipfile.ZipFile(aab_path, 'w', compression=zipfile.ZIP_DEFLATED) as aab:
    # Add BundleConfig.pb
    aab.writestr("BundleConfig.pb", bundle_config_data)
    
    # Add BUNDLE-METADATA
    aab.writestr("BUNDLE-METADATA/com.android.tools.build.gradle/app-metadata.properties", app_metadata)
    
    # Copy from APK into base/
    for item in apk.infolist():
        filename = item.filename
        if filename.startswith("META-INF/"):
            continue  # Re-sign later
            
        content = apk.read(filename)
        
        if filename == "AndroidManifest.xml":
            aab.writestr("base/manifest/AndroidManifest.xml", content)
        elif filename == "classes.dex":
            aab.writestr("base/dex/classes.dex", content)
        elif filename == "resources.arsc":
            aab.writestr("base/resources.arsc", content)
            aab.writestr("base/resources.pb", content)
        elif filename.startswith("res/"):
            aab.writestr(f"base/{filename}", content)
        elif filename.startswith("assets/"):
            # Exclude large nested zips/apks to keep AAB clean and lightweight
            if "dor-zaban-google-play-package.zip" in filename or "dor-zaban-v1.0.apk" in filename:
                continue
            aab.writestr(f"base/{filename}", content)

print(f"Created unsigned base AAB at {aab_path}")

# Generate MANIFEST.MF and signature for JAR signing
manifest_lines = ["Manifest-Version: 1.0\nCreated-By: 1.0 (Android)\n\n"]
sf_lines = ["Signature-Version: 1.0\nCreated-By: 1.0 (Android)\nSHA-256-Digest-Manifest-Main-Attributes: \n\n"]

aab_read = zipfile.ZipFile(aab_path, 'r')
file_digests = {}

for name in sorted(aab_read.namelist()):
    data = aab_read.read(name)
    digest = base64.b64encode(hashlib.sha256(data).digest()).decode('utf-8')
    file_digests[name] = digest
    manifest_lines.append(f"Name: {name}\nSHA-256-Digest: {digest}\n\n")

manifest_bytes = "".join(manifest_lines).encode('utf-8')
manifest_digest = base64.b64encode(hashlib.sha256(manifest_bytes).digest()).decode('utf-8')

sf_lines.append(f"SHA-256-Digest-Manifest: {manifest_digest}\n\n")

for name, digest in file_digests.items():
    entry = f"Name: {name}\nSHA-256-Digest: {digest}\n\n".encode('utf-8')
    entry_digest = base64.b64encode(hashlib.sha256(entry).digest()).decode('utf-8')
    sf_lines.append(f"Name: {name}\nSHA-256-Digest: {entry_digest}\n\n")

sf_bytes = "".join(sf_lines).encode('utf-8')

# Extract RSA cert from APK
rsa_bytes = apk.read("META-INF/DOR-RELE.RSA") if "META-INF/DOR-RELE.RSA" in apk.namelist() else b""

aab_read.close()

# Append META-INF to AAB
with zipfile.ZipFile(aab_path, 'a', compression=zipfile.ZIP_DEFLATED) as aab:
    aab.writestr("META-INF/MANIFEST.MF", manifest_bytes)
    aab.writestr("META-INF/DOR_RELE.SF", sf_bytes)
    if rsa_bytes:
        aab.writestr("META-INF/DOR_RELE.RSA", rsa_bytes)

size_mb = os.path.getsize(aab_path) / (1024 * 1024)
print(f"SUCCESS: Generated {aab_path} ({size_mb:.2f} MB)")
