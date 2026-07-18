import os
import csv

# Core File System Geometrics
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Environment Flag Configurations (Zero-dependency parsing)
FLASK_DEBUG = os.environ.get("FLASK_DEBUG", "False").lower() in ("true", "1", "t")

# Data Layer File Routing Matrix
DATA_DIR = os.path.join(BASE_DIR, "data")
BARANG_CSV_PATH = os.path.join(DATA_DIR, "barang.csv")
KATEGORI_CSV_PATH = os.path.join(DATA_DIR, "kategori.csv")
SUPPLIER_CSV_PATH = os.path.join(DATA_DIR, "supplier.csv")
CUSTOMER_CSV_PATH = os.path.join(DATA_DIR, "customer.csv")

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

# Seed empty category database with column data on init
if not os.path.exists(KATEGORI_CSV_PATH):
    KATEGORI_HEADERS = [
        "id",
        "kode",
        "nama",
        "deskripsi",
        "isActive"
    ]

    with open(KATEGORI_CSV_PATH, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(KATEGORI_HEADERS)
        writer.writerow(["1", "KTG-001", "Lampu", "Semua", "TRUE"])

# Seed empty supplier database with column data on init
if not os.path.exists(SUPPLIER_CSV_PATH):
    SUPPLIER_HEADERS = [
        "id",
        "name",
        "contact",
        "phone",
        "address",
        "isActive"
    ]

    with open(SUPPLIER_CSV_PATH, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(SUPPLIER_HEADERS)
        writer.writerow(["28", "15600/16000 SM", "", "", "", "TRUE"])
        
if not os.path.exists(CUSTOMER_CSV_PATH):
    CUSTOMER_HEADERS = [
        "id",
        "name",
        "phone",
        "address",
        "priceTier"
    ]
    
    with open(CUSTOMER_CSV_PATH, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(CUSTOMER_HEADERS)
        writer.writerow(["3", "Andi", "8565644666", "Poncol", "p3"])