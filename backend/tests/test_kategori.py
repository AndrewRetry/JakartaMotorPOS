import sys
import unittest
from pathlib import Path

backend_root = Path(__file__).parent.parent
sys.path.insert(0, str(backend_root))

import routes.kategori as kategori_route
from app import create_app
from core.schema import KATEGORI
from core.supabase_engine import SupabaseEngine
from core.sync import MUTATION_STATES
from tests.fake_supabase import FakeSupabaseClient, TableData

SEED_CATEGORY = {
    "id": 1, "kode": "KTG-001", "nama": "Lampu",
    "deskripsi": "Semua", "is_active": True,
}


class KategoriTestCase(unittest.TestCase):
    """Test suite for the /api/kategori CRUD endpoints."""

    def setUp(self):
        self.table = TableData(
            rows=[SEED_CATEGORY],
            next_id=2,
            unique_columns=("kode",),
            required_columns=("nama",),
            # Mirrors the DDL: is_active boolean not null default true
            defaults={"kode": None, "nama": None, "deskripsi": None, "is_active": True},
        )
        # Swap the module-level engine for one backed by the fake client.
        self.original_db = kategori_route.db
        kategori_route.db = SupabaseEngine(
            KATEGORI, client=FakeSupabaseClient({"kategori": self.table})
        )

        MUTATION_STATES["kategori"] = 0.0
        self.app = create_app()
        self.client = self.app.test_client()

    def tearDown(self):
        kategori_route.db = self.original_db