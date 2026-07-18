import os
import csv
import sys
import unittest
from pathlib import Path

backend_root = Path(__file__).parent.parent
sys.path.insert(0, str(backend_root))

from app import create_app
from routes.customer import db
from core.sync import MUTATION_STATES


class CustomerTestCase(unittest.TestCase):
    """Test suite for the /api/customer CRUD endpoints."""

    def setUp(self):
        self.test_csv_path = os.path.join(os.path.dirname(__file__), "customer_test.csv")

        self.original_file_path = db.file_path
        db.file_path = self.test_csv_path

        self.headers = ["id", "name", "phone", "address", "priceTier"]

        with open(self.test_csv_path, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(self.headers)
            writer.writerow(["3", "Andi", "8565644666", "Poncol", "p3"])

        MUTATION_STATES["customer"] = 0.0

        self.app = create_app()
        self.client = self.app.test_client()

    def tearDown(self):
        db.file_path = self.original_file_path
        if os.path.exists(self.test_csv_path):
            os.remove(self.test_csv_path)

    def test_1_list_customers(self):
        response = self.client.get('/api/customer')
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["data"][0]["name"], "Andi")

    def test_2_search_by_phone(self):
        response = self.client.get('/api/customer?q=8565')
        payload = response.get_json()
        self.assertEqual(payload["total"], 1)

    def test_3_create_customer_defaults_p1(self):
        response = self.client.post('/api/customer/create', json={"name": "Budi"})
        self.assertEqual(response.status_code, 201)
        payload = response.get_json()
        self.assertEqual(payload["item"]["priceTier"], "p1")

    def test_4_create_customer_invalid_tier_falls_back(self):
        response = self.client.post('/api/customer/create', json={
            "name": "Citra", "priceTier": "p9"
        })
        self.assertEqual(response.status_code, 201)
        payload = response.get_json()
        self.assertEqual(payload["item"]["priceTier"], "p1")

    def test_5_create_customer_missing_name(self):
        response = self.client.post('/api/customer/create', json={"phone": "0812"})
        self.assertEqual(response.status_code, 400)

    def test_6_update_customer(self):
        response = self.client.post('/api/customer/update', json={
            "id": "3", "address": "Jl. Baru No. 1", "priceTier": "P4"
        })
        self.assertEqual(response.status_code, 200)

        with open(self.test_csv_path, mode='r', encoding='utf-8') as f:
            rows = list(csv.DictReader(f))
            self.assertEqual(rows[0]["address"], "Jl. Baru No. 1")
            self.assertEqual(rows[0]["priceTier"], "p4")

    def test_7_delete_customer(self):
        response = self.client.delete('/api/customer/3')
        self.assertEqual(response.status_code, 200)

        with open(self.test_csv_path, mode='r', encoding='utf-8') as f:
            rows = list(csv.DictReader(f))
            self.assertEqual(len(rows), 0)


if __name__ == '__main__':
    unittest.main()