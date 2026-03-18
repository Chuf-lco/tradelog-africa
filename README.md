# TradeLog Africa

Import/export shipment logger and document consolidator for African trade corridors.

African importers and exporters manage shipments across WhatsApp, email, and spreadsheets. Customs delays, lost documents, and data entry errors cost real money. TradeLog consolidates everything into one place — and in Week 3, uses the Claude API to parse trade documents automatically.

**Live demo:** coming this March  
---

## What it does

- Track shipments from draft through to delivered with an enforced status lifecycle
- Attach trade documents (bill of lading, commercial invoice, packing list, etc.) to each shipment
- Manage parties — importers, exporters, customs brokers, freight forwarders
- (Week 3) Automatically extract fields from uploaded PDFs using the Claude API

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + SQLAlchemy + Alembic |
| Database | PostgreSQL 16 |
| Frontend | React + Vite + Axios |
| Containers | Docker + docker-compose |
| AI (W3) | Anthropic Claude API |

---

## Project structure

```
tradelog-africa/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models (Party, Shipment, Document)
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── db.py            # Database connection + session
│   │   └── main.py          # App entrypoint + middleware
│   ├── alembic/             # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/             # Axios API client (shipments, parties, documents)
│       ├── components/      # DocumentUpload
│       └── pages/           # Shipments, ShipmentDetail, Parties
├── docker-compose.yml
└── .env.example
```

---

## Getting started

### Prerequisites

- Docker + docker-compose
- Node.js 18+
- Python 3.12+ (for running Alembic locally)

### 1. Clone and configure

```bash
git clone https://github.com/Chuf-lco/tradelog-africa.git
cd tradelog-africa
cp .env.example .env
```

Edit `.env` and set your own values for `POSTGRES_PASSWORD` and `SECRET_KEY`:

```bash
# Generate a secure secret key
openssl rand -hex 32
```

### 2. Start the backend

```bash
docker compose up
```

Postgres and the FastAPI server start automatically. The API is live at `http://localhost:8000`.

### 3. Run database migrations

In a separate terminal, with Docker running:

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## API

Interactive API docs are available at `http://localhost:8000/docs` when the server is running.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/parties` | List all parties |
| POST | `/api/v1/parties` | Create a party |
| GET | `/api/v1/parties/{id}` | Get a party |
| PUT | `/api/v1/parties/{id}` | Update a party |
| DELETE | `/api/v1/parties/{id}` | Delete a party |
| GET | `/api/v1/shipments` | List shipments (filter by status/direction) |
| POST | `/api/v1/shipments` | Create a shipment |
| GET | `/api/v1/shipments/{id}` | Get shipment with party details |
| PATCH | `/api/v1/shipments/{id}` | Update shipment fields |
| PATCH | `/api/v1/shipments/{id}/status` | Advance shipment status |
| DELETE | `/api/v1/shipments/{id}` | Delete a shipment |
| GET | `/api/v1/shipments/{id}/documents` | List documents on a shipment |
| POST | `/api/v1/shipments/{id}/documents` | Attach a document |
| DELETE | `/api/v1/shipments/{id}/documents/{doc_id}` | Delete a document |

### Shipment status lifecycle

```
draft → in_transit → at_customs → customs_cleared → delivered
                  ↕                ↕
               on_hold ←→ in_transit / at_customs
```

Status transitions are enforced server-side. Attempting an invalid transition returns a `422` with the list of allowed next states.

---

## Data model

### Party
Represents a business or individual involved in a shipment.
- Roles: `importer`, `exporter`, `agent`, `customs_broker`, `freight_forwarder`
- Stores tax PIN (KRA PIN for Kenya, TIN for Tanzania/Uganda/Rwanda)

### Shipment
Core entity — documents and parties attach here.
- Tracks origin/destination countries and ports
- Supports Incoterms: EXW, FOB, CIF, CFR, DAP, DDP
- ETD, ETA, and ATA date fields
- HS code and commodity description for customs

### Document
A trade document attached to a shipment.
- Types: bill of lading, airway bill, commercial invoice, packing list, certificate of origin, customs entry, phytosanitary, insurance certificate
- `parsed_data` (JSONB) — populated by the Claude API in Week 3
- Status lifecycle: `uploaded → parsing → parsed → verified`

---

## Development

### Running Alembic migrations

```bash
cd backend

# Generate a new migration after model changes
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string (use `localhost` for local Alembic, `db` for Docker) |
| `POSTGRES_USER` | Postgres username |
| `POSTGRES_PASSWORD` | Postgres password |
| `POSTGRES_DB` | Database name |
| `SECRET_KEY` | App secret — generate with `openssl rand -hex 32` |
| `ENV` | `development` or `production` (controls SQL logging) |

---

## Roadmap

— data models, CRUD API, Docker + Alembic
— React frontend, status tracker, document upload UI
— Claude API document parser (extracts fields from uploaded PDFs)
— shipment summary report generation, Vercel/Render deploy, dev log

---

---

## License

MIT
