import sys
import unittest
from pathlib import Path

backend_root = Path(__file__).parent.parent
sys.path.insert(0, str(backend_root))

import routes.barang as barang_route
from app import create_app
from core.schema import BARANG
from core.supabase_engine import SupabaseEngine
from core.sync import MUTATION_STATES
from tests.fake_supabase import FakeSupabaseClient, TableData

SEED_ITEM = {
    "id": 1068, "kode": "008321-29", "nama": "BALON HA", "category_id": None,
    "mitra": "Mitra A", "tipe": "Barang", "stok": 10, "modal": 21800,
    "p1": 34500, "p2": 24000, "p3": 25000, "p4": 26200,
    "lokasi_item": "Rak A-1", "lokasi_stock": "Box 12", "notes": "Catatan Awal",
}

BARANG_DEFAULTS = {"kode": None, "nama": None, "category_id": None, "mitra": None,
                   "tipe": None, "stok": 0, "modal": 0, "p1": 0, "p2": 0, "p3": 0, "p4": 0,
                   "lokasi_item": None, "lokasi_stock": None, "notes": None}


class POSBackendTestCase(unittest.TestCase):
    """Covers the general barang list/update flow and the sync-check endpoint.

    Item-by-item OCC (version checking) was intentionally dropped from barang
    -- see routes/barang.py -- so there is no conflict test here any more.
    """

    def setUp(self):
        self.table = TableData(
            rows=[SEED_ITEM],
            next_id=1069,
            unique_columns=("kode",),
            required_columns=("kode", "nama"),
            defaults=BARANG_DEFAULTS,
        )
        self.original_db = barang_route.db
        barang_route.db = SupabaseEngine(
            BARANG, client=FakeSupabaseClient({"barang": self.table})
        )

        MUTATION_STATES["barang"] = 0.0
        self.app = create_app()
        self.client = self.app.test_client()

    def tearDown(self):
        barang_route.db = self.original_db

    def test_1_get_items(self):
        """GET /api/barang returns the list plus sync metadata."""
        response = self.client.get('/api/barang')
        self.assertEqual(response.status_code, 200)

        payload = response.get_json()
        self.assertIn("data", payload)
        self.assertIn("last_mutation_time", payload)
        self.assertEqual(len(payload["data"]), 1)
        self.assertEqual(payload["data"][0]["nama"], "BALON HA")

    def test_2_successful_update(self):
        """A normal update (no version field any more) commits cleanly."""
        response = self.client.post('/api/barang/update', json={
            "id": "1068",
            "nama": "BALON HA EDITED",
            "stok": "15",
            "modal": "21800",
            "p1": "35000",
        })
        self.assertEqual(response.status_code, 200)

        self.assertEqual(self.table.rows[0]["nama"], "BALON HA EDITED")
        self.assertEqual(self.table.rows[0]["stok"], 15)

    def test_3_update_missing_id_is_400(self):
        response = self.client.post('/api/barang/update', json={"nama": "No Id"})
        self.assertEqual(response.status_code, 400)

    def test_4_update_missing_row_is_404(self):
        response = self.client.post('/api/barang/update', json={
            "id": "999999", "nama": "Ghost"
        })
        self.assertEqual(response.status_code, 404)

    def test_5_global_sync_check(self):
        """A successful mutation must bump the entity's sync clock forward."""
        initial_matrix = self.client.get('/api/sync-check').get_json()["matrix"]
        initial_time = initial_matrix.get("barang", 0.0)

        self.client.post('/api/barang/update', json={
            "id": "1068", "nama": "BALON HA PART TWO"
        })

        post_matrix = self.client.get('/api/sync-check').get_json()["matrix"]
        updated_time = post_matrix.get("barang", 0.0)

        self.assertGreater(updated_time, initial_time)


if __name__ == '__main__':
    unittest.main(verbosity=2)