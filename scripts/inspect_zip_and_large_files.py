# scripts/inspect_zip_and_large_files.py
import subprocess
import os
import zipfile
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

download_dir = os.path.join("data", "previous_folder_download")
os.makedirs(download_dir, exist_ok=True)

# 1. Download lang_level_files.zip (1Kp7En-FN4rNzRd9fWXyx5WCYcxfNEAF8)
zip_id = "1Kp7En-FN4rNzRd9fWXyx5WCYcxfNEAF8"
zip_path = os.path.join(download_dir, "lang_level_files.zip")

if not os.path.exists(zip_path):
    print("Downloading lang_level_files.zip...")
    subprocess.run(f"gdrive readonly download {zip_id} -o \"{zip_path}\"", shell=True)

if os.path.exists(zip_path):
    print(f"\nContents of lang_level_files.zip ({os.path.getsize(zip_path):,} bytes):")
    with zipfile.ZipFile(zip_path, 'r') as z:
        for info in z.infolist():
            print(f"  {info.filename:40} {info.file_size:>10,} bytes")

# 2. Download Master_Learning_Items_COMPLETE_FINAL.xlsx (1f-W8RL52QCL0m4kl7JKFapq5R9FLfVPM)
master_id = "1f-W8RL52QCL0m4kl7JKFapq5R9FLfVPM"
master_path = os.path.join(download_dir, "Master_Learning_Items_COMPLETE_FINAL.xlsx")
if not os.path.exists(master_path):
    print("\nDownloading Master_Learning_Items_COMPLETE_FINAL.xlsx...")
    subprocess.run(f"gdrive readonly download {master_id} -o \"{master_path}\"", shell=True)

if os.path.exists(master_path):
    print(f"\nMaster file size: {os.path.getsize(master_path):,} bytes")
