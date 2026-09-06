# Jakarta Motor POS

A point-of-sale / inventory management system for a motorcycle-parts shop (my brother's SME in my hometown, Indonesia). The
UI is in Indonesian. 

- **Backend:** Flask 3, Python 3.11+, data stored in [Supabase](https://supabase.com) (Postgres)
- **Frontend:** React 18 + Vite + Tailwind

The backend was originally CSV-file based and was migrated to Supabase; see
[Data model](#data-model) and [Known limitations](#known-limitations) below
for what that migration did and did not change.

## Prerequisites

- Python 3.11+
- Node 18+
- Supabase [supabase.com](https://supabase.com)

## Setup

### 1. Create the schema

In Supabase **SQL Editor**, run the two files in order:

```
backend/db/01_schema.sql          # creates kategori, supplier, customer, barang schemas
backend/db/02_fix_sequences.sql   # only needed after importing existing data (step 3)
```

`01_schema.sql` also enables Row Level Security with **no policies** on every
table. That is deliberate: the backend authenticates with the `service_role`
key, which bypasses RLS entirely, so the app works with zero policies written.
It also means the `anon` key can't touch these tables at all — nothing in
this app talks to Supabase from the browser today, so that's the correct
default. Don't disable RLS to "make something work"; if the app can't reach
the data, the problem is almost always a stale schema cache or the wrong key
in `.env`, not a missing policy.

### 2. Configure environment variables

```bash
cp .env.example backend/.env
```

Fill in `backend/.env` with your project's URL and **service_role** key
(Project Settings → API in the Supabase dashboard):

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
```

The service-role key is a full-database credential — it bypasses every
Row Level Security policy. It must only ever live in `backend/.env` as it is a secret

### 3. Install dependencies

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 4. Import the existing data (first-time setup only)

`backend/data/*.csv` holds the original dataset (20,494 inventory items, 89
suppliers, 9 customers, 1 category). Load it into Supabase with:

```bash
cd backend
python -m scripts.import_csv
```

This is safe to re-run — rows are upserted by id, so running it again after
a schema change converges to the CSV instead of failing on duplicate keys.
It does **not** touch the sequences that generate new ids for records created
through the app, which is why step 1 told you to run `02_fix_sequences.sql`
right after: skip it and the first item you create in the UI will collide
with an existing id and fail with a duplicate-key error.

### 5. Run it

```bash
# Terminal 1 — backend (from backend/)
python app.py

# Terminal 2 — frontend (from frontend/)
npm run dev
```

Open **http://localhost:3000**. Vite proxies `/api/*` to the Flask backend on
port 5000 (see `frontend/vite.config.js`), so there's no CORS setup needed in
development.

### 6. Verify the setup

```bash
cd backend
python -m unittest discover tests   # runs offline against an in-memory fake — see Testing below
python -m scripts.smoke_test        # requires the backend running + data imported
```

`smoke_test.py` checks row counts, search, and response shapes against your
actual Supabase project. Expect it to report **20494 / 1 / 89 / 9** rows for
barang / kategori / supplier / customer.

## Project structure

```
backend/
  app.py                  Flask app factory + blueprint registration
  config.py                Environment-driven settings (FLASK_DEBUG)
  wsgi.py                  Entry point for gunicorn
  core/
    schema.py              Table definitions: columns, types, search fields
    supabase_client.py      Creates the cached Supabase client from .env
    supabase_engine.py       CRUD engine every route uses -- the whole data layer
    sync.py                 In-memory "did anything change" clock the frontend polls
  routes/
    barang.py, kategori.py, supplier.py, customer.py, common.py
  db/
    01_schema.sql           Table definitions, indexes, RLS -- run once per project
    02_fix_sequences.sql    Aligns id sequences after importing existing data
  scripts/
    import_csv.py           One-time (re-runnable) load of data/*.csv into Supabase
    smoke_test.py            Read-only sanity check against a running backend
  data/*.csv                 Original dataset -- kept as historical record, no longer read by the app
  tests/
    fake_supabase.py         In-memory stand-in for the Supabase client
    test_*.py                Route tests, run against the fake -- no network needed

frontend/
  App.jsx                   Hand-rolled routing (no react-router)
  screens/, components/     One folder per entity (inventory, category, supplier, customer)
```

## Data model

Four tables, all in the `public` schema:

| Table | Notes |
|---|---|
| `kategori` | Inventory categories. `kode` auto-generates as `KTG-001`, `KTG-002`, ... |
| `supplier` | |
| `customer` | `price_tier` (`p1`-`p4`) selects which of `barang.p1`-`p4` that customer pays |
| `barang` | Inventory items. `category_id` is a nullable FK to `kategori`; `kode` is a unique SKU |

Two conventions worth knowing before touching this code:

- **The database uses `snake_case`, the API uses `camelCase`.** Postgres
  folds unquoted identifiers to lowercase, so `categoryId` as a column name
  would silently become `categoryid` and break every hand-written SQL query.
  `core/schema.py` holds the five-entry mapping (`categoryId` ↔ `category_id`,
  etc.); everything else passes through unchanged.
- **Every value the API returns is a string**, even booleans and numbers
  (`"stok": "10"`, `"isActive": "TRUE"`). This matches what the CSV-based
  backend always returned, and the React frontend depends on it — e.g. a
  `<select>`'s `value` prop is compared as a string. `core/supabase_engine.py`
  enforces this at the boundary; database columns themselves are properly
  typed (`integer`, `boolean`, nullable FK).

## Testing

```bash
cd backend
python -m unittest discover tests
```

Tests run against `tests/fake_supabase.py`, an in-memory stand-in for the
Supabase client — no network, no `.env`, no risk of touching real data. It
simulates the three constraint violations the app relies on (`required`,
`unique`, `foreign key`) closely enough to catch real bugs; two were found
this way:

- **Customer price tiers were silently ignored on create/update** — the
  route read `price_tier` but the frontend sends `priceTier`.
- **Blank category on a new item would violate the `barang → kategori`
  foreign key** — a blank `categoryId` was defaulting to `0` instead of
  `NULL`, and no category with id `0` exists.

For an end-to-end check against your actual Supabase project, use
`python -m scripts.smoke_test` (requires the backend running and the data
imported) instead of pointing the unit tests at a real database.

## Known limitations

Carried over from the original CSV-based app, not introduced by the Supabase
migration:

- **No authentication.** Every endpoint, including deletes, is open. There is
  no login screen and no concept of a user.
- **No transaction modules.** Sales, purchases, and stock movements
  (Penjualan, Pembelian, Stok) are UI stubs only; `barang.stok` is a plain
  mutable integer with no ledger behind it.
- **Change notification is 3-second polling**, not push. `core/sync.py`
  tracks an in-memory "last changed" timestamp per table; three frontend
  screens poll it. This is also why it won't notice edits made directly in
  Supabase Studio, and why it resets on every backend restart. Supabase
  Realtime would be the natural replacement.
- **No search index yet.** `barang` search does an `ILIKE` scan over ~20k
  rows. Fine at this size; a `pg_trgm` GIN index is the next step if it ever
  needs to be faster.
