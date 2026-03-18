from fastapi import FastAPI
from app.routers import parties, shipments, documents

app = FastAPI(
    title="TradeLog Africa",
    description="Import/export shipment logger and document consolidator",
    version="0.1.0",
)


app.include_router(parties.router, prefix="/api/v1")
app.include_router(shipments.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")

@app.get("/health")
def health():
    return {"status": "ok"}