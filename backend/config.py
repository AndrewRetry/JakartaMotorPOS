import os
import csv

# Core File System Geometrics
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Environment Flag Configurations (Zero-dependency parsing)
FLASK_DEBUG = os.environ.get("FLASK_DEBUG", "False").lower() in ("true", "1", "t")

# Data Layer File Routing Matrix
DATA_DIR = os.path.join(BASE_DIR, "data")
BARANG_CSV_PATH = os.path.join(DATA_DIR, "barang.csv")

# ==============================================================================
# AUTOMATED DATA LAYER BOOTSTRAPPING (Self-Healing)
# ==============================================================================
os.makedirs(DATA_DIR, exist_ok=True)

# Seed empty inventory databases with column data on init
if not os.path.exists(BARANG_CSV_PATH):
    HEADERS = [
        "id", 
        "kode", 
        "nama", 
        "categoryId", 
        "mitra", 
        "tipe", 
        "stok", 
        "modal", 
        "p1", 
        "p2", 
        "p3", 
        "p4", 
        "lokasiItem", 
        "lokasiStock", 
        "notes", 
        "version"
    ]
    
    with open(BARANG_CSV_PATH, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(HEADERS)