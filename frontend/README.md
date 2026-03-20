# TradeLog Africa

Import/export shipment logger and document consolidator for African trade corridors.

African importers and exporters manage shipments across WhatsApp, email, and spreadsheets. Customs delays, lost documents, and data entry errors cost real money. TradeLog consolidates everything into one place — and uses the Groq API to parse trade documents automatically.

**Stack:** FastAPI · PostgreSQL · React · Groq API (llama-3.3-70b-versatile) · Docker

---

## What it does

- Track shipments from draft through to delivered with an enforced status lifecycle
- Attach trade documents (bill of lading, commercial invoice, packing list, etc.) to each shipment
- Parse uploaded documents with AI — extract structured fields automatically for human review
- Manage parties — importers, exporters, customs brokers, freight forwarders
- Generate shipment summary reports with PDF download

---

## Project structure

```
tradelog-africa/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models (Party, Shipment, Document)
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── services/        # Groq AI parser + PDF report generator
│   │   ├── db.py            # Database connection + session
│   │   └── main.py          # App entrypoint + middleware
│   ├── alembic/             # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/             # Axios API client (shipments, parties, documents)
│       ├── components/      # DocumentUpload, ParsePanel, UI helpers
│       └── pages/           # Shipments, ShipmentDetail, ShipmentReport, Parties
├── docker-compose.yml
└── .env.example
```

---

## Getting started

### Prerequisites

- Docker + docker-compose
- Node.js 18+
- Python 3.12+ (for running Alembic locally)
- Groq API key — get one free at [console.groq.com](https://console.groq.com)

### 1. Clone and configure

```bash
git clone https://github.com/Chuf-lco/tradelog-africa.git
cd tradelog-africa
cp .env.example .env
```

Edit `.env` with your values:

```bash
POSTGRES_USER=tradelog
POSTGRES_PASSWORD=your_password_here
POSTGRES_DB=tradelog_db
DATABASE_URL=postgresql://tradelog:your_password_here@localhost:5432/tradelog_db
SECRET_KEY=generate_with_openssl_rand_hex_32
GROQ_API_KEY=gsk_your_key_here
ENV=development
```

Generate a secure secret key:

```bash
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

Interactive docs available at `http://localhost:8000/docs` when the server is running.

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
| GET | `/api/v1/shipments/{id}/report/json` | Get shipment summary as JSON |
| GET | `/api/v1/shipments/{id}/report/pdf` | Download shipment summary as PDF |
| GET | `/api/v1/shipments/{id}/documents` | List documents on a shipment |
| POST | `/api/v1/shipments/{id}/documents` | Attach a document |
| POST | `/api/v1/shipments/{id}/documents/{doc_id}/parse` | Parse document with Groq AI |
| POST | `/api/v1/shipments/{id}/documents/{doc_id}/confirm` | Confirm extracted fields |
| POST | `/api/v1/shipments/{id}/documents/{doc_id}/reject` | Reject extracted fields |
| DELETE | `/api/v1/shipments/{id}/documents/{doc_id}` | Delete a document |

---

## Data model

### Party
Represents a business or individual involved in a shipment.
- Roles: `importer`, `exporter`, `agent`, `customs_broker`, `freight_forwarder`
- Stores tax PIN (KRA PIN for Kenya, TIN for Tanzania/Uganda/Rwanda)

### Shipment
Core entity — documents and parties attach here.
- Direction: `import` or `export`
- Supports Incoterms: EXW, FOB, CIF, CFR, DAP, DDP
- ETD, ETA, and ATA date fields
- HS code and commodity description for customs

### Document
A trade document attached to a shipment.
- Types: `bill_of_lading`, `airway_bill`, `commercial_invoice`, `packing_list`, `certificate_of_origin`, `customs_entry`, `phytosanitary`, `insurance_certificate`
- `parsed_data` (JSONB) — populated by the Groq API after parsing
- Status lifecycle: `uploaded → parsing → verified`

---

## Shipment status lifecycle

```
draft → in_transit → at_customs → customs_cleared → delivered
              ↕              ↕
          on_hold ←→ in_transit / at_customs
```

Status transitions are enforced server-side. Attempting an invalid transition returns a `422` with the list of allowed next states. The `on_hold` status handles real-world scenarios like KRA queries, missing PVOC certificates, and port demurrage disputes.

---

## AI document parser

The parser uses the Groq API with `llama-3.3-70b-versatile` to extract structured fields from trade documents.

**Supported document types with tailored prompts:**
- Commercial invoice — extracts invoice number, date, seller/buyer, line items, totals, currency
- Bill of lading — extracts BL number, vessel, ports, container details, ETD/ETA
- Packing list — extracts package counts, weights, volumes, item descriptions

**Parse flow:**
1. User uploads a document and attaches it to a shipment
2. Clicks **Parse with AI** and pastes the document text
3. Groq returns structured JSON fields for review
4. User confirms → fields saved to `parsed_data`, status flips to `verified`
5. User rejects → status resets to `uploaded` to try again

Verified document data is included in the shipment summary report.

---

## Report generation

Each shipment has a summary report available in two formats:

- **On-screen** — `GET /api/v1/shipments/{id}/report/json` renders a structured view in the app
- **PDF download** — `GET /api/v1/shipments/{id}/report/pdf` generates a formatted PDF using ReportLab

The report includes shipment details, route, parties (shipper and consignee), document list, and all verified AI-extracted data.

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string (`localhost` for local Alembic, `db` for Docker) |
| `POSTGRES_USER` | Postgres username |
| `POSTGRES_PASSWORD` | Postgres password |
| `POSTGRES_DB` | Database name |
| `SECRET_KEY` | App secret — generate with `openssl rand -hex 32` |
| `GROQ_API_KEY` | Groq API key from console.groq.com |
| `ENV` | `development` or `production` (controls SQL logging) |

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

### Running the frontend

```bash
cd frontend
npm run dev       # development server at localhost:5173
npm run build     # production build
npm run preview   # preview production build locally
```

---

## Roadmap

- [x] W1 — data models, CRUD API, Docker + Alembic
- [x] W2 — React frontend, status tracker, document upload UI
- [x] W3 — Groq AI document parser with review flow
- [x] W4 — shipment summary reports, PDF download, UI polish
- [ ] Deploy 
- [ ] File storage for actual PDF uploads
- [ ] Auth — user accounts and multi-tenancy

---


## License

MIT