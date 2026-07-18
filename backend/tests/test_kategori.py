import os
import csv
import sys
import unittest
from pathlib import Path

backend_root = Path(__file__).parent.parent
sys.path.insert(0, str(backend_root))

from app import create_app
from routes.kategori import db
from core.sync import MUTATION_STATES


class KategoriTestCase(unittest.TestCase):
    """Test suite for the /api/kategori CRUD endpoints."""

    def setUp(self):
        self.test_csv_path = os.path.join(os.path.dirname(__file__), "kategori_test.csv")

        self.original_file_path = db.file_path
        db.file_path = self.test_csv_path

        self.headers = ["id", "kode", "nama", "deskripsi", "isActive"]

        with open(self.test_csv_path, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(self.headers)
            writer.writerow(["1", "KTG-001", "Lampu", "Semua", "TRUE"])

        MUTATION_STATES["kategori"] = 0.0

        self.app = create_app()
        self.client = self.app.test_client()

    def tearDown(self):
        db.file_path = self.original_file_path
        if os.path.exists(self.test_csv_path):
            os.remove(self.test_csv_path)

    def test_1_list_categories(self):
        response = self.client.get('/api/kategori')
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["data"][0]["nama"], "Lampu")

    def test_2_create_category_auto_kode(self):
        response = self.client.post('/api/kategori/create', json={
            "nama": "Aki", "deskripsi": "Aki motor"
        })
        self.assertEqual(response.status_code, 201)
        payload = response.get_json()
        self.assertEqual(payload["item"]["kode"], "KTG-002")
        self.assertEqual(payload["item"]["isActive"], "TRUE")

    def test_3_create_category_missing_nama(self):
        response = self.client.post('/api/kategori/create', json={"deskripsi": "no name"})
        self.assertEqual(response.status_code, 400)

    def test_4_update_category(self):
        response = self.client.post('/api/kategori/update', json={
            "id": "1", "nama": "Lampu Motor", "isActive": False
        })
        self.assertEqual(response.status_code, 200)

        with open(self.test_csv_path, mode='r', encoding='utf-8') as f:
            rows = list(csv.DictReader(f))
            self.assertEqual(rows[0]["nama"], "Lampu Motor")
            self.assertEqual(rows[0]["isActive"], "FALSE")

    def test_5_delete_category(self):
        response = self.client.delete('/api/kategori/1')
        self.assertEqual(response.status_code, 200)

        with open(self.test_csv_path, mode='r', encoding='utf-8') as f:
            rows = list(csv.DictReader(f))
            self.assertEqual(len(rows), 0)


if __name__ == '__main__':
    unittest.main()