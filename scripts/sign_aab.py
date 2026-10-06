import zipfile
import hashlib
import base64
import os
import subprocess
import shutil

def format_manifest_entry(name, digest):
    # Manifest line wrapping rule: max 72 bytes per line
    line = f"Name: {name}\r\nSHA-256-Digest: {digest}\r\n\r\n"
    return line

def sign_bundle(input_aab, output_aab, key_path, crt_path):
    print(f"Signing {input_aab} -> {output_aab}")
    
    # 1. Read all files from input AAB (excluding existing META-INF)
    files = {}
    with zipfile.ZipFile(input_aab, 'r') as z:
        for name in sorted(z.namelist()):
            if name.startswith("META-INF/"):
                continue
            files[name] = z.read(name)

    # 2. Build MANIFEST.MF
    main_attrs = "Manifest-Version: 1.0\r\nCreated-By: 1.0 (Android)\r\n\r\n"
    manifest_sections = {}
    
    manifest_content = main_attrs
    for name in sorted(files.keys()):
        digest = base64.b64encode(hashlib.sha256(files[name]).digest()).decode('ascii')
        section = f"Name: {name}\r\nSHA-256-Digest: {digest}\r\n\r\n"
        manifest_sections[name] = section
        manifest_content += section

    manifest_bytes = manifest_content.encode('utf-8')

    # 3. Build .SF file
    main_attrs_digest = base64.b64encode(hashlib.sha256(main_attrs.encode('utf-8')).digest()).decode('ascii')
    manifest_digest = base64.b64encode(hashlib.sha256(manifest_bytes).digest()).decode('ascii')

    sf_content = (
        "Signature-Version: 1.0\r\n"
        "Created-By: 1.0 (Android)\r\n"
        f"SHA-256-Digest-Manifest-Main-Attributes: {main_attrs_digest}\r\n"
        f"SHA-256-Digest-Manifest: {manifest_digest}\r\n\r\n"
    )

    for name in sorted(files.keys()):
        # The digest in .SF is the hash of the file's section in MANIFEST.MF
        section_digest = base64.b64encode(hashlib.sha256(manifest_sections[name].encode('utf-8')).digest()).decode('ascii')
        sf_content += f"Name: {name}\r\nSHA-256-Digest: {section_digest}\r\n\r\n"

    sf_bytes = sf_content.encode('utf-8')

    # Write SF to temp file
    temp_sf = "/tmp/bundle_dor.sf"
    temp_rsa = "/tmp/bundle_dor.rsa"
    with open(temp_sf, "wb") as f:
        f.write(sf_bytes)

    # 4. Sign SF with OpenSSL using PKCS#7 format
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

    # 5. Verify signature
    verify_cmd = [
        "openssl", "smime", "-verify",
        "-in", temp_rsa,
        "-inform", "DER",
        "-content", temp_sf,
        "-noverify"
    ]
    subprocess.check_call(verify_cmd, stdout=subprocess.DEVNULL)
    print("PKCS#7 signature verified successfully.")

    # 6. Assemble signed AAB (META-INF first as per JAR specification)
    if os.path.exists(output_aab):
        os.remove(output_aab)

    with zipfile.ZipFile(output_aab, 'w', compression=zipfile.ZIP_DEFLATED) as out_z:
        # Write signature files first
        out_z.writestr("META-INF/MANIFEST.MF", manifest_bytes)
        out_z.writestr("META-INF/DOR_RELE.SF", sf_bytes)
        out_z.writestr("META-INF/DOR_RELE.RSA", rsa_bytes)

        # Write all other files
        for name in sorted(files.keys()):
            out_z.writestr(name, files[name])

    size_mb = os.path.getsize(output_aab) / (1024 * 1024)
    print(f"SUCCESS: Signed bundle created at {output_aab} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    sign_bundle(
        "public/downloads/dor-zaban-v1.0.aab",
        "public/downloads/dor-zaban-v1.0.aab",
        "release.key",
        "release.crt"
    )
