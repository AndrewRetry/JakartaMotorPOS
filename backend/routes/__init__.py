from .barang import barang_bp
from .kategori import kategori_bp
from .supplier import supplier_bp
from .customer import customer_bp

# As you introduce new CSV targets (e.g., transaksi_bp, mitra_bp), 
# register their blueprints here to keep app.py untouched.
__all__ = [
    "barang_bp",
    "kategori_bp",
    "supplier_bp",
    "customer_bp",
]