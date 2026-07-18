from .barang import barang_bp

# As you introduce new CSV targets (e.g., transaksi_bp, mitra_bp), 
# register their blueprints here to keep app.py untouched.
__all__ = [
    "barang_bp"
]