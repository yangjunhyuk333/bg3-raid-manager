import time
import os
import glob
import json
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import random
from datetime import datetime

# --- CONFIGURATION ---
CAMP_ID = input("Enter your Camp ID (e.g., camp_123): ")
BG3_SAVE_DIR = os.path.expandvars(r'%LOCALAPPDATA%\Larian Studios\Baldur\'s Gate 3\PlayerProfiles\Public\Savegames\Story')
CREDENTIALS_PATH = "serviceAccountKey.json" # Please place your firebase admin key here

# --- SETUP ---
if not os.path.exists(CREDENTIALS_PATH):
    print(f"Error: {CREDENTIALS_PATH} not found. Please download it from Firebase Console.")
    exit(1)

cred = credentials.Certificate(CREDENTIALS_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

print(f"[*] BG3 Agent Active... Monitoring: {BG3_SAVE_DIR}")
print(f"[*] Target Camp: {CAMP_ID}")

# --- HELPER FUNCTIONS ---
def analyze_save_file(filepath):
    """
    Mock analysis simulating Larian save parsing.
    In a real scenario, this would use a binary parser.
    """
    filename = os.path.basename(filepath)
    size_mb = round(os.path.getsize(filepath) / (1024 * 1024), 2)
    
    # Random stats simulation based on 'class' likelihoods
    stats = {
        'STR': random.randint(8, 20),
        'DEX': random.randint(8, 20),
        'CON': random.randint(8, 20),
        'INT': random.randint(8, 20),
        'WIS': random.randint(8, 20),
        'CHA': random.randint(8, 20),
    }

    # Meta info
    meta = {
        'mode': 'Honour Mode' if 'Honour' in filename else 'Tactician',
        'version': '4.1.1.3622274',
        'size': f"{size_mb} MB"
    }

    # Companions
    companions = [
        {'name': 'Shadowheart', 'img': '🌙'},
        {'name': 'Astarion', 'img': '🧛'},
        {'name': 'Karlach', 'img': '🔥'}
    ]

    logs = [
        "[Parser] Header verified (LSOF v4)",
        "[Parser] Compression method: Zlib",
        f"[Analysis] Detected {len(companions)} active companions",
        "[Analysis] Romance flag: True (Target: Shadowheart)",
        "[Sync] Data prepared for upload"
    ]

    return {
        'filename': filename,
        'stats': stats,
        'meta': meta,
        'companions': companions,
        'logs': logs,
        'uploader': 'Agent_PC_01',
        'campId': CAMP_ID,
        'createdAt': firestore.SERVER_TIMESTAMP
    }

# --- MAIN LOOP ---
known_files = set()

while True:
    try:
        current_files = set(glob.glob(os.path.join(BG3_SAVE_DIR, "**/*.lsv"), recursive=True))
        
        # Detect new files
        new_files = current_files - known_files
        
        for f in new_files:
            # Skip if we already knew about it (startup sync) or handle it
            # For demo, we process anything "newly detected" in this run session
            if f not in known_files:
                print(f"[+] New Save Detected: {f}")
                data = analyze_save_file(f)
                
                # Upload to Firestore
                db.collection('save_reports_v2').add(data)
                print(f"[v] Report Uploaded to Camp {CAMP_ID}")
        
        known_files = current_files
        time.sleep(5) # Check every 5 seconds
        
    except Exception as e:
        print(f"[!] Error: {e}")
        time.sleep(5)
