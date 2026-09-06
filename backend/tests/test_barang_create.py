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
    "id": 1000, "kode": "CODE-001", "nama": "Item A", "category_id": 1,
    "mitra": "Mitra A", "tipe": "Barang", "stok": 100, "modal": 50000,
    "p1": 75000, "p2": 80000, "p3": 85000, "p4": 90000,
    "lokasi_item": "Rak A", "lokasi_stock": "Box 1", "notes": "Initial item",
}

BARANG_DEFAULTS = {"kode": None, "nama": None, "category_id": None, "mitra": None,
                   "tipe": None, "stok": 0, "modal": 0, "p1": 0, "p2": 0, "p3": 0, "p4": 0,
                   "lokasi_item": None, "lokasi_stock": None, "notes": None}


class BarangCreateTestCase(unittest.TestCase):
    """
    Test suite for the POST /api/barang/create endpoint.
    Validates: id assignment, field normalization, and error handling.
    """

    def setUp(self):
        self.table = TableData(
            rows=[SEED_ITEM],
            # A real Postgres identity column continues from wherever the
            # imported data's sequence was set to (see db/02_fix_sequences.sql),
            # not from a max(id)+1 computed on each request -- so the next id
            # here is fixed at seed-time, exactly like `setval(..., 1000, true)`.
            next_id=1001,
            unique_columns=("kode",),
            required_columns=("kode", "nama"),
            # kategori ids that exist, standing in for barang.category_id's
            # foreign key -- an id outside this set is rejected, just like
            # `references kategori(id)` would reject it in real Postgres.
            foreign_keys={"category_id": {1, 2, 3}},
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

    # ========================================================================
    # HAPPY PATH TESTS
    # ========================================================================

    def test_1_create_item_minimal_fields(self):
        """Only kode/nama supplied; id comes from the identity column."""
        response = self.client.post('/api/barang/create', json={
            "kode": "CODE-002", "nama": "New Item"
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()

        self.assertEqual(data["status"], "success")
        self.assertEqual(data["id"], "1001")  # continues the seeded sequence
        self.assertEqual(data["item"]["kode"], "CODE-002")
        self.assertEqual(data["item"]["nama"], "New Item")

    def test_2_create_item_all_fields(self):
        """All optional fields provided; text fields are trimmed."""
        response = self.client.post('/api/barang/create', json={
            "kode": "  CODE-003  ", "nama": "  Premium Item  ",
            "categoryId": "2", "mitra": "Mitra B", "tipe": "Barang",
            "stok": "250", "modal": "100000", "p1": "150000", "p2": "160000",
            "p3": "170000", "p4": "180000", "lokasiItem": "Rak B-2",
            "lokasiStock": "Box 5", "notes": "Full details provided",
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()

        self.assertEqual(data["item"]["kode"], "CODE-003")
        self.assertEqual(data["item"]["nama"], "Premium Item")
        self.assertEqual(data["item"]["categoryId"], "2")
        self.assertEqual(data["item"]["modal"], "100000")
        self.assertEqual(data["item"]["p1"], "150000")

    def test_3_create_item_with_blank_category_is_null_not_zero(self):
        """
        A blank categoryId (an unselected dropdown) must become NULL, not 0.

        category_id is a nullable foreign key to kategori(id); no kategori
        with id 0 exists, so silently defaulting a blank value to 0 -- rather
        than leaving it NULL -- would violate that foreign key in production.
        """
        response = self.client.post('/api/barang/create', json={
            "kode": "CODE-004", "nama": "Sparse Item",
            "categoryId": "", "mitra": "", "lokasiItem": "Rak C", "lokasiStock": "",
        })
        self.assertEqual(response.status_code, 201, response.get_json())
        data = response.get_json()

        self.assertEqual(data["item"]["categoryId"], "")
        self.assertEqual(data["item"]["mitra"], "")
        self.assertEqual(data["item"]["lokasiItem"], "Rak C")

    def test_4_create_multiple_items_sequential_ids(self):
        response1 = self.client.post('/api/barang/create',
                                     json={"kode": "CODE-005", "nama": "Item 5"})
        self.assertEqual(response1.get_json()["id"], "1001")

        response2 = self.client.post('/api/barang/create',
                                     json={"kode": "CODE-006", "nama": "Item 6"})
        self.assertEqual(response2.get_json()["id"], "1002")

    def test_5_create_item_persists_to_database(self):
        response = self.client.post('/api/barang/create', json={
            "kode": "CODE-007", "nama": "Persistent Item", "stok": "50"
        })
        self.assertEqual(response.status_code, 201)
        new_id = int(response.get_json()["id"])

        self.assertEqual(len(self.table.rows), 2)  # original + new
        new_row = next((row for row in self.table.rows if row["id"] == new_id), None)
        self.assertIsNotNone(new_row)
        self.assertEqual(new_row["nama"], "Persistent Item")
        self.assertEqual(new_row["stok"], 50)

    # ========================================================================
    # ERROR HANDLING TESTS
    # ========================================================================

    def test_6_create_item_missing_kode(self):
        response = self.client.post('/api/barang/create', json={"nama": "Item Without Code"})
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data["status"], "error")
        self.assertIn("kode", data["message"])

    def test_7_create_item_missing_nama(self):
        response = self.client.post('/api/barang/create', json={"kode": "CODE-008"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("nama", response.get_json()["message"])

    def test_8_create_item_invalid_json_is_400(self):
        """request.get_json(silent=True) always yields a clean 400, not a 500."""
        response = self.client.post('/api/barang/create', data='not valid json',
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_9_create_item_empty_body(self):
        response = self.client.post('/api/barang/create', json={})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["status"], "error")

    def test_10_duplicate_kode_is_rejected(self):
        response = self.client.post('/api/barang/create', json={
            "kode": "CODE-001", "nama": "Duplicate Code"
        })
        self.assertEqual(response.status_code, 409)

    # ========================================================================
    # EDGE CASES
    # ========================================================================

    def test_11_numeric_fields_are_returned_as_strings(self):
        """Rule 2: every API value is a string, even when the input wasn't."""
        response = self.client.post('/api/barang/create', json={
            "kode": "CODE-010", "nama": "Numeric Test", "stok": 500, "modal": 75000,
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()

        self.assertIsInstance(data["item"]["stok"], str)
        self.assertEqual(data["item"]["stok"], "500")
        self.assertIsInstance(data["item"]["modal"], str)

    def test_12_special_characters_are_preserved(self):
        response = self.client.post('/api/barang/create', json={
            "kode": "CODE-SP-011", "nama": "Item dengan spasi & karakter: khusus!"
        })
        self.assertEqual(response.status_code, 201)
        self.assertIn("spasi", response.get_json()["item"]["nama"])

    def test_13_whitespace_only_field_becomes_empty_string(self):
        response = self.client.post('/api/barang/create', json={
            "kode": "CODE-012", "nama": "Item", "notes": "   \t\n  "
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["item"]["notes"], "")

    def test_14_unicode_characters_are_handled(self):
        response = self.client.post('/api/barang/create', json={
            "kode": "CODE-UNI-012", "nama": "Item ñ é ü 中文 日本語", "mitra": "Mitra ÄÖÜ",
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertIn("中文", data["item"]["nama"])
        self.assertIn("ÄÖÜ", data["item"]["mitra"])

    def test_15_response_includes_full_item(self):
        response = self.client.post('/api/barang/create', json={
            "kode": "CODE-FULL", "nama": "Full Response Test",
            "categoryId": "3", "stok": "100", "modal": "50000",
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()

        item = data["item"]
        self.assertEqual(item["kode"], "CODE-FULL")
        self.assertEqual(item["nama"], "Full Response Test")
        self.assertEqual(item["categoryId"], "3")
        self.assertEqual(item["stok"], "100")
        self.assertEqual(item["id"], data["id"])

    def test_16_zero_values_are_not_treated_as_blank(self):
        response = self.client.post('/api/barang/create', json={
            "kode": "CODE-ZERO", "nama": "Zero Values", "stok": "0", "modal": "0", "p1": "0",
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertEqual(data["item"]["stok"], "0")
        self.assertEqual(data["item"]["modal"], "0")
        self.assertEqual(data["item"]["p1"], "0")

    def test_17_large_field_values(self):
        large_notes = "A" * 1000
        response = self.client.post('/api/barang/create', json={
            "kode": "CODE-LARGE", "nama": "Large Fields", "notes": large_notes,
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["item"]["notes"], large_notes)


if __name__ == '__main__':
    unittest.main(verbosity=2)