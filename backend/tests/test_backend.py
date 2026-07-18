import os
import csv
import unittest
from app import create_app
from routes.barang import db  # Grab the engine instance to swap its file path
import core.sync as sync

class POSBackendTestCase(unittest.TestCase):
    
    def setUp(self):
        """Set up an isolated, temporary text database for clean state testing."""
        self.test_csv_path = os.path.join(os.path.dirname(__file__), "barang.csv")
        
        # Override the routing database instance file target
        self.original_file_path = db.file_path
        db.file_path = self.test_csv_path
        
        # Seed fresh, structured test data matching your exact UI layout
        self.headers = [
            "id", "kode", "nama", "categoryId", "mitra", "tipe", 
            "stok", "modal", "p1", "p2", "p3", "p4", 
            "lokasiItem", "lokasiStock", "notes", "version"
        ]
        
        with open(self.test_csv_path, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(self.headers)
            # Row 1: Item ID 1068 (Matches your user interface target data)
            writer.writerow([
                "1068", "008321-29", "BALON HA", "1", "Mitra A", "Barang",
                "10", "21800", "34500", "24000", "25000", "26200",
                "Rak A-1", "Box 12", "Catatan Awal", "0"
            ])
            
        # Clear out synchronization matrices
        sync.MUTATION_STATES["barang"] = 0.0
        
        # Boot up the application instance test context wrapper
        self.app = create_app()
        self.client = self.app.test_client()

    def tearDown(self):
        """Clean up the system memory pointers and erase the scratch database."""
        db.file_path = self.original_file_path
        if os.path.exists(self.test_csv_path):
            os.remove(self.test_csv_path)

    # ==========================================================================
    # TESTS
    # ==========================================================================

    def test_1_get_items(self):
        """Ensure GET /api/barang streams records and appends system sync metrics."""
        response = self.client.get('/api/barang')
        self.assertEqual(response.status_code, 200)
        
        payload = response.get_json()
        self.assertIn("data", payload)
        self.assertIn("last_mutation_time", payload)
        self.assertEqual(len(payload["data"]), 1)
        self.assertEqual(payload["data"][0]["nama"], "BALON HA")

    def test_2_successful_update(self):
        """Verify successful item mutations commit cleanly and increment versions."""
        update_payload = {
            "id": "1068",
            "version": "0",  # Matching current version in CSV
            "nama": "BALON HA EDITED",
            "stok": "15",
            "modal": "21800",
            "p1": "35000"
        }
        
        response = self.client.post('/api/barang/update', json=update_payload)
        self.assertEqual(response.status_code, 200)
        
        # Verify changes wrote through directly to disk
        with open(self.test_csv_path, mode='r', encoding='utf-8') as f:
            rows = list(csv.DictReader(f))
            self.assertEqual(rows[0]["nama"], "BALON HA EDITED")
            self.assertEqual(rows[0]["stok"], "15")
            self.assertEqual(rows[0]["version"], "1")  # Incremented!

    def test_3_optimistic_concurrency_conflict(self):
        """Enforce OCC: Outdated versions MUST reject edits with a 409 Conflict."""
        conflict_payload = {
            "id": "1068",
            "version": "999",  # Completely out-of-sync version
            "nama": "HACKED ROW STATE",
            "stok": "0"
        }
        
        response = self.client.post('/api/barang/update', json=conflict_payload)
        
        # System must catch the concurrency trap and deny disk access
        self.assertEqual(response.status_code, 409)
        self.assertIn("conflict", response.get_json()["status"])

    def test_4_global_sync_check(self):
        """Validate that database changes trigger immediate synchronization updates."""
        # Step A: Capture original baseline stamp
        initial_matrix = self.client.get('/api/sync-check').get_json()["matrix"]
        initial_time = initial_matrix.get("barang", 0.0)
        
        # Step B: Perform a valid mutation to bump the system clock
        self.client.post('/api/barang/update', json={
            "id": "1068",
            "version": "0",
            "nama": "BALON HA PART TWO"
        })
        
        # Step C: Re-query matrix to ensure timestamp progressed forward
        post_matrix = self.client.get('/api/sync-check').get_json()["matrix"]
        updated_time = post_matrix.get("barang", 0.0)
        
        self.assertTrue(updated_time > initial_time)

if __name__ == '__main__':
    unittest.main()