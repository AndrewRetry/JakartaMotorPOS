import sys
import unittest
from pathlib import Path

backend_root = Path(__file__).parent.parent
sys.path.insert(0, str(backend_root))

import routes.customer as customer_route
from app import create_app
from core.schema import CUSTOMER
from core.supabase_engine import SupabaseEngine
from core.sync import MUTATION_STATES
from tests.fake_supabase import FakeSupabaseClient, TableData

SEED_CUSTOMER = {"id": 3, "name": "Andi", "phone": "8565644666",
                 "address": "Poncol", "price_tier": "p3"}


class CustomerTestCase(unittest.TestCase):
    """Test suite for the /api/customer CRUD endpoints."""

    def setUp(self):
        self.table = TableData(
            rows=[SEED_CUSTOMER],
            next_id=4,
            required_columns=("name",),
            # Mirrors the DDL: price_tier text not null default 'p1'
            defaults={"name": None, "phone": None, "address": None, "price_tier": "p1"},
        )
        self.original_db = customer_route.db
        customer_route.db = SupabaseEngine(
            CUSTOMER, client=FakeSupabaseClient({"customer": self.table})
        )

        MUTATION_STATES["customer"] = 0.0
        self.app = create_app()
        self.client = self.app.test_client()

    def tearDown(self):
        customer_route.db = self.original_db

    def test_1_list_customers(self):
        response = self.client.get('/api/customer')
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["data"][0]["name"], "Andi")

    def test_2_search_by_phone(self):
        response = self.client.get('/api/customer?q=8565')
        self.assertEqual(response.get_json()["total"], 1)

    def test_3_create_customer_defaults_p1(self):
        response = self.client.post('/api/customer/create', json={"name": "Budi"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["item"]["priceTier"], "p1")

    def test_4_create_customer_invalid_tier_falls_back(self):
        response = self.client.post('/api/customer/create', json={
            "name": "Citra", "priceTier": "p9"
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["item"]["priceTier"], "p1")

    def test_5_create_customer_respects_selected_tier(self):
        """A customer created with a VALID, non-default tier must keep it.

        This is what the create form actually sends when someone picks
        'Harga Diskon 2' in the dropdown -- distinct from test_4, which only
        proves an invalid value falls back to the default.
        """
        response = self.client.post('/api/customer/create', json={
            "name": "Dedi", "priceTier": "p3"
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["item"]["priceTier"], "p3")

    def test_6_create_customer_missing_name(self):
        response = self.client.post('/api/customer/create', json={"phone": "0812"})
        self.assertEqual(response.status_code, 400)

    def test_7_update_customer(self):
        response = self.client.post('/api/customer/update', json={
            "id": "3", "address": "Jl. Baru No. 1", "priceTier": "P4"
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.table.rows[0]["address"], "Jl. Baru No. 1")
        self.assertEqual(self.table.rows[0]["price_tier"], "p4")

    def test_8_delete_customer(self):
        response = self.client.delete('/api/customer/3')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.table.rows, [])

    def test_9_delete_missing_customer_is_404(self):
        self.assertEqual(self.client.delete('/api/customer/999').status_code, 404)

    def test_10_all_api_values_are_strings(self):
        record = self.client.get('/api/customer').get_json()["data"][0]
        for key, value in record.items():
            self.assertIsInstance(value, str, f"{key} is {type(value).__name__}")

    def test_11_phone_leading_zero_is_preserved(self):
        """customer.phone is text -- '08222657857' must not become '8222657857'."""
        response = self.client.post('/api/customer/create', json={
            "name": "Budi Dua", "phone": "08222657857"
        })
        self.assertEqual(response.get_json()["item"]["phone"], "08222657857")


if __name__ == '__main__':
    unittest.main(verbosity=2)